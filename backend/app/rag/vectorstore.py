"""FAISS-backed vector store with JSON metadata persistence."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List, Tuple

import faiss
import numpy as np

from app.models.document import Chunk

logger = logging.getLogger(__name__)


class VectorStore:
    """In-memory FAISS index with on-disk persistence."""

    def __init__(self, dim: int, index_dir: Path) -> None:
        self.dim = int(dim)
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.index_dir / "faiss.index"
        self.meta_path = self.index_dir / "chunks.json"

        # IndexFlatIP + normalized vectors == cosine similarity.
        self.index = faiss.IndexFlatIP(self.dim)
        self.chunks: List[Chunk] = []

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def add(self, chunks: List[Chunk], embeddings: np.ndarray) -> None:
        if embeddings is None or embeddings.size == 0:
            return
        if embeddings.shape[0] != len(chunks):
            raise ValueError(
                f"chunks ({len(chunks)}) and embeddings ({embeddings.shape[0]}) "
                "must have the same length"
            )

        embeddings = np.ascontiguousarray(embeddings, dtype="float32")
        if embeddings.shape[1] != self.dim:
            raise ValueError(
                f"embedding dim {embeddings.shape[1]} != store dim {self.dim}"
            )

        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def clear(self) -> None:
        self.index = faiss.IndexFlatIP(self.dim)
        self.chunks = []
        for path in (self.index_path, self.meta_path):
            try:
                if path.exists():
                    path.unlink()
            except OSError as exc:  # noqa: PERF203
                logger.warning("Could not delete %s: %s", path, exc)

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------
    def search(
        self, query_embedding: np.ndarray, k: int = 10
    ) -> List[Tuple[Chunk, float]]:
        if self.index.ntotal == 0 or not self.chunks:
            return []

        vector = np.ascontiguousarray(query_embedding, dtype="float32")
        if vector.ndim == 1:
            vector = vector.reshape(1, -1)

        k = max(1, min(int(k), self.index.ntotal))
        scores, indices = self.index.search(vector, k)

        results: List[Tuple[Chunk, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.chunks):
                continue
            results.append((self.chunks[idx], float(score)))
        return results

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def save(self) -> None:
        self.index_dir.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))

        serialised = [
            {
                "id": c.id,
                "text": c.text,
                "source": c.source,
                "document_id": c.document_id,
                "metadata": c.metadata,
            }
            for c in self.chunks
        ]
        self.meta_path.write_text(
            json.dumps(serialised, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        logger.info("Saved FAISS index (%d vectors) to %s", self.index.ntotal, self.index_path)

    def load(self) -> bool:
        if not self.index_path.exists() or not self.meta_path.exists():
            return False

        try:
            self.index = faiss.read_index(str(self.index_path))
            raw = json.loads(self.meta_path.read_text(encoding="utf-8"))
            self.chunks = [
                Chunk(
                    id=row["id"],
                    text=row["text"],
                    source=row["source"],
                    document_id=row["document_id"],
                    metadata=row.get("metadata", {}) or {},
                )
                for row in raw
            ]
            logger.info("Loaded FAISS index with %d vectors", self.index.ntotal)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to load FAISS index: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------
    @property
    def size(self) -> int:
        return int(self.index.ntotal)