"""Domain dataclasses used across ingestion and retrieval."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class Document:
    """A single source document loaded from disk."""

    id: str
    text: str
    source: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Chunk:
    """A slice of a Document that will be embedded and retrieved."""

    id: str
    text: str
    source: str
    document_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)