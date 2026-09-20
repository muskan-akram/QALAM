import os
import logging
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class Embedder:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        cache = os.getenv("TRANSFORMERS_CACHE", "./models_cache")
        logger.info(f"Loading model: {model_name}")
        self.model = SentenceTransformer(model_name, cache_folder=cache)
        self.dim = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model ready. dim={self.dim}")

    def encode(self, texts):
        if not texts:
            return np.array([])
        return self.model.encode(
            texts, convert_to_numpy=True, normalize_embeddings=True
        )

    def encode_one(self, text):
        return self.encode([text])[0]