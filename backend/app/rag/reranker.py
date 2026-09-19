"""Lightweight lexical reranker.

Combines vector similarity with a simple query-term overlap score. This keeps
the pipeline fully local and cheap while still improving ordering noticeably
over raw vector search.
"""

from __future__ import annotations

import re
from typing import List, Tuple

from app.models.document import Chunk

_TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


def _tokenize(text: str) -> set:
    return {t.lower() for t in _TOKEN_RE.findall(text or "")}


class LexicalReranker:
    def __init__(self, vector_weight: float = 0.6, lexical_weight: float = 0.4) -> None:
        total = vector_weight + lexical_weight
        if total <= 0:
            vector_weight, lexical_weight, total = 0.6, 0.4, 1.0
        self.vector_weight = vector_weight / total
        self.lexical_weight = lexical_weight / total

    def rerank(
        self,
        query: str,
        results: List[Tuple[Chunk, float]],
        top_n: int = 5,
    ) -> List[Tuple[Chunk, float]]:
        if not results:
            return []

        query_terms = _tokenize(query)
        scored: List[Tuple[Chunk, float]] = []

        for chunk, vector_score in results:
            chunk_terms = _tokenize(chunk.text)
            if query_terms and chunk_terms:
                lexical = len(query_terms & chunk_terms) / len(query_terms)
            else:
                lexical = 0.0

            combined = (
                self.vector_weight * float(vector_score)
                + self.lexical_weight * float(lexical)
            )
            scored.append((chunk, combined))

        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[: max(1, top_n)]