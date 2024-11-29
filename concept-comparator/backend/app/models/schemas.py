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

# class ColexificationData(BaseModel):
#     """Data about colexification patterns for a concept"""
#     concept: str
#     colexified_concepts: List[str]
#     family_frequencies: Dict[str, float]  # family -> frequency
#     languages: List[str]
#     semantic_field: Optional[str] = None
#     category: Optional[str] = None
#     detailed_colexifications: List[ColexificationLink]
#     total_languages: int

class FamilyPattern(BaseModel):
    """Detailed colexification data for a language family"""
    proportion: float
    languages_with_colexification: List[str]
    total_languages_in_family: int
    indirect_languages: Optional[List[str]] = None
    intermediate_concepts: Optional[List[Dict[str, Union[str, int]]]] = None

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
    """Complete comparison result including detailed colexification data"""
    main_similarity: float
    main_translations: tuple[str, str]
    variation_similarities: List[Dict]
    usage_notes: Dict[str, str]
    language_colexifications: Dict[str, List[LanguageColexification]]
    family_colexifications: Dict[str, FamilyColexifications]