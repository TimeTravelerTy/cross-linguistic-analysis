from pydantic import BaseModel
from typing import List, Dict, Optional, Union

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