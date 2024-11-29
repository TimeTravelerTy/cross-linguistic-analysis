from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from app.services.disambiguation import DisambiguationService
from app.services.translation import TranslationService
from app.services.embedding import EmbeddingService
from app.models.schemas import (
    WordSense, 
    ComparisonRequest, 
    ComparisonResult,
    Translation
)
from app.services.clics import ClicsService, ColexificationData
from app.models.schemas import ComparisonResult
from app.constants.clics_mappings import get_clics_codes
import numpy as np
from scipy.spatial.distance import cosine
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

clics_service = ClicsService()

app = FastAPI()

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
        'eng': {'name': 'English', 'family': 'Indo-European', 'subfamily': 'Germanic'},
        'deu': {'name': 'German', 'family': 'Indo-European', 'subfamily': 'Germanic'},
        'nld': {'name': 'Dutch', 'family': 'Indo-European', 'subfamily': 'Germanic'},
        'swe': {'name': 'Swedish', 'family': 'Indo-European', 'subfamily': 'Germanic'},
        
        'fra': {'name': 'French', 'family': 'Indo-European', 'subfamily': 'Romance'},
        'spa': {'name': 'Spanish', 'family': 'Indo-European', 'subfamily': 'Romance'},
        'ita': {'name': 'Italian', 'family': 'Indo-European', 'subfamily': 'Romance'},
        'por': {'name': 'Portuguese', 'family': 'Indo-European', 'subfamily': 'Romance'},
        'ron': {'name': 'Romanian', 'family': 'Indo-European', 'subfamily': 'Romance'},
        
        'rus': {'name': 'Russian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
        'pol': {'name': 'Polish', 'family': 'Indo-European', 'subfamily': 'Slavic'},
        'ces': {'name': 'Czech', 'family': 'Indo-European', 'subfamily': 'Slavic'},
        'bul': {'name': 'Bulgarian', 'family': 'Indo-European', 'subfamily': 'Slavic'},
        
        'hin': {'name': 'Hindi', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
        'ben': {'name': 'Bengali', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
        'urd': {'name': 'Urdu', 'family': 'Indo-European', 'subfamily': 'Indo-Aryan'},
        
        'ell': {'name': 'Greek', 'family': 'Indo-European', 'subfamily': 'Hellenic'},
        'hye': {'name': 'Armenian', 'family': 'Indo-European', 'subfamily': 'Armenian'},
        
        'ara': {'name': 'Arabic', 'family': 'Afroasiatic', 'subfamily': 'Semitic'},
        'heb': {'name': 'Hebrew', 'family': 'Afroasiatic', 'subfamily': 'Semitic'},
        'amh': {'name': 'Amharic', 'family': 'Afroasiatic', 'subfamily': 'Semitic'},
        
        'zho': {'name': 'Chinese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
        'yue': {'name': 'Cantonese', 'family': 'Sino-Tibetan', 'subfamily': 'Sinitic'},
        'bod': {'name': 'Tibetan', 'family': 'Sino-Tibetan', 'subfamily': 'Tibetic'},
        
        'jpn': {'name': 'Japanese', 'family': 'Japonic', 'subfamily': 'Japanese'},
        'kor': {'name': 'Korean', 'family': 'Koreanic', 'subfamily': 'Korean'},
        'vie': {'name': 'Vietnamese', 'family': 'Austroasiatic', 'subfamily': 'Vietic'},
        'khm': {'name': 'Khmer', 'family': 'Austroasiatic', 'subfamily': 'Khmer'},
        
        'tha': {'name': 'Thai', 'family': 'Kra-Dai', 'subfamily': 'Tai'},
        'lao': {'name': 'Lao', 'family': 'Kra-Dai', 'subfamily': 'Tai'},
        
        'mal': {'name': 'Malayalam', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
        'tam': {'name': 'Tamil', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
        'tel': {'name': 'Telugu', 'family': 'Dravidian', 'subfamily': 'South Central Dravidian'},
        'kan': {'name': 'Kannada', 'family': 'Dravidian', 'subfamily': 'South Dravidian'},
        
        'msa': {'name': 'Malay', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
        'ind': {'name': 'Indonesian', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
        'jav': {'name': 'Javanese', 'family': 'Austronesian', 'subfamily': 'Malayo-Polynesian'},
        
        'tur': {'name': 'Turkish', 'family': 'Turkic', 'subfamily': 'Oghuz'},
        'azj': {'name': 'Azerbaijani', 'family': 'Turkic', 'subfamily': 'Oghuz'},
        'uzb': {'name': 'Uzbek', 'family': 'Turkic', 'subfamily': 'Karluk'},
        
        'fin': {'name': 'Finnish', 'family': 'Uralic', 'subfamily': 'Finnic'},
        'est': {'name': 'Estonian', 'family': 'Uralic', 'subfamily': 'Finnic'},
        'hun': {'name': 'Hungarian', 'family': 'Uralic', 'subfamily': 'Ugric'},
        
        'swa': {'name': 'Swahili', 'family': 'Niger-Congo', 'subfamily': 'Bantu'},
        'zul': {'name': 'Zulu', 'family': 'Niger-Congo', 'subfamily': 'Bantu'},
        'yor': {'name': 'Yoruba', 'family': 'Niger-Congo', 'subfamily': 'Volta-Niger'},
        
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

@app.post("/compare-concepts", response_model=Dict[str, ComparisonResult])
async def compare_concepts(request: ComparisonRequest):
    """Compare concepts with both embedding similarities and colexification patterns"""
    try:
        print(f"Received comparison request: {request}")
        results = {}
        
        # Get language families for the requested languages
        families = set()
        for lang in request.languages:
            family = get_language_family(lang)
            if family:
                families.add(family)

        print(f"Requested families: {families}")  
        
        # Get CLICS data with error handling
        try:
            print(f"\nGetting colexifications for {request.concept1}")
            colex1 = clics_service.get_colexifications(request.concept1)
            print(f"Colexifications for {request.concept1}:", colex1.detailed_colexifications)  # Debug print
            
            print(f"\nGetting colexifications for {request.concept2}")
            colex2 = clics_service.get_colexifications(request.concept2)
            print(f"Colexifications for {request.concept2}:", colex2.detailed_colexifications)  # Debug print
            family_patterns = clics_service.get_family_patterns(
                request.concept1,
                request.concept2,
                families=list(families)
            )
            print(f"Family patterns result: {family_patterns}")
        except Exception as e:
            print(f"Error getting CLICS data: {str(e)}")
            # Initialize with empty data rather than failing
            colex1 = ColexificationData(
                concept=request.concept1,
                colexified_concepts=[],
                family_frequencies={},
                languages=[],
                semantic_field=None,
                category=None,
                detailed_colexifications=[],
                total_languages=0
            )
            colex2 = ColexificationData(
                concept=request.concept2,
                colexified_concepts=[],
                family_frequencies={},
                languages=[],
                semantic_field=None,
                category=None,
                detailed_colexifications=[],
                total_languages=0
            )
            family_patterns = {}
        
        for lang in request.languages:
            lang_name = SUPPORTED_LANGUAGES[lang]['name']
            print(f"Processing language: {lang_name}")
            try:
                # Get all possible CLICS codes for this language
                clics_codes = get_clics_codes(lang)
                
                # Get language-specific colexification data
                language_colexifications = {
                    request.concept1: [
                        link for link in colex1.detailed_colexifications
                        if any(code in link.languages for code in clics_codes)
                    ],
                    request.concept2: [
                        link for link in colex2.detailed_colexifications
                        if any(code in link.languages for code in clics_codes)
                    ]
                }
                print(f"Language colexifications for {lang}:", language_colexifications) 
                
                # Get translations
                trans1 = translation_service.get_translation(
                    request.concept1, 
                    request.sense_id1, 
                    lang_name
                )
                print(f"Translation 1: {trans1}")
                
                trans2 = translation_service.get_translation(
                    request.concept2,
                    request.sense_id2,
                    lang_name
                )
                print(f"Translation 2: {trans2}")
                
                # Get embeddings
                emb1 = embedding_service.get_embedding(trans1.main_translation, lang)
                emb2 = embedding_service.get_embedding(trans2.main_translation, lang)
                
                # Calculate similarity
                main_similarity = embedding_service.compute_similarity(emb1, emb2)
                
                # Process variations (keeping original variation handling)
                variation_similarities = []
                
                # Compare variations from trans1 with main translation and variations of trans2
                if trans1.variations:
                    # Compare trans1 variations with trans2 main translation
                    for var1 in trans1.variations:
                        var_emb1 = embedding_service.get_embedding(var1.word, lang)
                        emb2 = embedding_service.get_embedding(trans2.main_translation, lang)
                        sim = embedding_service.compute_similarity(var_emb1, emb2)
                        variation_similarities.append({
                            "similarity": float(sim),
                            "context": f"{var1.context} (Variation) - Main translation",
                            "words": (var1.word, trans2.main_translation)
                        })
                        
                        # If trans2 has variations, compare with those too
                        if trans2.variations:
                            for var2 in trans2.variations:
                                var_emb2 = embedding_service.get_embedding(var2.word, lang)
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
                        var_emb2 = embedding_service.get_embedding(var2.word, lang)
                        emb1 = embedding_service.get_embedding(trans1.main_translation, lang)
                        sim = embedding_service.compute_similarity(emb1, var_emb2)
                        variation_similarities.append({
                            "similarity": float(sim),
                            "context": f"Main translation - {var2.context} (Variation)",
                            "words": (trans1.main_translation, var2.word)
                        })
                
                # Sort variations by similarity score in descending order
                variation_similarities.sort(key=lambda x: x["similarity"], reverse=True)
                
                
                # Get family-specific pattern if available
                family = get_language_family(lang)
                current_family_patterns = {}
                if family and family in family_patterns:
                    # Create a dictionary with family as key
                    current_family_patterns = {family: family_patterns[family]}

                results[lang] = ComparisonResult(
                    main_similarity=float(main_similarity),
                    main_translations=(trans1.main_translation, trans2.main_translation),
                    colexification_data=language_colexifications,
                    family_patterns=current_family_patterns,  # Now it's a proper dictionary
                    variation_similarities=variation_similarities,
                    usage_notes={
                        "concept1": trans1.usage_notes,
                        "concept2": trans2.usage_notes
                    }
                )
                
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
    
    