"""Central configuration for the HR365 RAG backend.

All tunables are loaded from environment variables (see .env.example) with
sensible defaults so the project runs out-of-the-box without an .env file.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent

# Load .env from the backend directory if present (does not fail if missing).
load_dotenv(BACKEND_DIR / ".env")

DATA_DIR: Path = BACKEND_DIR / "data"
RAW_DIR: Path = DATA_DIR / "raw"
PROCESSED_DIR: Path = DATA_DIR / "processed"
INDEX_DIR: Path = DATA_DIR / "index"

# ---------------------------------------------------------------------------
# Embedding / chunking / retrieval
# ---------------------------------------------------------------------------
EMBEDDING_MODEL: str = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "700"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))
RETRIEVAL_K: int = int(os.getenv("RETRIEVAL_K", "10"))
RERANK_K: int = int(os.getenv("RERANK_K", "5"))

# ---------------------------------------------------------------------------
# GROQ (OpenAI-compatible HTTP API)
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)

GROQ_BASE_URL = os.getenv(
    "GROQ_BASE_URL",
    "https://api.groq.com/openai/v1",
)

GROQ_TIMEOUT = int(
    os.getenv("GROQ_TIMEOUT", "60")
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_dirs() -> None:
    """Create all runtime directories if they are missing."""
    for directory in (DATA_DIR, RAW_DIR, PROCESSED_DIR, INDEX_DIR):
        directory.mkdir(parents=True, exist_ok=True)