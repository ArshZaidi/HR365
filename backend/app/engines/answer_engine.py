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
from app.rag.prompts import build_prompt

logger = logging.getLogger(__name__)

class AnswerEngine:

    def __init__(
        self,
        api_key: str = GROQ_API_KEY,
        model: str = GROQ_MODEL,
        base_url: str = GROQ_BASE_URL,
        timeout: int = GROQ_TIMEOUT,
    ):
        self.api_key = api_key
        self.model = model
        self.llm_available = bool(self.api_key)
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def generate(
        self,
        question: str,
        results: list[tuple[Chunk, float]],
    ) -> str:

        if not results:
            return (
                "I could not find relevant information "
                "in the HR365 knowledge base."
            )

        context = "\n\n".join(
            (
                f"[Source: {chunk.source}]\n"
                f"{chunk.text}"
            )
            for chunk, _ in results
        )

        prompt = build_prompt(
            question,
            context,
        )

        # -----------------------------------------
        # LOCAL DEMO / FALLBACK MODE
        # -----------------------------------------

        if not self.api_key:
            logger.warning(
                "GROQ_API_KEY not configured. "
                "Using fallback answer engine."
            )

            return self._fallback_answer(
                results
            )

        # -----------------------------------------
        # GROQ
        # -----------------------------------------

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
                            "content": (
                                "You are an accurate "
                                "HR365 RAG assistant. "
                                "Answer only using "
                                "the supplied context."
                            ),
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

            return (
                data["choices"][0]
                ["message"]
                ["content"]
                .strip()
            )

        except requests.RequestException as exc:

            logger.exception(
                "Groq API request failed: %s",
                exc,
            )

            return self._fallback_answer(
                results
            )

        except (
            KeyError,
            IndexError,
            TypeError,
        ) as exc:

            logger.exception(
                "Unexpected Groq response: %s",
                exc,
            )

            return self._fallback_answer(
                results
            )

    @staticmethod
    def _fallback_answer(
        results: list[tuple[Chunk, float]],
    ) -> str:

        best_chunk, score = results[0]

        return (
            "Demo mode — relevant information "
            "found in the HR365 knowledge base:\n\n"
            f"{best_chunk.text}\n\n"
            f"Source: {best_chunk.source}\n"
            f"Retrieval score: {score:.3f}"
        )