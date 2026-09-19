"""
Answer generation for the HR365 RAG pipeline.

Uses Groq's OpenAI-compatible API when a GROQ_API_KEY is configured.
Falls back to a deterministic extractive answer when Groq is unavailable.
"""

from __future__ import annotations

import logging
from typing import Any

import requests

from app.config import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL,
    GROQ_TIMEOUT,
)
from app.models.document import Chunk
from app.rag.prompts import SYSTEM_PROMPT, build_prompt

logger = logging.getLogger(__name__)


class AnswerEngine:
    """
    Generate grounded answers from retrieved RAG chunks.

    The engine always returns:

        (
            answer: str,
            sources: list[dict]
        )

    This keeps the answer engine contract compatible with the FastAPI layer.
    """

    def __init__(
        self,
        api_key: str = GROQ_API_KEY,
        model: str = GROQ_MODEL,
        base_url: str = GROQ_BASE_URL,
        timeout: int = GROQ_TIMEOUT,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        # Used by /health and the RAG pipeline.
        self.llm_available = bool(self.api_key)

    def generate(
        self,
        question: str,
        results: list[tuple[Chunk, float]],
    ) -> tuple[str, list[dict[str, Any]]]:
        """
        Generate an answer from retrieved and reranked chunks.

        Returns:
            tuple[str, list[dict]]:
                The generated answer and source metadata.
        """

        if not results:
            return (
                "I could not find relevant information in the HR365 "
                "knowledge base.",
                [],
            )

        sources = self._build_sources(results)

        # Build the prompt directly from the retrieved chunks.
        prompt = build_prompt(
            question=question,
            contexts=results,
        )

        # ---------------------------------------------------------
        # FALLBACK MODE
        # ---------------------------------------------------------

        if not self.api_key:
            logger.warning(
                "GROQ_API_KEY is not configured. "
                "Using deterministic fallback answer."
            )

            return (
                self._fallback_answer(
                    question=question,
                    results=results,
                ),
                sources,
            )

        # ---------------------------------------------------------
        # GROQ
        # ---------------------------------------------------------

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": SYSTEM_PROMPT,
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        },
                    ],
                    "temperature": 0.1,
                    "max_tokens": 700,
                },
                timeout=self.timeout,
            )

            response.raise_for_status()

            data: dict[str, Any] = response.json()

            answer = (
                data["choices"][0]["message"]["content"]
                .strip()
            )

            if not answer:
                logger.warning(
                    "Groq returned an empty answer. "
                    "Using fallback answer."
                )

                return (
                    self._fallback_answer(
                        question=question,
                        results=results,
                    ),
                    sources,
                )

            return answer, sources

        except requests.RequestException as exc:
            logger.exception(
                "Groq API request failed: %s",
                exc,
            )

            return (
                self._fallback_answer(
                    question=question,
                    results=results,
                ),
                sources,
            )

        except (
            KeyError,
            IndexError,
            TypeError,
            ValueError,
        ) as exc:
            logger.exception(
                "Unexpected Groq response: %s",
                exc,
            )

            return (
                self._fallback_answer(
                    question=question,
                    results=results,
                ),
                sources,
            )

    @staticmethod
    def _build_sources(
        results: list[tuple[Chunk, float]],
    ) -> list[dict[str, Any]]:
        """
        Convert retrieved chunks into API-friendly source objects.
        """

        return [
            {
                "source": chunk.source,
                "chunk_id": chunk.id,
                "score": round(float(score), 4),
            }
            for chunk, score in results
        ]

    @staticmethod
    def _fallback_answer(
        question: str,
        results: list[tuple[Chunk, float]],
    ) -> str:
        """
        Generate a deterministic answer without an external LLM.

        The fallback selects sentences with the highest overlap
        with the user's question and returns a small number of
        relevant passages.
        """

        if not results:
            return (
                "I could not find relevant information in the HR365 "
                "knowledge base."
            )

        # Basic query terms.
        query_terms = {
            word.lower().strip(".,!?;:()[]{}\"'")
            for word in question.split()
            if len(word.strip(".,!?;:()[]{}\"'")) >= 3
        }

        candidates: list[tuple[int, str, str]] = []

        for chunk, _score in results:
            # Split on common sentence boundaries.
            sentences = [
                sentence.strip()
                for sentence in chunk.text.replace("\n", " ").split(".")
                if sentence.strip()
            ]

            for sentence in sentences:
                sentence_terms = {
                    word.lower().strip(".,!?;:()[]{}\"'")
                    for word in sentence.split()
                    if len(word.strip(".,!?;:()[]{}\"'")) >= 3
                }

                overlap = len(query_terms & sentence_terms)

                candidates.append(
                    (
                        overlap,
                        sentence,
                        chunk.source,
                    )
                )

        # Highest overlap first.
        candidates.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        selected: list[tuple[str, str]] = []
        seen: set[str] = set()

        for overlap, sentence, source in candidates:
            if sentence in seen:
                continue

            # Prefer sentences that have some relation to the query.
            if overlap == 0 and selected:
                continue

            selected.append(
                (
                    sentence,
                    source,
                )
            )
            seen.add(sentence)

            if len(selected) >= 5:
                break

        if not selected:
            best_chunk, _score = results[0]

            return (
                "Demo mode — relevant information found in the "
                "HR365 knowledge base:\n\n"
                f"{best_chunk.text}\n\n"
                f"Source: {best_chunk.source}"
            )

        lines = [
            "Demo mode — this answer was generated from the "
            "retrieved HR365 knowledge-base passages:"
        ]

        for sentence, source in selected:
            lines.append(
                f"- {sentence} ({source})"
            )

        return "\n".join(lines)