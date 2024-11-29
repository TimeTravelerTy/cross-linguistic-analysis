from nltk.corpus import wordnet as wn
from typing import List
from app.models.schemas import WordSense

class DisambiguationService:
    @staticmethod
    def get_word_senses(word: str) -> List[WordSense]:
        synsets = wn.synsets(word)
        senses = []
        
        for synset in synsets:
            sense = WordSense(
                synset_id=synset.name(),
                definition=synset.definition(),
                examples=synset.examples(),
                lemma_names=synset.lemma_names(),
                category=next(iter(synset.hypernyms()), synset).lemma_names()[0]
            )
            senses.append(sense)
            
        return senses