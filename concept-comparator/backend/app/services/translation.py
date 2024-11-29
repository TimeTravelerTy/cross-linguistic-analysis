from openai import OpenAI
from typing import Dict
import json
from app.models.schemas import Translation
import os

class TranslationService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.cached_translations = {}

    def get_translation(self, word: str, sense_definition: str, target_lang: str) -> Translation:
        cache_key = f"{word}_{sense_definition}_{target_lang}"
        if cache_key in self.cached_translations:
            return self.cached_translations[cache_key]
            
        system_prompt = """You are a linguistic expert specializing in semantic analysis and translation. 
        Your task is to provide precise translations capturing semantic distinctions that are grammatically 
        or culturally mandatory in the target language. Only provide variations when the target language 
        requires different words based on context, physical properties, social relationships, or other 
        factors to further specify its sense. Otherwise return an empty list."""
        
        user_prompt = f"""Translate the following word into {target_lang}, noting only variations that are 
        required by the language's grammar or usage rules:
        Word: {word}
        Definition: {sense_definition}"""
        
        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=Translation,
        )
        
        translation = response.choices[0].message.parsed
        self.cached_translations[cache_key] = translation
        return translation