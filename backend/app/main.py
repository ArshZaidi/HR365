"""
FastAPI entrypoint for the HR365 RAG backend.
"""

from __future__ import annotations

import logging

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.auth.dependencies import (
    get_current_profile,
    get_current_user,
    require_admin,
    require_hr,
)
from app.models.schemas import (
    AskRequest,
    AskResponse,
    ConfidenceItem,
    HealthResponse,
    SourceItem,
)
from app.rag.pipeline import RAGPipeline
from app.routers.attendance import router as attendance_router
from app.routers.hr_requests import router as hr_requests_router
from app.routers.leaves import router as leaves_router
from app.security.crypto import encrypt_text
from app.services.employee_data import EmployeeDataService
from app.routers.feedback import router as feedback_router


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
app.include_router(feedback_router)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
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
            detail="RAG pipeline failed to initialise.",
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


# ---------------------------------------------------------------------------
# Authentication / profile
# ---------------------------------------------------------------------------

@app.get("/api/auth/profile")
def get_profile(
    auth=Depends(get_current_profile),
):
    """
    Return the authenticated HR365 profile.
    """

    return auth["profile"]


# ---------------------------------------------------------------------------
# Development-only authentication test routes
# ---------------------------------------------------------------------------

if config.ENABLE_AUTH_TEST_ROUTES:

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
def get_me(
    auth=Depends(get_current_user),
):
    """
    Return the authenticated user's HR365 profile.
    """

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
        logger.exception(
            "Unable to retrieve HR365 profile: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve HR365 profile.",
        ) from exc

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="HR365 profile not found.",
        )

    return profile


# ---------------------------------------------------------------------------
# Hybrid RAG + Employee Data
# ---------------------------------------------------------------------------

@app.post(
    "/api/ask",
    response_model=AskResponse,
)
def ask(
    payload: AskRequest,
    auth=Depends(get_current_profile),
) -> AskResponse:
    """
    Ask HR365 a question.

    HR365 supports three information paths:

    1. Policy/general questions:
       RAG knowledge base only.

    2. Employee-specific questions:
       Authenticated employee data from Supabase.

    3. Hybrid questions:
       Both the HR policy knowledge base and the authenticated
       employee's database information.

    If the Confidence Engine determines that human intervention
    is required, an urgent HR ticket is automatically created.
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

    # -----------------------------------------------------------------------
    # Detect and retrieve authenticated employee data
    # -----------------------------------------------------------------------

    employee_context: Optional[str] = None

    try:
        profile = auth["profile"]
        client = auth["client"]

        employee_data_service = EmployeeDataService(
            client=client,
            employee_id=profile["id"],
        )

        employee_intents = (
            employee_data_service.detect_intents(
                question
            )
        )

        if employee_intents:

            logger.info(
                "Employee-specific intent detected. "
                "employee_id=%s intents=%s",
                profile["id"],
                sorted(employee_intents),
            )

            employee_data = (
                employee_data_service.build_context(
                    employee_intents
                )
            )

            employee_context = (
                employee_data_service.format_context(
                    employee_data
                )
            )

    except Exception as exc:
        logger.exception(
            "Hybrid employee data retrieval failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=503,
            detail="Employee data service temporarily unavailable.",
        ) from exc

    # -----------------------------------------------------------------------
    # Run RAG + optional employee context
    # -----------------------------------------------------------------------

    try:

        result = pipeline.run(
            question,
            additional_context=employee_context,
        )

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
            detail="RAG service temporarily unavailable.",
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

    # -----------------------------------------------------------------------
    # Automatic human-HR escalation
    # -----------------------------------------------------------------------

    hr_ticket_id = None

    if result["escalation_required"]:

        profile = auth["profile"]
        client = auth["client"]

        escalation_reason = (
            result["escalation_reason"]
            or "HR365 could not confidently answer the question."
        )

        try:

            ticket_response = (
                client
                .table("hr_requests")
                .insert(
                    {
                        "employee_id": profile["id"],
                        "category": "policy",
                        "subject": encrypt_text(
                            "HR365 escalation: AI could not confidently answer"
                        ),
                        "description": encrypt_text(
                            f"Employee question:\n{question}\n\n"
                            f"Escalation reason:\n{escalation_reason}"
                        ),
                        "status": "open",
                        "priority": "urgent",
                        "is_escalated": True,
                        "escalated_at": (
                            datetime.now(
                                timezone.utc
                            ).isoformat()
                        ),
                        "escalation_reason": escalation_reason,
                    }
                )
                .execute()
            )

            if ticket_response.data:

                hr_ticket_id = ticket_response.data[0]["id"]

                logger.info(
                    "Automatic HR escalation created. "
                    "ticket_id=%s employee_id=%s",
                    hr_ticket_id,
                    profile["id"],
                )

        except Exception as exc:

            logger.exception(
                "Failed to create automatic HR escalation ticket: %s",
                exc,
            )

            # The AI answer remains available even if
            # ticket creation fails.
            hr_ticket_id = None

    # -----------------------------------------------------------------------
    # Build response
    # -----------------------------------------------------------------------

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
        escalation_required=result[
            "escalation_required"
        ],
        escalation_reason=result[
            "escalation_reason"
        ],
        hr_ticket_id=hr_ticket_id,
    )