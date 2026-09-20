"""
Central configuration for the HR365 RAG backend.

All configurable values are loaded from environment variables.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR: Path = Path(__file__).resolve().parent.parent

# Load backend/.env
load_dotenv(BACKEND_DIR / ".env")


# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------

DATA_DIR: Path = BACKEND_DIR / "data"

RAW_DIR: Path = DATA_DIR / "raw"
PROCESSED_DIR: Path = DATA_DIR / "processed"
INDEX_DIR: Path = DATA_DIR / "index"


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

EMBEDDING_MODEL: str = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

CHUNK_SIZE: int = int(
    os.getenv("CHUNK_SIZE", "700")
)

CHUNK_OVERLAP: int = int(
    os.getenv("CHUNK_OVERLAP", "100")
)


# ---------------------------------------------------------------------------
# Retrieval / reranking
# ---------------------------------------------------------------------------

RETRIEVAL_K: int = int(
    os.getenv("RETRIEVAL_K", "10")
)

RERANK_K: int = int(
    os.getenv("RERANK_K", "5")
)


# ---------------------------------------------------------------------------
# Groq
# ---------------------------------------------------------------------------

GROQ_API_KEY: str = os.getenv(
    "GROQ_API_KEY",
    ""
)

GROQ_MODEL: str = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b",
)

GROQ_BASE_URL: str = os.getenv(
    "GROQ_BASE_URL",
    "https://api.groq.com/openai/v1",
)

GROQ_TIMEOUT: int = int(
    os.getenv("GROQ_TIMEOUT", "60")
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


# ---------------------------------------------------------------------------
# Directory setup
# ---------------------------------------------------------------------------

def ensure_dirs() -> None:
    """Create required backend data directories."""
    for directory in (
        DATA_DIR,
        RAW_DIR,
        PROCESSED_DIR,
        INDEX_DIR,
    ):
        directory.mkdir(
            parents=True,
            exist_ok=True,
        )