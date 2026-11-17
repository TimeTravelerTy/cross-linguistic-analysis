from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Dict, Optional, AsyncGenerator
from app.models.schemas import (
    WordSense,
    ComparisonRequest,
    ComparisonResult,
    ConceptAnchor,
    StudyRequest,
    SemanticMapResponse,
    SemanticChainResponse,
)
from app.services.clics import ClicsService
from app.services.concept_registry import ConceptRegistryService
from app.services.colexification import ColexificationService
from app.services.study_pipeline import StudyPipelineService
from app.services.language_metadata import LanguageMetadataService
from app.constants.supported_languages import SUPPORTED_LANGUAGES
from dotenv import load_dotenv
import importlib
import logging
import os
import json
import asyncio
from pathlib import Path

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _LazyService:
    """
    Instantiate a service on first use. The legacy pairwise endpoints
    (/word-senses, /compare-concepts) need LaBSE, WordNet and an LLM client;
    loading those eagerly made startup slow even though the main study flow
    never touches them.
    """

    def __init__(self, module: str, cls: str) -> None:
        self._module, self._cls, self._instance = module, cls, None

    def __getattr__(self, name: str):
        if self._instance is None:
            logger.info("Loading %s on first use", self._cls)
            self._instance = getattr(importlib.import_module(self._module), self._cls)()
        return getattr(self._instance, name)


clics_service = ClicsService()
language_metadata = LanguageMetadataService(
    Path(__file__).resolve().parents[1] / "data" / "clics" / "clics.sqlite"
)

app = FastAPI(title="Cross-Linguistic Concept Comparator API")

# Legacy pairwise-comparison services (loaded lazily)
disambiguation_service = _LazyService("app.services.disambiguation", "DisambiguationService")
translation_service = _LazyService("app.services.translation", "TranslationService")
embedding_service = _LazyService("app.services.embedding", "EmbeddingService")

# Study services
try:
    registry_service = ConceptRegistryService()
    colex_service = ColexificationService(clics_service, language_metadata)
    study_pipeline = StudyPipelineService(colex_service, registry_service)
    _atlas_available = True
    logger.info("Study services initialised")
except Exception as e:
    registry_service = None  # type: ignore
    colex_service = None  # type: ignore
    study_pipeline = None  # type: ignore
    _atlas_available = False
    logger.error("Study services unavailable (run scripts/run_ingestion.py first): %s", e)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/word-senses/{word}", response_model=List[WordSense])
