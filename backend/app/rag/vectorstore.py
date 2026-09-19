"""
FAISS vector store for the HR365 RAG backend.

Uses cosine similarity through a normalized FAISS IndexFlatIP index.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import faiss
import numpy as np

from app.models.document import Chunk

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Persistent FAISS vector store.

    Embeddings are expected to be L2-normalized, allowing inner product
    similarity to behave as cosine similarity.
    """

    INDEX_FILENAME = "faiss.index"
    CHUNKS_FILENAME = "chunks.json"

    def __init__(
        self,
        dim: int,
        index_dir: Path,
    ) -> None:
        if dim <= 0:
            raise ValueError(
                "Vector dimension must be greater than zero."
            )

        self.dim = dim
        self.index_dir = Path(index_dir)

        self.index_path = (
            self.index_dir / self.INDEX_FILENAME
        )

        self.chunks_path = (
            self.index_dir / self.CHUNKS_FILENAME
        )

        self.index = faiss.IndexFlatIP(self.dim)

        self.chunks: list[Chunk] = []

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def size(self) -> int:
        """Return the number of indexed vectors."""
        return int(self.index.ntotal)

    # ------------------------------------------------------------------
    # Index modification
    # ------------------------------------------------------------------

    def clear(self) -> None:
        """
        Clear the in-memory index and remove persisted files.
        """
        self.index = faiss.IndexFlatIP(self.dim)
        self.chunks = []

        for path in (
            self.index_path,
            self.chunks_path,
        ):
            try:
                if path.exists():
                    path.unlink()
            except OSError as exc:
                logger.warning(
                    "Could not remove %s: %s",
                    path,
                    exc,
                )

    def add(
        self,
        chunks: list[Chunk],
        embeddings: np.ndarray,
    ) -> None:
        """
        Add chunks and their embeddings to the index.

        Args:
            chunks:
                Chunks corresponding one-to-one with embeddings.

            embeddings:
                Float32 embedding matrix of shape
                (number_of_chunks, embedding_dimension).
        """
        if not chunks:
            return

        embeddings = np.asarray(
            embeddings,
            dtype=np.float32,
        )

        if embeddings.ndim != 2:
            raise ValueError(
                "Embeddings must be a 2-dimensional array."
            )

        if embeddings.shape[0] != len(chunks):
            raise ValueError(
                "Number of embeddings must match number of chunks. "
                f"Got {embeddings.shape[0]} embeddings and "
                f"{len(chunks)} chunks."
            )

        if embeddings.shape[1] != self.dim:
            raise ValueError(
                "Embedding dimension mismatch. "
                f"Expected {self.dim}, "
                f"got {embeddings.shape[1]}."
            )

        if not np.isfinite(embeddings).all():
            raise ValueError(
                "Embeddings contain NaN or infinite values."
            )

        # Normalize so inner product == cosine similarity.
        faiss.normalize_L2(embeddings)

        self.index.add(embeddings)

        self.chunks.extend(chunks)

        self._validate_consistency()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self) -> None:
        """
        Persist the FAISS index and chunk metadata to disk.
        """
        self.index_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._validate_consistency()

        faiss.write_index(
            self.index,
            str(self.index_path),
        )

        payload: list[dict[str, Any]] = [
            {
                "id": chunk.id,
                "text": chunk.text,
                "source": chunk.source,
                "document_id": chunk.document_id,
                "metadata": chunk.metadata,
            }
            for chunk in self.chunks
        ]

        self.chunks_path.write_text(
            json.dumps(
                payload,
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        logger.info(
            "Saved FAISS index: %d vectors.",
            self.size,
        )

    def load(self) -> bool:
        """
        Load the persisted FAISS index and chunk metadata.

        Returns:
            True if loading succeeds.
            False if the persisted index is missing or invalid.

        The method deliberately returns False instead of crashing so that
        RAGPipeline can rebuild the index automatically.
        """
        if not self.index_path.exists():
            logger.info(
                "FAISS index does not exist: %s",
                self.index_path,
            )
            return False

        if not self.chunks_path.exists():
            logger.warning(
                "FAISS index exists but chunk metadata is missing."
            )
            return False

        try:
            loaded_index = faiss.read_index(
                str(self.index_path)
            )

            if loaded_index.d != self.dim:
                raise ValueError(
                    "FAISS index dimension mismatch. "
                    f"Expected {self.dim}, "
                    f"got {loaded_index.d}."
                )

            raw_chunks = json.loads(
                self.chunks_path.read_text(
                    encoding="utf-8"
                )
            )

            if not isinstance(raw_chunks, list):
                raise ValueError(
                    "Chunk metadata must be a JSON list."
                )

            loaded_chunks: list[Chunk] = []

            for item in raw_chunks:
                if not isinstance(item, dict):
                    raise ValueError(
                        "Invalid chunk metadata entry."
                    )

                loaded_chunks.append(
                    Chunk(
                        id=str(item["id"]),
                        text=str(item["text"]),
                        source=str(item["source"]),
                        document_id=str(
                            item["document_id"]
                        ),
                        metadata=dict(
                            item.get(
                                "metadata",
                                {},
                            )
                        ),
                    )
                )

            if loaded_index.ntotal != len(
                loaded_chunks
            ):
                raise ValueError(
                    "FAISS/chunk count mismatch. "
                    f"FAISS contains {loaded_index.ntotal} "
                    f"vectors but metadata contains "
                    f"{len(loaded_chunks)} chunks."
                )

            self.index = loaded_index
            self.chunks = loaded_chunks

            self._validate_consistency()

            logger.info(
                "Loaded FAISS index: %d vectors.",
                self.size,
            )

            return True

        except (
            OSError,
            ValueError,
            KeyError,
            TypeError,
            json.JSONDecodeError,
            RuntimeError,
        ) as exc:
            logger.warning(
                "Could not load FAISS index: %s",
                exc,
            )

            self.index = faiss.IndexFlatIP(
                self.dim
            )
            self.chunks = []

            return False

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(
        self,
        query_vector: np.ndarray,
        k: int = 5,
    ) -> list[tuple[Chunk, float]]:
        """
        Search for the nearest chunks.

        Args:
            query_vector:
                A single query embedding.

            k:
                Maximum number of results.

        Returns:
            List of (Chunk, similarity_score) tuples.
        """
        if k <= 0:
            return []

        if self.size == 0:
            return []

        query_vector = np.asarray(
            query_vector,
            dtype=np.float32,
        )

        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(
                1,
                -1,
            )

        if query_vector.ndim != 2:
            raise ValueError(
                "Query vector must be a 1D or 2D array."
            )

        if query_vector.shape[0] != 1:
            raise ValueError(
                "VectorStore.search expects exactly "
                "one query vector."
            )

        if query_vector.shape[1] != self.dim:
            raise ValueError(
                "Query vector dimension mismatch. "
                f"Expected {self.dim}, "
                f"got {query_vector.shape[1]}."
            )

        if not np.isfinite(query_vector).all():
            raise ValueError(
                "Query vector contains NaN or "
                "infinite values."
            )

        faiss.normalize_L2(query_vector)

        limit = min(
            int(k),
            self.size,
        )

        scores, indices = self.index.search(
            query_vector,
            limit,
        )

        results: list[tuple[Chunk, float]] = []

        for score, index in zip(
            scores[0],
            indices[0],
        ):
            if index < 0:
                continue

            if index >= len(self.chunks):
                logger.warning(
                    "FAISS returned invalid chunk index: %d",
                    index,
                )
                continue

            results.append(
                (
                    self.chunks[index],
                    float(score),
                )
            )

        return results

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def _validate_consistency(self) -> None:
        """
        Ensure the in-memory FAISS index and chunk metadata agree.
        """
        if self.index.d != self.dim:
            raise ValueError(
                "In-memory FAISS index dimension does not match "
                "configured embedding dimension."
            )

        if self.index.ntotal != len(
            self.chunks
        ):
            raise ValueError(
                "In-memory FAISS index and chunk metadata are "
                "out of sync. "
                f"Vectors: {self.index.ntotal}; "
                f"chunks: {len(self.chunks)}."
            )