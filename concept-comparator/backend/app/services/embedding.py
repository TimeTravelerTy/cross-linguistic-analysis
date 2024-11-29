import numpy as np 
from sentence_transformers import SentenceTransformer
from typing import Dict
import torch

class EmbeddingService:
    def __init__(self):
        try:
            self.model = SentenceTransformer('sentence-transformers/LaBSE')
            self.cached_embeddings = {}
            print("Embedding model loaded successfully")  # Debug log
        except Exception as e:
            print(f"Error initializing embedding model: {str(e)}")
            raise

    def get_embedding(self, text: str, lang: str) -> np.ndarray:
        """Get embedding for a text in a specific language"""
        try:
            cache_key = f"{lang}_{text}"
            if cache_key not in self.cached_embeddings:
                # Convert to numpy array explicitly
                embedding = self.model.encode(text)
                if isinstance(embedding, torch.Tensor):
                    embedding = embedding.cpu().numpy()
                elif not isinstance(embedding, np.ndarray):
                    embedding = np.array(embedding)
                
                self.cached_embeddings[cache_key] = embedding
                
            return self.cached_embeddings[cache_key]
        except Exception as e:
            print(f"Error getting embedding for text '{text}' in {lang}: {str(e)}")
            raise

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings"""
        try:
            # Ensure inputs are numpy arrays
            emb1 = np.asarray(emb1)
            emb2 = np.asarray(emb2)
            
            # Compute cosine similarity
            dot_product = np.dot(emb1, emb2)
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)
            return dot_product / (norm1 * norm2)
        except Exception as e:
            print(f"Error computing similarity: {str(e)}")
            raise