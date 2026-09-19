"""FastAPI entrypoint for the HR365 RAG backend."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.models.schemas import (
    AskRequest,
    AskResponse,
    HealthResponse,
    SourceItem,
)
from app.rag.pipeline import RAGPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hr365")

_pipeline: Optional[RAGPipeline] = None
_startup_error: Optional[str] = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _pipeline, _startup_error

    logger.info("Starting HR365 RAG backend...")
    try:
        _pipeline = RAGPipeline()
        _pipeline.initialize()
        logger.info("HR365 backend ready.")
    except Exception as exc:  # noqa: BLE001
        _startup_error = str(exc)
        logger.exception("Fatal error during startup: %s", exc)

    yield

    logger.info("Shutting down HR365 backend.")


app = FastAPI(
    title="HR365 RAG API",
    version="0.1.0",
    description="Locally runnable RAG backend for the HR365 hackathon project.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_pipeline() -> RAGPipeline:
    if _startup_error:
        raise HTTPException(
            status_code=503,
            detail=f"RAG pipeline failed to initialise: {_startup_error}",
        )
    if _pipeline is None:
        raise HTTPException(status_code=503, detail="RAG pipeline not ready.")
    return _pipeline


@app.get("/")
def root() -> dict:
    return {
        "name": "HR365 RAG API",
        "status": "ok",
        "docs": "/docs",
        "ask": "/api/ask",
    }


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    if _pipeline is None:
        return HealthResponse(
            status="starting" if not _startup_error else "error",
            indexed_chunks=0,
            llm_available=bool(config.DEEPSEEK_API_KEY),
        )
    return HealthResponse(
        status="ok",
        indexed_chunks=_pipeline.store.size,
        llm_available=_pipeline.answer_engine.llm_available,
    )


@app.post("/api/ask", response_model=AskResponse)
def ask(payload: AskRequest) -> AskResponse:
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    pipeline = _require_pipeline()

    try:
        result = pipeline.run(question)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Pipeline execution failed: %s", exc)
        raise HTTPException(status_code=500, detail="Internal RAG error.") from exc

    sources = [SourceItem(**item) for item in result["sources"]]
    return AskResponse(answer=result["answer"], sources=sources)