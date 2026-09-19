"""Data ingestion namespace: loader -> cleaner -> chunker."""

from app.data.chunker import chunk_document, chunk_documents  # noqa: F401
from app.data.cleaner import clean_document, clean_text  # noqa: F401
from app.data.loader import load_documents  # noqa: F401