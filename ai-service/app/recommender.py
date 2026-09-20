import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
logger = logging.getLogger(__name__)

# Minimum similarity score — raised from 0.08 to avoid irrelevant results
MIN_SIMILARITY = 0.05

class BookRecommender:
    def __init__(self, db, embedder):
        self.db       = db
        self.embedder = embedder
        self.index    = None
        self.books    = []

    def _text(self, b):
        parts = [
            b.get("title",""),
            f"by {b.get('author','')}",
            b.get("genre",""),
            " ".join(b.get("tags") or []),
            (b.get("description") or "")[:200],
        ]
        return " ".join(filter(None, parts))

    async def build_index(self):
        logger.info("Building embedding index…")
        self.books = await self.db.fetch_books()
        if not self.books:
            logger.warning("No books found — index empty")
            return
        texts = [self._text(b) for b in self.books]
        self.index = self.embedder.encode(texts)
        logger.info(f"Index ready: {len(self.books)} books")

    async def search(self, query, top_k=5):
        if self.index is None or not self.books:
            return []
        q = self.embedder.encode_one(query).reshape(1, -1)
        scores = cosine_similarity(q, self.index)[0]
        top = np.argsort(scores)[::-1][:top_k]
        results = []
        for i in top:
            if scores[i] < MIN_SIMILARITY:
                continue
            book = dict(self.books[i])
            book["similarity_score"] = round(float(scores[i]), 4)
            book["id"] = str(book["id"])
            results.append(book)
        return results