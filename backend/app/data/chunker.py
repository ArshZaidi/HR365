"""Word-based document chunking."""

from __future__ import annotations

from typing import Iterable, List

from app.models.document import Chunk, Document


def chunk_document(
    document: Document,
    chunk_size: int = 700,
    overlap: int = 100,
) -> List[Chunk]:
    """Split a document into overlapping word windows."""
    words = document.text.split()
    if not words:
        return []

    if chunk_size <= 0:
        chunk_size = 700
    if overlap < 0:
        overlap = 0
    if overlap >= chunk_size:
        # Avoid an infinite loop if a caller passes bad values.
        overlap = max(0, chunk_size // 4)

    step = chunk_size - overlap
    chunks: List[Chunk] = []

    index = 0
    position = 0
    total = len(words)

    while position < total:
        window = words[position : position + chunk_size]
        if not window:
            break

        chunk_text = " ".join(window)
        chunks.append(
            Chunk(
                id=f"{document.id}::chunk-{index}",
                text=chunk_text,
                source=document.source,
                document_id=document.id,
                metadata=dict(document.metadata),
            )
        )
        index += 1

        if position + chunk_size >= total:
            break
        position += step

    return chunks


def chunk_documents(
    documents: Iterable[Document],
    chunk_size: int = 700,
    overlap: int = 100,
) -> List[Chunk]:
    """Chunk a collection of documents."""
    all_chunks: List[Chunk] = []
    for document in documents:
        all_chunks.extend(chunk_document(document, chunk_size, overlap))
    return all_chunks