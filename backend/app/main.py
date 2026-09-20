"""
FastAPI entrypoint for the HR365 RAG backend.
"""

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
    ConfidenceItem,
)

from app.rag.pipeline import RAGPipeline
from app.auth.dependencies import get_current_user
from fastapi import Depends
from app.auth.supabase_client import supabase

from app.auth.dependencies import (
    get_current_profile,
    require_admin,
    require_hr,
)

from app.routers.attendance import router as attendance_router
from app.routers.leaves import router as leaves_router
from app.routers.hr_requests import router as hr_requests_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("hr365")


# ---------------------------------------------------------------------------
# Global pipeline state
# ---------------------------------------------------------------------------

_pipeline: Optional[RAGPipeline] = None
_startup_error: Optional[str] = None


# ---------------------------------------------------------------------------
# Application lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Initialise the RAG pipeline when FastAPI starts.
    """
    global _pipeline, _startup_error

    _pipeline = None
    _startup_error = None

    logger.info("Starting HR365 RAG backend...")

    try:
        _pipeline = RAGPipeline()
        _pipeline.initialize()

        logger.info("HR365 backend ready.")

    except Exception as exc:
        _startup_error = str(exc)

        logger.exception(
            "Fatal error during startup: %s",
            exc,
        )

    yield

    logger.info("Shutting down HR365 backend.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HR365 RAG API",
    version="0.1.0",
    description=(
        "Locally runnable RAG backend for the HR365 "
        "hackathon project."
    ),
    lifespan=lifespan,
)

app.include_router(attendance_router)
app.include_router(hr_requests_router)
app.include_router(leaves_router)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_pipeline() -> RAGPipeline:
    """
    Return the active RAG pipeline or raise a meaningful HTTP error.
    """
    if _startup_error:
        raise HTTPException(
            status_code=503,
            detail=(
                "RAG pipeline failed to initialise: "
                f"{_startup_error}"
            ),
        )

    if _pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="RAG pipeline not ready.",
        )

    return _pipeline


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root() -> dict[str, str]:
    """
    Basic API information.
    """
    return {
        "name": "HR365 RAG API",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "ask": "/api/ask",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
)
def health() -> HealthResponse:
    """
    Health/readiness endpoint.
    """
    if _pipeline is None:
        return HealthResponse(
            status=(
                "error"
                if _startup_error
                else "starting"
            ),
            indexed_chunks=0,
            llm_available=bool(
                config.GROQ_API_KEY
            ),
        )

    return HealthResponse(
        status="ok",
        indexed_chunks=_pipeline.store.size,
        llm_available=(
            _pipeline.answer_engine.llm_available
        ),
    )

@app.get("/api/auth/profile")
def get_profile(
    auth=Depends(get_current_profile),
):
    """
    Return the authenticated HR365 profile.
    """
    return auth["profile"]

@app.get("/api/auth/test-employee")
def test_employee_access(
    auth=Depends(get_current_profile),
):
    return {
        "message": "Employee-level authentication successful.",
        "role": auth["profile"]["role"],
    }

@app.get("/api/auth/test-hr")
def test_hr_access(
    auth=Depends(require_hr),
):
    return {
        "message": "HR-level access successful.",
        "role": auth["profile"]["role"],
    }

@app.get("/api/auth/test-admin")
def test_admin_access(
    auth=Depends(require_admin),
):
    return {
        "message": "Admin-level access successful.",
        "role": auth["profile"]["role"],
    }

@app.get("/api/auth/me")
def get_me(auth=Depends(get_current_user)):
    current_user = auth["user"]
    client = auth["client"]

    try:
        response = (
            client
            .table("profiles")
            .select(
                "id, employee_id, full_name, email, role, "
                "department, designation, phone, joining_date, "
                "manager_id, is_active"
            )
            .eq("id", current_user.id)
            .single()
            .execute()
        )

        profile = response.data

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve HR365 profile: {str(exc)}",
        )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="HR365 profile not found.",
        )

    return profile


@app.post(
    "/api/ask",
    response_model=AskResponse,
)
def ask(
    payload: AskRequest,
) -> AskResponse:
    """
    Ask a question against the HR365 knowledge base.
    """
    question = (
        payload.question or ""
    ).strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question must not be empty.",
        )

    pipeline = _require_pipeline()

    try:
        result = pipeline.run(question)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        logger.exception(
            "RAG runtime error: %s",
            exc,
        )
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Pipeline execution failed: %s",
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Internal RAG error.",
        ) from exc

    sources = [
        SourceItem(**item)
        for item in result["sources"]
    ]

    return AskResponse(
        answer=result["answer"],
        sources=sources,
        confidence=ConfidenceItem(
            **result["confidence"]
        ),
    )