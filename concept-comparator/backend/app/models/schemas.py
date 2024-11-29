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

class ColexificationLink(BaseModel):
    """Represents a colexification connection"""
    concept: str
    frequency: int  # How many languages in CLICS show this colexification
    languages: List[str]  # Which languages show this pattern

class ColexificationData(BaseModel):
    """Data about colexification patterns for a concept"""
    concept: str
    colexified_concepts: List[str]
    family_frequencies: Dict[str, float]  # family -> frequency
    languages: List[str]
    semantic_field: Optional[str] = None
    category: Optional[str] = None
    detailed_colexifications: List[ColexificationLink]
    total_languages: int

class FamilyPattern(BaseModel):
    """Detailed colexification data for a language family"""
    proportion: float
    languages_with_colexification: List[str]
    total_languages_in_family: int
    indirect_languages: Optional[List[str]] = None
    intermediate_concepts: Optional[List[Dict[str, Union[str, int]]]] = None

class ComparisonResult(BaseModel):
    """Complete comparison result including detailed colexification data"""
    main_similarity: float
    main_translations: tuple[str, str]
    variation_similarities: List[Dict]
    usage_notes: Dict[str, str]
    colexification_data: Dict[str, List[ColexificationLink]]
    family_patterns: Dict[str, FamilyPattern] | None