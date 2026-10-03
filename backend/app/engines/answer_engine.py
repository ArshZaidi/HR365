"""
Answer generation for the HR365 assistant.

Uses Groq's OpenAI-compatible API when configured.

The answer engine supports:

    1. Policy-only answers
    2. Employee-data-only answers
    3. Hybrid answers
    4. Deterministic fallback when Groq is unavailable
"""

from __future__ import annotations

import logging
import re
from typing import Any

import requests

from app.config import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL,
    GROQ_TIMEOUT,
)
from app.models.document import Chunk
from app.rag.prompts import (
    SYSTEM_PROMPT,
    build_prompt,
)


logger = logging.getLogger(__name__)


class AnswerEngine:
    """
    Generate grounded HR365 answers.
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

        self.llm_available = bool(
            self.api_key
        )

    def generate(
        self,
        question: str,
        results: list[
            tuple[Chunk, float]
        ],
        additional_context: str | None = None,
    ) -> tuple[
        str,
        list[dict[str, Any]],
    ]:
        """
        Generate an answer from trusted company material and/or
        authenticated employee data.
        """

        if (
            not results
            and not additional_context
        ):
            return (
                "The available HR365 information is insufficient "
                "to answer that.",
                [],
            )

        sources = self._build_sources(
            results
        )

        prompt = build_prompt(
            question=question,
            contexts=results,
            additional_context=additional_context,
        )

        # --------------------------------------------------------------
        # Deterministic fallback
        # --------------------------------------------------------------

        if not self.api_key:
            logger.warning(
                "GROQ_API_KEY is not configured. "
                "Using deterministic fallback answer."
            )

            return (
                self._fallback_answer(
                    question=question,
                    results=results,
                    additional_context=additional_context,
                ),
                sources,
            )

        # --------------------------------------------------------------
        # Groq
        # --------------------------------------------------------------

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": (
                        f"Bearer {self.api_key}"
                    ),
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
                    "temperature": 0.15,
                    "max_tokens": 700,
                },
                timeout=self.timeout,
            )

            response.raise_for_status()

            data: dict[str, Any] = (
                response.json()
            )

            answer = (
                data["choices"][0]["message"]["content"]
                .strip()
            )

            if not answer:
                logger.warning(
                    "Groq returned an empty answer. "
                    "Using fallback."
                )

                return (
                    self._fallback_answer(
                        question=question,
                        results=results,
                        additional_context=additional_context,
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
                    additional_context=additional_context,
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
                    additional_context=additional_context,
                ),
                sources,
            )

    # ------------------------------------------------------------------
    # Sources
    # ------------------------------------------------------------------

    @staticmethod
    def _build_sources(
        results: list[
            tuple[Chunk, float]
        ],
    ) -> list[dict[str, Any]]:
        return [
            {
                "source": chunk.source,
                "chunk_id": chunk.id,
                "score": round(
                    float(score),
                    4,
                ),
            }
            for chunk, score in results
        ]

    # ------------------------------------------------------------------
    # Fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _fallback_answer(
        question: str,
        results: list[
            tuple[Chunk, float]
        ],
        additional_context: str | None = None,
    ) -> str:
        """
        Deterministic fallback.

        For policy questions, extracts relevant sentences from retrieved
        chunks.

        For employee questions, provides a safe service-unavailable
        message rather than pretending to interpret raw database data.
        """

        if (
            not results
            and additional_context
        ):
            return (
                "I found the relevant information in your HR365 "
                "employee record, but the AI answer service is "
                "temporarily unavailable. Please try again shortly."
            )

        if not results:
            return (
                "The available HR365 information is insufficient "
                "to answer that."
            )

        query_terms = {
            word.lower().strip(
                ".,!?;:()[]{}\"'"
            )
            for word in question.split()
            if len(
                word.strip(
                    ".,!?;:()[]{}\"'"
                )
            ) >= 3
        }

        candidates: list[
            tuple[int, str, str]
        ] = []

        for chunk, _score in results:
            sentences = [
                sentence.strip()
                for sentence in re.split(
                    r"(?<=[.!?])\s+",
                    chunk.text.replace(
                        "\n",
                        " ",
                    ),
                )
                if sentence.strip()
            ]

            for sentence in sentences:
                sentence_terms = {
                    word.lower().strip(
                        ".,!?;:()[]{}\"'"
                    )
                    for word in sentence.split()
                    if len(
                        word.strip(
                            ".,!?;:()[]{}\"'"
                        )
                    ) >= 3
                }

                overlap = len(
                    query_terms
                    & sentence_terms
                )

                candidates.append(
                    (
                        overlap,
                        sentence,
                        chunk.source,
                    )
                )

        candidates.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        selected: list[
            tuple[str, str]
        ] = []

        seen: set[str] = set()

        for (
            overlap,
            sentence,
            source,
        ) in candidates:
            if sentence in seen:
                continue

            if (
                overlap == 0
                and selected
            ):
                continue

            selected.append(
                (
                    sentence,
                    source,
                )
            )

            seen.add(sentence)

            if len(selected) >= 4:
                break

        if not selected:
            best_chunk, _score = results[0]

            return (
                f"{best_chunk.text}\n\n"
                f"({best_chunk.source})"
            )

        lines = []

        for sentence, source in selected:
            lines.append(
                f"{sentence} ({source})"
            )

        return " ".join(lines)