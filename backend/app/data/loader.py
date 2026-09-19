"""Recursively load .txt / .md / .pdf files into Document objects."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List

from pypdf import PdfReader

from app.models.document import Document

logger = logging.getLogger(__name__)

SUPPORTED_EXTS = {".txt", ".md", ".pdf"}


def _read_text_file(path: Path) -> str:
    # errors="ignore" makes us resilient to odd encodings.
    return path.read_text(encoding="utf-8", errors="ignore")


def _read_pdf_file(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
    except Exception as exc:  # noqa: BLE001 - we deliberately swallow here
        logger.warning("Failed to open PDF %s: %s", path, exc)
        return ""

    pages: List[str] = []
    for index, page in enumerate(reader.pages):
        try:
            pages.append(page.extract_text() or "")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to extract page %s of %s: %s", index, path, exc)
    return "\n".join(pages)


def load_documents(raw_dir: Path) -> List[Document]:
    """Load every supported file under ``raw_dir`` recursively.

    Unreadable files are logged and skipped; the loader never raises.
    """
    documents: List[Document] = []

    if not raw_dir.exists():
        logger.warning("Raw data directory does not exist: %s", raw_dir)
        return documents

    for path in sorted(raw_dir.rglob("*")):
        if not path.is_file():
            continue
        ext = path.suffix.lower()
        if ext not in SUPPORTED_EXTS:
            continue

        try:
            if ext == ".pdf":
                text = _read_pdf_file(path)
            else:
                text = _read_text_file(path)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to load %s: %s", path, exc)
            continue

        if not text or not text.strip():
            logger.info("Skipping empty document: %s", path)
            continue

        try:
            rel = path.relative_to(raw_dir).as_posix()
        except ValueError:
            rel = path.name

        documents.append(
            Document(
                id=rel,
                text=text,
                source=path.name,
                metadata={"path": str(path), "ext": ext},
            )
        )

    logger.info("Loaded %d document(s) from %s", len(documents), raw_dir)
    return documents