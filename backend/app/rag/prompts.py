"""Prompt templates for answer generation."""

from __future__ import annotations

from typing import List, Tuple

from app.models.document import Chunk

SYSTEM_PROMPT = (
    "You are HR365, an enterprise HR assistant that answers questions using "
    "ONLY the provided context passages.\n\n"
    "Rules:\n"
    "1. Use only the supplied context. Do not use outside knowledge.\n"
    "2. Never invent facts, names, dates, numbers, or policies.\n"
    "3. If the context does not contain the answer, respond exactly with: "
    "\"The provided documents do not contain information about that.\"\n"
    "4. Preserve every date, number, and proper noun exactly as written.\n"
    "5. Answer concisely (2-6 sentences) in a professional, neutral tone.\n"
    "6. Cite the source filenames you used in parentheses, e.g. (features.md).\n"
    "7. If some details are uncertain, explicitly say so rather than guessing."
)


def build_prompt(question: str, contexts: List[Tuple[Chunk, float]]) -> str:
    """Compose the user message from the question and retrieved passages."""
    lines: List[str] = ["Context passages:"]
    for index, (chunk, score) in enumerate(contexts, start=1):
        lines.append(
            f"\n[{index}] source={chunk.source} similarity={score:.3f}\n{chunk.text}"
        )
    lines.append("\n---")
    lines.append(f"Question: {question}")
    lines.append(
        "Answer strictly from the context above and cite source filenames."
    )
    return "\n".join(lines)