async def get_word_senses(word: str):
    """Get possible word senses for disambiguation"""
    logger.info(f"Received request for word senses: {word}")
    try:
        senses = disambiguation_service.get_word_senses(word)
        if not senses:
            logger.warning(f"No word senses found for: {word}")
            raise HTTPException(status_code=404, detail="No word senses found")
        logger.info(f"Found {len(senses)} senses for word: {word}")
        return senses
    except Exception as e:
        logger.error(f"Error processing word senses for {word}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
async def process_language(
    request: ComparisonRequest,
    lang: str,
    lang_name: str,
    family: str | None
) -> ComparisonResult:
    """Process a single language comparison"""
    # Get language-specific colexifications
    concept1_colexs = clics_service.get_language_colexifications(
        request.concept1, 
        lang
    )
    
    concept2_colexs = clics_service.get_language_colexifications(
        request.concept2,
        lang
    ) 

    # Get translations
    trans1 = translation_service.get_translation(
        request.concept1, 
        request.sense_id1, 
        lang_name
    )
    
    trans2 = translation_service.get_translation(
        request.concept2,
        request.sense_id2,
        lang_name
    )
    
    # Get embeddings
    emb1 = embedding_service.get_embedding(trans1.main_translation, lang_name, request.concept1)
    emb2 = embedding_service.get_embedding(trans2.main_translation, lang_name, request.concept2)
    
    # Calculate similarity
    main_similarity = embedding_service.compute_similarity(emb1, emb2)
    
    # Process variations
    variation_similarities = []
    
    # Compare variations from trans1 with main translation and variations of trans2
    if trans1.variations:
        # Compare trans1 variations with trans2 main translation
        for var1 in trans1.variations:
            var_emb1 = embedding_service.get_embedding(var1.word, lang_name, request.concept1)
            emb2 = embedding_service.get_embedding(trans2.main_translation, lang_name, request.concept2)
            sim = embedding_service.compute_similarity(var_emb1, emb2)
            variation_similarities.append({
                "similarity": float(sim),
                "context": f"{var1.context} (Variation) - Main translation",
                "words": (var1.word, trans2.main_translation)
            })
            
            # If trans2 has variations, compare with those too
            if trans2.variations:
                for var2 in trans2.variations:
                    var_emb2 = embedding_service.get_embedding(var2.word, lang_name, request.concept2)
                    sim = embedding_service.compute_similarity(var_emb1, var_emb2)
                    variation_similarities.append({
                        "similarity": float(sim),
                        "context": f"{var1.context} - {var2.context}",
                        "words": (var1.word, var2.word)
                    })
    
    # Compare variations from trans2 with main translation of trans1
    if trans2.variations:
        # Compare trans2 variations with trans1 main translation
        for var2 in trans2.variations:
            var_emb2 = embedding_service.get_embedding(var2.word, lang_name, request.concept2)
            emb1 = embedding_service.get_embedding(trans1.main_translation, lang_name, request.concept1)
            sim = embedding_service.compute_similarity(emb1, var_emb2)
            variation_similarities.append({
                "similarity": float(sim),
                "context": f"Main translation - {var2.context} (Variation)",
                "words": (trans1.main_translation, var2.word)
            })
    
    # Sort variations by similarity score
    variation_similarities.sort(key=lambda x: x["similarity"], reverse=True)
    
    return ComparisonResult(
        main_similarity=float(main_similarity),
        main_translations=(trans1.main_translation, trans2.main_translation),
        embeddings=(emb1.tolist(), emb2.tolist()),
        variation_similarities=variation_similarities,
        usage_notes={
            "concept1": trans1.usage_notes,
            "concept2": trans2.usage_notes
        },
        language_colexifications={
            request.concept1: concept1_colexs,
            request.concept2: concept2_colexs
        },
        family_colexifications={}  # We'll add this later when we have all results
    )

@app.post("/compare-concepts", response_model=Dict[str, ComparisonResult])
async def compare_concepts(request: ComparisonRequest):
    """Compare concepts with both embedding similarities and colexification patterns"""
    try:
        results = {}
        
        # Get language families for the requested languages
        families = set()
        for lang in request.languages:
            family = get_language_family(lang)
            if family:
                families.add(family)

        logger.debug(f"Requested families: {families}")

        # Get detailed family colexification patterns
        family_colexifications = clics_service.get_family_colexifications(
            request.concept1,
            request.concept2,
            families=list(families)
        ) 
        
        for lang in request.languages:
            lang_name = SUPPORTED_LANGUAGES[lang]['name']
            logger.debug(f"Processing language: {lang_name}")
            family = get_language_family(lang)
            
            try:
                # Use the shared process_language function
                result = await process_language(request, lang, lang_name, family)
                
                # Add family colexifications
                if family:
                    result.family_colexifications = family_colexifications
                
                results[lang] = result
                
            except Exception as e:
                logger.error(f"Error processing language {lang}: {str(e)}")
                # Skip this language and continue with others
                continue
        
        if not results:
            raise HTTPException(status_code=500, detail="Failed to process any languages")
            
        return results
        
    except Exception as e:
        logger.error(f"Error in comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages with their metadata"""
    return SUPPORTED_LANGUAGES

def get_language_family(lang_code: str) -> Optional[str]:
    """Get language family for a language code using our supported languages data"""
    if lang_code in SUPPORTED_LANGUAGES:
        return SUPPORTED_LANGUAGES[lang_code]['family']
    return None

async def stream_comparison_results(request: ComparisonRequest) -> AsyncGenerator[str, None]:
    """Stream comparison results with progress updates"""
    try:
        results = {}
        total_languages = len(request.languages)
        
        # Get language families for the requested languages
        families = set()
        for lang in request.languages:
            family = get_language_family(lang)
            if family:
                families.add(family)

        # Get detailed family colexification patterns
        family_colexifications = clics_service.get_family_colexifications(
            request.concept1,
            request.concept2,
            families=list(families)
        )
        
        for idx, lang in enumerate(request.languages):
            lang_name = SUPPORTED_LANGUAGES[lang]['name']
            family = get_language_family(lang)
            
            try:
                # Process the language
                result = await process_language(request, lang, lang_name, family)
                
                # Add family colexifications
                if family:
                    result.family_colexifications = family_colexifications
                
                results[lang] = result.model_dump()
                
                # Send progress update
                progress = {
                    "progress": round((idx + 1) * 100 / total_languages),
                    "current_language": lang_name,
                    "processed": idx + 1,
                    "total": total_languages
                }
                
                # Include full results only in final update
                if idx + 1 == total_languages:
                    progress["results"] = results
                    
                yield f"data: {json.dumps(progress)}\n\n"
                await asyncio.sleep(0.1)  # Small delay to prevent overwhelming
                
            except Exception as e:
                logger.error(f"Error processing language {lang}: {str(e)}")
                # Skip this language and continue with others
                continue
                
    except Exception as e:
        error_data = {"error": str(e)}
        yield f"data: {json.dumps(error_data)}\n\n"

@app.post("/compare-concepts-progress")
async def compare_concepts_with_progress(request: ComparisonRequest):
    """Compare concepts with progress updates via server-sent events"""
    return StreamingResponse(
        stream_comparison_results(request),
        media_type="text/event-stream"
    )

@app.get("/semantic-chains/{concept1}/{concept2}")
async def get_semantic_chains(
    concept1: str,
    concept2: str,
    family: Optional[str] = None,
    max_depth: int = Query(3, ge=2, le=4),
):
    """Semantic chains between two CLICS glosses (legacy, gloss-based)."""
    chains = clics_service.find_chains(concept1.upper(), concept2.upper(), family, max_depth)
    return {"chains": chains, "family": family, "concepts": [concept1, concept2]}


@app.get("/chains", response_model=SemanticChainResponse)
def get_chains(
    a: str = Query(..., description="Concepticon ID of concept A"),
    b: str = Query(..., description="Concepticon ID of concept B"),
    family: Optional[str] = Query(None, description="Restrict links to one language family"),
    max_depth: int = Query(3, ge=2, le=4, description="Maximum number of links"),
    limit: int = Query(12, ge=1, le=30),
):
    """
    Indirect colexification chains between two concepts, strongest first.
    Each link is a colexification attested in the sample (one family, or all
    of CLICS), e.g. WEATHER -> SKY -> GOD.
    """
    _require_atlas()
    anchor_a = registry_service.get_by_id(a)
    anchor_b = registry_service.get_by_id(b)
    if not anchor_a or not anchor_b:
        raise HTTPException(status_code=404, detail="Concept not found")

    chains = colex_service.get_chains(anchor_a, anchor_b, family or None, max_depth, limit)
    direct = colex_service.get_direct_evidence(anchor_a, anchor_b)
    if family:
        family_langs = clics_service.family_language_map.get(family, set())
        direct_count = sum(1 for lang in direct.direct_languages if lang in family_langs)
    else:
        direct_count = direct.direct_count
    return SemanticChainResponse(
        concept_a=anchor_a.label,
        concept_b=anchor_b.label,
        family=family,
        direct_count=direct_count,
        chains=chains,
    )


@app.get("/search-clics-concepts/{query}")
async def search_clics_concepts(query: str):
    """Search CLICS concepts matching query string"""
    try:
        matches = clics_service.search_concepts(query)
        return {
            "matches": matches,
            "total": len(matches)
        }
    except Exception as e:
        logger.error(f"Error searching CLICS concepts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error searching CLICS concepts: {str(e)}"
        )

@app.get("/clics-concepts")
async def get_clics_concepts():
    """Get all concepts in CLICS vocabulary"""
    try:
        concepts = clics_service.get_all_concepts()
        return {
            "concepts": concepts,
            "total": len(concepts)
        }
    except Exception as e:
        logger.error(f"Error getting CLICS concepts: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting CLICS concepts: {str(e)}"
        )


# ---------------------------------------------------------------------------
# Atlas API endpoints (multi-concept, Concepticon-anchored)
# ---------------------------------------------------------------------------

def _require_atlas():
    if not _atlas_available:
        raise HTTPException(
            status_code=503,
            detail="Atlas services not available. Run backend/scripts/run_ingestion.py first.",
        )


@app.get("/concepts", response_model=List[ConceptAnchor])
async def search_concepts(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(12, ge=1, le=50),
):
    """
    Search the Concepticon registry by concept label.

    Ranking: exact/prefix matches first, then concepts linked to CLICS, then
    concepts attested in more languages, so "DAY" suggests DAY (NOT NIGHT)
    rather than an unlinked or rare sense.
    """
    _require_atlas()
    query = q.strip().upper()
    candidates = registry_service.search(q, limit=max(limit * 4, 40))

    def rank(anchor: ConceptAnchor):
        label = anchor.label.upper()
        match = 0 if label == query else 1 if label.startswith(query) else 2
        node = clics_service._get_node_by_gloss(anchor.clics_gloss) if anchor.clics_gloss else None
        frequency = clics_service.graph.nodes[node].get("LanguageFrequency", 0) if node else -1
        return (node is None, match, -frequency, label)

    return sorted(candidates, key=rank)[:limit]


@app.get("/concepts/by-id", response_model=List[ConceptAnchor])
async def get_concepts_by_id(
    ids: str = Query(..., description="Comma-separated Concepticon IDs"),
):
    """Resolve Concepticon IDs to concepts (used to restore shared study links)."""
    _require_atlas()
    anchors = []
    for raw in ids.split(",")[:6]:
        anchor = registry_service.get_by_id(raw.strip())
        if anchor:
            anchors.append(anchor)
    return anchors


@app.get("/concepts/{concepticon_id}/neighbors")
async def get_concept_neighbors(
    concepticon_id: str,
    limit: int = Query(10, ge=1, le=30),
):
    """Return concepts in the same semantic field (quick neighbor approximation)."""
    _require_atlas()
    anchor = registry_service.get_by_id(concepticon_id)
    if not anchor:
        raise HTTPException(status_code=404, detail="Concept not found")
    neighbors = registry_service.get_neighbors(concepticon_id, limit=limit)
    return {"anchor": anchor, "neighbors": neighbors}


@app.get("/dataset-versions")
async def get_dataset_versions():
    """Return versions of all ingested data sources."""
    _require_atlas()
    return registry_service.get_dataset_versions()


@app.get("/semantic-map", response_model=SemanticMapResponse)
async def get_semantic_map(
    concepts: str = Query(..., description="Comma-separated Concepticon IDs or labels"),
    max_neighbors: int = Query(15, ge=1, le=40),
    family: Optional[str] = Query(None, description="Filter to a specific language family"),
):
    """
    Return the CLICS colexification neighborhood graph for the selected concepts.
    When family is given, counts and neighbors are filtered to that family only.
    """
    _require_atlas()
    raw_ids = [c.strip() for c in concepts.split(",") if c.strip()]
    if not raw_ids or len(raw_ids) > 6:
        raise HTTPException(status_code=400, detail="Provide 1–6 concept IDs or labels")

    anchors: list[ConceptAnchor] = []
    for raw in raw_ids:
        anchor = registry_service.get_by_id(raw) or registry_service.get_by_label(raw.upper())
        if not anchor:
            raise HTTPException(status_code=404, detail=f"Concept not found: {raw!r}")
        anchors.append(anchor)

    return colex_service.get_semantic_map(
        anchors, max_neighbors=max_neighbors, family_filter=family or None
    )


async def _stream_study(request: StudyRequest):
    """Generator for SSE-streamed study results."""
    try:
        async for update in study_pipeline.stream(request):
            # Serialize Pydantic models before JSON encoding
            if "result" in update and hasattr(update["result"], "model_dump"):
                update = {**update, "result": update["result"].model_dump()}
            yield f"data: {json.dumps(update, default=str)}\n\n"
            await asyncio.sleep(0)
    except Exception as e:
        logger.error(f"Study pipeline error: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@app.get("/health")
async def health():
    return {"status": "ok", "study_services": _atlas_available}


@app.get("/families")
async def get_families():
    """Return all language family names present in the CLICS graph, sorted by language count."""
    _require_atlas()
    family_map = clics_service.family_language_map
    families = [
        {"name": family, "language_count": len(langs)}
        for family, langs in family_map.items()
    ]
    families.sort(key=lambda x: -x["language_count"])
    return families


@app.post("/study-progress")
async def run_study_with_progress(request: StudyRequest):
    """
    Run a multi-concept cross-linguistic study with SSE streaming progress.
    Accepts 2–6 ConceptAnchor objects and an optional list of family names.
    """
    _require_atlas()
    if not (2 <= len(request.concepts) <= 6):
        raise HTTPException(status_code=400, detail="Provide 2–6 concepts")

    return StreamingResponse(
        _stream_study(request),
        media_type="text/event-stream",
    )


@app.get("/test-clics/{concept}")
async def test_clics(concept: str):
    """Test endpoint for CLICS integration"""
    try:
        results = clics_service.get_colexifications(concept)
        return {
            "status": "success",
            "concept": concept,
            "results": results.model_dump() if results else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"CLICS test failed: {str(e)}"
        )
    

    
    