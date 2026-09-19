"""Semantic retriever: query -> embedding -> vector store search."""

from __future__ import annotations

import logging
from typing import List, Tuple

from app.models.document import Chunk
from app.rag.embeddings import EmbeddingModel
from app.rag.vectorstore import VectorStore

logger = logging.getLogger(__name__)


class Retriever:
    def __init__(self, embedder: EmbeddingModel, store: VectorStore) -> None:
        self.embedder = embedder
        self.store = store

    def retrieve(self, query: str, k: int = 10) -> List[Tuple[Chunk, float]]:
        if not query or not query.strip():
            return []

        try:
            query_vector = self.embedder.embed_query(query)
        except Exception as exc:  # noqa: BLE001
            logger.error("Query embedding failed: %s", exc)
            return []

        return self.store.search(query_vector, k=k)