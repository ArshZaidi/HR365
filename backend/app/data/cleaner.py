"""Text normalisation utilities."""

from __future__ import annotations

import re

from app.models.document import Document

_NULL_BYTES = re.compile(r"\x00")
_SPACES = re.compile(r"[ \u00A0\u2007\u202F]+")
_MULTI_NEWLINES = re.compile(r"\n{3,}")


def clean_text(text: str) -> str:
    """Normalise whitespace while preserving paragraph separation."""
    if not text:
        return ""

    # Strip null bytes and normalise line endings.
    text = _NULL_BYTES.sub(" ", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\t", " ")

    # Collapse runs of spaces but keep newlines so paragraphs survive.
    text = _SPACES.sub(" ", text)

    # Trim trailing whitespace on each line.
    text = "\n".join(line.rstrip() for line in text.split("\n"))

    # Collapse more than two consecutive newlines down to exactly two.
    text = _MULTI_NEWLINES.sub("\n\n", text)

    return text.strip()


def clean_document(document: Document) -> Document:
    """Return a copy of ``document`` with its text cleaned."""
    return Document(
        id=document.id,
        text=clean_text(document.text),
        source=document.source,
        metadata=dict(document.metadata),
    )