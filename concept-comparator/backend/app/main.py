from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Dict, Optional, AsyncGenerator
from app.services.disambiguation import DisambiguationService
from app.services.translation import TranslationService
from app.services.embedding import EmbeddingService
from app.models.schemas import (
    WordSense, 
    ComparisonRequest, 
    ComparisonResult,
)
from app.services.clics import ClicsService
from app.models.schemas import ComparisonResult
from dotenv import load_dotenv
import logging
import json
import asyncio

# Load environment variables
load_dotenv()

clics_service = ClicsService()
print("Done creating `clics_service`—about to create `app`!")
app = FastAPI()
print("Done creating `app`—about to run the rest of main.py!")

# Initialize services
disambiguation_service = DisambiguationService()
translation_service = TranslationService()
embedding_service = EmbeddingService()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    # Indo-European - Germanic
    'eng': {'name': 'English', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'deu': {'name': 'German', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'nld': {'name': 'Dutch', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'fry': {'name': 'Frisian', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'isl': {'name': 'Icelandic', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'nor': {'name': 'Norwegian', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'dan': {'name': 'Danish', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    'swe': {'name': 'Swedish', 'family': 'Indo-European', 'subfamily': 'Germanic'},
    
    # Indo-European - Romance
    'fra': {'name': 'French', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'spa': {'name': 'Spanish', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'ita': {'name': 'Italian', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'por': {'name': 'Portuguese', 'family': 'Indo-European', 'subfamily': 'Romance'},
    'ron': {'name': 'Romanian', 'family': 'Indo-European', 'subfamily': 'Romance'},
    
    # Indo-European - Slavic
    'rus': {'name': 'Russian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'pol': {'name': 'Polish', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'ces': {'name': 'Czech', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'bel': {'name': 'Belarusian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'bul': {'name': 'Bulgarian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'srp': {'name': 'Serbian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'hrv': {'name': 'Croatian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'slk': {'name': 'Slovak', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    'slv': {'name': 'Slovene', 'family': 'Indo-European', 'subfamily': 'Slavic'},
    
    # Indo-European - Baltic
    'lav': {'name': 'Latvian', 'family': 'Indo-European', 'subfamily': 'Baltic'},
    'lit': {'name': 'Lithuanian', 'family': 'Indo-European', 'subfamily': 'Baltic'},
    
    # Indo-European - Indo-Iranian
    'hin': {'name': 'Hindi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'ben': {'name': 'Bengali', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'urd': {'name': 'Urdu', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'pan': {'name': 'Punjabi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'mar': {'name': 'Marathi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'guj': {'name': 'Gujarati', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'nep': {'name': 'Nepali', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'sin': {'name': 'Sinhala', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
    'fas': {'name': 'Persian', 'family': 'Indo-European', 'subfamily': 'Iranian'},
    'tgk': {'name': 'Tajik', 'family': 'Indo-European', 'subfamily': 'Iranian'},
    
    # Indo-European - Celtic
    'gle': {'name': 'Irish', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    'gla': {'name': 'Scottish Gaelic', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    'cym': {'name': 'Welsh', 'family': 'Indo-European', 'subfamily': 'Celtic'},
    
    # Indo-European - Other
    'ell': {'name': 'Greek', 'family': 'Indo-European', 'subfamily': 'Hellenic'},
    'hye': {'name': 'Armenian', 'family': 'Indo-European', 'subfamily': 'Armenian'},
    'sqi': {'name': 'Albanian', 'family': 'Indo-European', 'subfamily': 'Albanian'},
    
    # Afroasiatic
    'ara': {'name': 'Arabic', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'heb': {'name': 'Hebrew', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'amh': {'name': 'Amharic', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'mlt': {'name': 'Maltese', 'family': 'Afro-Asiatic', 'subfamily': 'Semitic'},
    'hau': {'name': 'Hausa', 'family': 'Afro-Asiatic', 'subfamily': 'Chadic'},
    'som': {'name': 'Somali', 'family': 'Afro-Asiatic', 'subfamily': 'Cushitic'},
    
    # Sino-Tibetan
    'zho': {'name': 'Mandarin Chinese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
    'yue': {'name': 'Cantonese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
    'bod': {'name': 'Tibetan', 'family': 'Sino-Tibetan', 'subfamily': 'Tibetic'},
    
    # Japonic
    'jpn': {'name': 'Japanese', 'family': 'Japonic', 'subfamily': 'Japanese'},
    
    # Koreanic
    'kor': {'name': 'Korean', 'family': 'Koreanic', 'subfamily': 'Korean'},
    
    # Mongolic
    'mon': {'name': 'Mongolian', 'family': 'Mongolic', 'subfamily': 'Mongolian'},
    
    # Austroasiatic
    'vie': {'name': 'Vietnamese', 'family': 'Austroasiatic', 'subfamily': 'Vietic'},
    'khm': {'name': 'Khmer', 'family': 'Austroasiatic', 'subfamily': 'Khmer'},
    
    # Tai-Kadai
    'tha': {'name': 'Thai', 'family': 'Tai-Kadai', 'subfamily': 'Tai'},
    'lao': {'name': 'Lao', 'family': 'Tai-Kadai', 'subfamily': 'Tai'},
    
    # Dravidian
    'mal': {'name': 'Malayalam', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    'tam': {'name': 'Tamil', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    'tel': {'name': 'Telugu', 'family': 'Dravidian', 'subfamily': 'South Central Dravidian'},
    'kan': {'name': 'Kannada', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
    
    # Austronesian
    'msa': {'name': 'Malay', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'ind': {'name': 'Indonesian', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'jav': {'name': 'Javanese', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'ceb': {'name': 'Cebuano', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'tgl': {'name': 'Tagalog', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'sun': {'name': 'Sundanese', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'mlg': {'name': 'Malagasy', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
    'mri': {'name': 'Maori', 'family': 'Austronesian', 'subfamily': 'Polynesian'},
    
    # Turkic
    'tur': {'name': 'Turkish', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'azj': {'name': 'Azerbaijani', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'tuk': {'name': 'Turkmen', 'family': 'Turkic', 'subfamily': 'Oghuz'},
    'uzb': {'name': 'Uzbek', 'family': 'Turkic', 'subfamily': 'Karluk'},
    'uig': {'name': 'Uyghur', 'family': 'Turkic', 'subfamily': 'Karluk'},
    'kaz': {'name': 'Kazakh', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    'kir': {'name': 'Kyrgyz', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    'tat': {'name': 'Tatar', 'family': 'Turkic', 'subfamily': 'Kipchak'},
    
    # Uralic
    'fin': {'name': 'Finnish', 'family': 'Uralic', 'subfamily': 'Finnic'},
    'est': {'name': 'Estonian', 'family': 'Uralic', 'subfamily': 'Finnic'},
    'hun': {'name': 'Hungarian', 'family': 'Uralic', 'subfamily': 'Ugric'},
    
    # Atlantic-Congo
    'swa': {'name': 'Swahili', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'zul': {'name': 'Zulu', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'sna': {'name': 'Shona', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'nya': {'name': 'Nyanja', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'xho': {'name': 'Xhosa', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'sot': {'name': 'Sotho', 'family': 'Atlantic-Congo', 'subfamily': 'Bantu'},
    'yor': {'name': 'Yoruba', 'family': 'Atlantic-Congo', 'subfamily': 'Volta-Niger'},
    'ibo': {'name': 'Igbo', 'family': 'Atlantic-Congo', 'subfamily': 'Volta-Niger'},
    'wol': {'name': 'Wolof', 'family': 'Atlantic-Congo', 'subfamily': 'Atlantic'},
    
    # Others
    'kat': {'name': 'Georgian', 'family': 'Kartvelian', 'subfamily': 'Kartvelian'},
    'eus': {'name': 'Basque', 'family': 'Language Isolate', 'subfamily': 'None'},
}

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

        print(f"Requested families: {families}") 

        # Get detailed family colexification patterns
        family_colexifications = clics_service.get_family_colexifications(
            request.concept1,
            request.concept2,
            families=list(families)
        ) 
        
        for lang in request.languages:
            lang_name = SUPPORTED_LANGUAGES[lang]['name']
            print(f"Processing language: {lang_name}")
            family = get_language_family(lang)
            
            try:
                # Use the shared process_language function
                result = await process_language(request, lang, lang_name, family)
                
                # Add family colexifications
                if family:
                    result.family_colexifications = family_colexifications
                
                results[lang] = result
                
            except Exception as e:
                print(f"Error processing language {lang}: {str(e)}")
                # Skip this language and continue with others
                continue
        
        if not results:
            raise HTTPException(status_code=500, detail="Failed to process any languages")
            
        return results
        
    except Exception as e:
        print(f"Error in comparison: {str(e)}")
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
    family: str,
    max_depth: int = 4
):
    """Get semantic chains between two concepts within a language family."""
    try:
        chains = clics_service.find_chains(
            concept1.upper(),  # CLICS uses uppercase
            concept2.upper(),
            family,
            max_depth
        )
        
        return {
            "chains": chains,
            "family": family,
            "concepts": [concept1, concept2]
        }
        
    except Exception as e:
        logger.error(f"Error finding semantic chains: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error finding semantic chains: {str(e)}"
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
    

    
    