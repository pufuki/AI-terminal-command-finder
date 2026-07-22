"""
Embedding generation and FAISS index management.
Uses sentence-transformers to generate embeddings and FAISS for fast similarity search.
"""
import logging
import os
from pathlib import Path

import faiss
import numpy as np

from dataset import CommandEntry, build_search_text

logger = logging.getLogger(__name__)

MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension
INDEX_DIR = Path(__file__).parent / "index"
INDEX_FILE = INDEX_DIR / "commands.faiss"
META_FILE = INDEX_DIR / "commands_meta.json"


class EmbeddingIndex:
    """Manages the FAISS index and sentence-transformer model."""

    def __init__(self) -> None:
        self._model = None
        self._index: faiss.Index | None = None
        self._entries: list[CommandEntry] = []
        self._texts: list[str] = []

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformer model: %s", MODEL_NAME)
            self._model = SentenceTransformer(MODEL_NAME)
        return self._model

    def build(self, entries: list[CommandEntry]) -> None:
        """Build the FAISS index from the given command entries."""
        self._entries = entries
        self._texts = [build_search_text(e) for e in entries]

        logger.info("Generating embeddings for %d commands...", len(entries))
        embeddings = self.model.encode(
            self._texts,
            normalize_embeddings=True,
            show_progress_bar=True,
        )
        embeddings = np.array(embeddings, dtype=np.float32)

        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)

        self._index = index
        self._save()
        logger.info("FAISS index built with %d vectors (dim=%d)", index.ntotal, dim)

    def load(self, entries: list[CommandEntry]) -> bool:
        """Try to load a pre-built index from disk. Returns False if not found."""
        if not INDEX_FILE.exists() or not META_FILE.exists():
            return False
        try:
            self._index = faiss.read_index(str(INDEX_FILE))
            with open(META_FILE, "r", encoding="utf-8") as f:
                import json
                meta = json.load(f)
            if len(meta["ids"]) != len(entries):
                logger.info("Index size mismatch, rebuilding...")
                return False
            self._entries = entries
            self._texts = [build_search_text(e) for e in entries]
            logger.info("Loaded FAISS index from disk (%d vectors)", self._index.ntotal)
            return True
        except Exception as e:
            logger.warning("Failed to load index: %s", e)
            return False

    def _save(self) -> None:
        INDEX_DIR.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(INDEX_FILE))
        import json
        with open(META_FILE, "w", encoding="utf-8") as f:
            json.dump({"ids": [e.id for e in self._entries]}, f)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search the index for the closest matching commands."""
        if self._index is None:
            raise RuntimeError("Index not built. Call build() first.")

        query_embedding = self.model.encode(
            [query], normalize_embeddings=True
        )
        query_embedding = np.array(query_embedding, dtype=np.float32)

        scores, indices = self._index.search(query_embedding, top_k)

        results = []
        for rank, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx == -1:
                continue
            entry = self._entries[idx]
            results.append({
                "entry": entry.model_dump(),
                "score": float(score),
                "source": "retrieval",
                "rank": rank,
            })
        return results

    def embed(self, text: str) -> np.ndarray:
        """Generate an embedding for a single text."""
        return self.model.encode([text], normalize_embeddings=True)


# Singleton
_index_instance: EmbeddingIndex | None = None


def get_index() -> EmbeddingIndex:
    global _index_instance
    if _index_instance is None:
        _index_instance = EmbeddingIndex()
    return _index_instance


def init_index(entries: list[CommandEntry]) -> EmbeddingIndex:
    """Initialize the index, loading from disk or building fresh."""
    idx = get_index()
    if not idx.load(entries):
        idx.build(entries)
    return idx
