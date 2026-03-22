from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any

class WordSense(BaseModel):
    synset_id: str
    definition: str
    examples: List[str]
    lemma_names: List[str]
    category: str

class TranslationVariant(BaseModel):
    word: str
    context: str
    nuance: str

class Translation(BaseModel):
    main_translation: str
    variations: List[TranslationVariant]
    usage_notes: str

class ComparisonRequest(BaseModel):
    concept1: str
    sense_id1: str
    concept2: str
    sense_id2: str
    languages: List[str]

class FamilyColexificationData(BaseModel):
    """Detailed colexification data for concepts within a family"""
    frequency: int
    languages: List[str]

class FamilyColexifications(BaseModel):
    """Complete colexification patterns for a family"""
    concept1_colexifications: Dict[str, FamilyColexificationData]
    concept2_colexifications: Dict[str, FamilyColexificationData]
    direct_colexification: FamilyColexificationData
    total_languages: int

class LanguageColexification(BaseModel):
    """Represents a colexification for a specific language"""
    concept: str
    present: bool

class ComparisonResult(BaseModel):
    main_similarity: float
    main_translations: tuple[str, str]
    embeddings: tuple[List[float], List[float]]  # Add embeddings
    variation_similarities: List[Dict]
    usage_notes: Dict[str, str]
    language_colexifications: Dict[str, List[LanguageColexification]]
    family_colexifications: Dict[str, FamilyColexifications]


# ---------------------------------------------------------------------------
# Atlas / Concept-study models (multi-concept, Concepticon-anchored)
# ---------------------------------------------------------------------------

class ConceptAnchor(BaseModel):
    """Canonical concept identity via Concepticon."""
    concepticon_id: str       # e.g. "1277"
    label: str                # e.g. "HAND"
    clics_gloss: Optional[str] = None  # CLICS GML Gloss (None if not in CLICS)
    semantic_field: Optional[str] = None


class ColexificationEvidence(BaseModel):
    """
    Raw, attested cross-linguistic evidence for a concept pair.
    No composite score — each source of evidence is listed separately
    so researchers can judge significance themselves.
    """
    # Direct colexification: both concepts share one word form in these languages
    direct_languages: List[str] = []
    direct_families: List[str] = []
    direct_count: int = 0

    # Partial colexification (Rubehn & List 2025)
    affix_languages: List[str] = []    # one word is an affix/stem of the other
    affix_direction: Optional[str] = None  # "A→B" | "B→A"
    overlap_languages: List[str] = []  # shared substring pattern

    # Semantic chain paths through the CLICS graph
    chain_paths: List[List[str]] = []
    chain_min_length: Optional[int] = None

    # Supplementary signal (LaBSE / BGE-M3) — clearly labelled as secondary
    embedding_similarity: Optional[float] = None

    # Data quality indicators (not a score)
    clics_coverage: bool = False       # both concepts are in CLICS
    omw_coverage: int = 0              # number of languages with OMW anchors


class ColexResult(BaseModel):
    """Colexification evidence for one concept pair."""
    concept_a: str                     # concepticon_id
    concept_b: str
    label_a: str
    label_b: str
    evidence: ColexificationEvidence


class LanguagePartition(BaseModel):
    """
    How a language lexically organises the selected concepts.
    Concepts in the same group share a word form (are colexified).
    """
    language: str
    language_name: str
    family: str
    merged_groups: List[List[str]]     # each inner list = concepts merged in one word
    split_count: int                   # number of distinct lexical items used


class StudyRequest(BaseModel):
    """Request to run a multi-concept study."""
    concepts: List[ConceptAnchor]      # 2–6 concepts
    families: List[str] = []           # family names to drill into (optional)
    show_translations: bool = False    # triggers TranslateGemma calls


class StudyResult(BaseModel):
    """Full result of a multi-concept cross-linguistic study."""
    concepts: List[ConceptAnchor]
    # pair_matrix[id_a][id_b] = ColexResult (only lower triangle populated)
    pair_matrix: Dict[str, Dict[str, ColexResult]]
    # language_partitions[lang_code] = which concepts merge/split
    language_partitions: Dict[str, LanguagePartition]
    # family_profiles[family] = colexification rates per pair
    family_profiles: Dict[str, Any]
    # 128-dim Node2Vec embeddings for UMAP (keyed by concepticon_id)
    colexification_embeddings: Dict[str, List[float]]
    # Optional surface translations (keyed by lang_code, then concept index)
    translations: Optional[Dict[str, List[str]]] = None
    dataset_versions: Dict[str, str] = {}


class SemanticMapNode(BaseModel):
    """Node in the CLICS colexification neighborhood graph."""
    concept: str               # Concepticon label or CLICS gloss
    concepticon_id: Optional[str] = None
    semantic_field: Optional[str] = None
    is_selected: bool = False  # True = one of the user's chosen concepts
    family_frequency: int = 0
    language_frequency: int = 0


class SemanticMapEdge(BaseModel):
    """Colexification edge between two concepts."""
    source: str
    target: str
    weight: float              # normalised (0–1); higher = more languages attest this
    direct_count: int = 0      # raw number of attesting languages
    languages: List[str] = []


class SemanticMapResponse(BaseModel):
    nodes: List[SemanticMapNode]
    edges: List[SemanticMapEdge]
    concepts: List[str]        # the user's selected concept labels