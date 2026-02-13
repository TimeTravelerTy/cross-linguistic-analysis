import json
import os
import re

from openai import OpenAI

from app.models.schemas import Translation

class TranslationService:
    def __init__(self):
        self.model = os.getenv("TRANSLATION_MODEL", "gpt-4o-mini")
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("TRANSLATION_API_KEY") or "ollama"
        base_url = os.getenv("OPENAI_BASE_URL")

        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url

        self.client = OpenAI(**client_kwargs)
        self.cached_translations = {}

    def get_translation(self, word: str, sense_definition: str, target_lang: str) -> Translation:
        cache_key = f"{self.model}_{word}_{sense_definition}_{target_lang}"
        print(f"Translating: {cache_key}...")
        if cache_key in self.cached_translations:
            return self.cached_translations[cache_key]
        
        word = word.title() if (word.isupper() or word.islower()) else word
            
        system_prompt = """You are a linguistic expert specializing in semantic analysis and translation.
Your task is to provide precise translations capturing semantic distinctions that are grammatically
or culturally mandatory in the target language.
Only provide variations when the target language requires different words based on context, nuance,
physical properties, social relationships, or other factors.
Return ONLY valid JSON with this exact schema:
{
  "main_translation": "string",
  "variations": [{"word": "string", "context": "string", "nuance": "string"}],
  "usage_notes": "string"
}
If there are no required variations, return an empty array for "variations"."""
        
        user_prompt = f"""Translate the following word into {target_lang}, noting only variations that are
        required by the language's usage rules.
        Word: {word}
        Specifics: {sense_definition}
        Return JSON only."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or ""
        translation = self._parse_translation(content)
        self.cached_translations[cache_key] = translation
        return translation

    def _parse_translation(self, content: str) -> Translation:
        json_text = self._extract_json_object(content)
        data = json.loads(json_text)

        # Normalize minor model output drift while keeping schema strict.
        if "variations" not in data or data["variations"] is None:
            data["variations"] = []
        if "usage_notes" not in data or data["usage_notes"] is None:
            data["usage_notes"] = ""

        return Translation.model_validate(data)

    def _extract_json_object(self, content: str) -> str:
        text = content.strip()

        fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
        if fenced_match:
            return fenced_match.group(1)

        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace == -1 or last_brace == -1 or first_brace >= last_brace:
            raise ValueError(f"Model response did not include JSON: {text}")

        return text[first_brace:last_brace + 1]
