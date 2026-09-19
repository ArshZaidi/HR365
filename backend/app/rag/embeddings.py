"""
Sentence Transformer embedding wrapper for HR365.
"""

from __future__ import annotations

import logging

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """
    Wrapper around SentenceTransformer.

    Embeddings are normalized so FAISS inner-product similarity
    corresponds to cosine similarity.
    """

    def __init__(self, model_name: str) -> None:
        if not model_name.strip():
            raise ValueError(
                "Embedding model name must not be empty."
            )

        logger.info(
            "Loading embedding model: %s",
            model_name,
        )

        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

        logger.info(
            "Embedding model loaded: %s",
            model_name,
        )

    @property
    def dim(self) -> int:
        """
        Return the embedding dimension.
        """
        dimension = self.model.get_embedding_dimension()

        if dimension is None or dimension <= 0:
            raise RuntimeError(
                "Could not determine embedding dimension."
            )

        return int(dimension)

    def embed_documents(
        self,
        texts: list[str],
    ) -> np.ndarray:
        """
        Generate normalized embeddings for multiple documents.
        """
        if not texts:
            return np.empty(
                (0, self.dim),
                dtype=np.float32,
            )

        cleaned_texts = [
            text.strip()
            for text in texts
        ]

        if any(not text for text in cleaned_texts):
            raise ValueError(
                "Document text must not contain empty strings."
            )

        embeddings = self.model.encode(
            cleaned_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        embeddings = np.asarray(
            embeddings,
            dtype=np.float32,
        )

        if embeddings.ndim != 2:
            raise RuntimeError(
                "Document embeddings must be a 2D array."
            )

        if embeddings.shape[0] != len(
            cleaned_texts
        ):
            raise RuntimeError(
                "Embedding count does not match "
                "document count."
            )

        if embeddings.shape[1] != self.dim:
            raise RuntimeError(
                "Embedding dimension does not match "
                "the configured model dimension."
            )

        if not np.isfinite(embeddings).all():
            raise RuntimeError(
                "Generated embeddings contain NaN "
                "or infinite values."
            )

        return embeddings

    def embed_query(
        self,
        text: str,
    ) -> np.ndarray:
        """
        Generate a normalized embedding for one query.
        """
        text = text.strip()

        if not text:
            raise ValueError(
                "Query text must not be empty."
            )

        embedding = self.model.encode(
            [text],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        embedding = np.asarray(
            embedding,
            dtype=np.float32,
        )

        if embedding.ndim != 2:
            raise RuntimeError(
                "Query embedding must be a 2D array."
            )

        if embedding.shape != (
            1,
            self.dim,
        ):
            raise RuntimeError(
                "Query embedding has an unexpected shape: "
                f"{embedding.shape}."
            )

        if not np.isfinite(embedding).all():
            raise RuntimeError(
                "Query embedding contains NaN "
                "or infinite values."
            )

        return embedding