"""
FastAPI entrypoint for the HR365 backend.
"""

from __future__ import annotations

import logging

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from app.routers.notices import router as notices_router

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import (
    CORSMiddleware,
)

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

from app.routers.attendance import (
    router as attendance_router,
)

from app.routers.hr_requests import (
    router as hr_requests_router,
)

from app.routers.leaves import (
    router as leaves_router,
)

from app.routers.feedback import (
    router as feedback_router,
)

from app.security.crypto import (
    encrypt_text,
)

from app.services.employee_data import (
    EmployeeDataService,
)

from app.services.query_router import (
    QueryRoute,
    classify_query,
)


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s "
        "[%(levelname)s] "
        "%(name)s: %(message)s"
    ),
)

logger = logging.getLogger(
    "hr365"
)


# ---------------------------------------------------------------------------
# Global pipeline state
# ---------------------------------------------------------------------------

_pipeline: Optional[RAGPipeline] = None

_startup_error: Optional[str] = None


# ---------------------------------------------------------------------------
# Application lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(
    _app: FastAPI,
):
    """
    Initialise the RAG pipeline when FastAPI starts.
    """

    global _pipeline
    global _startup_error

    _pipeline = None
    _startup_error = None

    logger.info(
        "Starting HR365 backend..."
    )

    try:
        _pipeline = RAGPipeline()

        _pipeline.initialize()

        logger.info(
            "HR365 backend ready."
        )

    except Exception as exc:
        _startup_error = str(exc)

        logger.exception(
            "Fatal error during startup: %s",
            exc,
        )

    yield

    logger.info(
        "Shutting down HR365 backend."
    )


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HR365 RAG API",
    version="0.1.0",
    description=(
        "Enterprise HR assistant backend "
        "for HR365."
    ),
    lifespan=lifespan,
)


app.include_router(
    attendance_router
)

app.include_router(
    hr_requests_router
)

app.include_router(
    leaves_router
)

app.include_router(
    feedback_router
)

app.include_router(
    notices_router
)


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
    Return the active RAG pipeline.
    """

    if _startup_error:
        raise HTTPException(
            status_code=503,
            detail=(
                "RAG pipeline failed to initialise."
            ),
        )

    if _pipeline is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "RAG pipeline not ready."
            ),
        )

    return _pipeline


def _chitchat_response(
    question: str,
) -> str:
    """
    Return a deterministic response for simple conversation.

    Chitchat deliberately bypasses the LLM/RAG pipeline.
    """

    text = question.lower().strip()

    if text in {
        "hi",
        "hello",
        "hey",
        "hi there",
        "hello there",
        "hey there",
    }:
        return (
            "Hello! How can I help you "
            "with HR365?"
        )

    if text in {
        "good morning",
        "good afternoon",
        "good evening",
    }:
        return (
            "Hello! How can I help you "
            "today?"
        )

    if text in {
        "good night",
    }:
        return (
            "Good night! Feel free to "
            "come back if you need any "
            "HR assistance."
        )

    if text in {
        "how are you",
        "how are you?",
        "how's it going",
        "how's it going?",
        "how are things",
        "how are things?",
    }:
        return (
            "I'm doing well and ready to "
            "help with your HR365 questions."
        )

    if text in {
        "thanks",
        "thank you",
        "thanks a lot",
        "thank you so much",
        "thx",
    }:
        return (
            "You're welcome! Let me know "
            "if you need anything else."
        )

    if text in {
        "bye",
        "goodbye",
        "see you",
    }:
        return (
            "Goodbye! Feel free to come "
            "back if you need any HR "
            "assistance."
        )

    return (
        "Hello! How can I help you "
        "with HR365?"
    )


def _out_of_scope_response() -> str:
    """
    Response for messages that are clearly outside HR365.
    """

    return (
        "I can help with HR365-related "
        "questions such as company policies, "
        "attendance, leave, payroll, benefits, "
        "HR requests, and your employee information."
    )


def _direct_confidence() -> ConfidenceItem:
    """
    Confidence representation for answers that do not use RAG.

    A personal answer is based on authenticated database data rather
    than semantic retrieval, so similarity metrics are not applicable.
    """

    return ConfidenceItem(
        score=1.0,
        level="high",
        top_similarity=0.0,
        mean_similarity=0.0,
        evidence_score=1.0,
        relevant_chunk_count=0,
    )


def _build_ask_response(
    *,
    answer: str,
    sources: list[dict],
    confidence: ConfidenceItem,
    escalation_required: bool = False,
    escalation_reason: str | None = None,
    hr_ticket_id: str | None = None,
) -> AskResponse:
    return AskResponse(
        answer=answer,
        sources=[
            SourceItem(**item)
            for item in sources
        ],
        confidence=confidence,
        escalation_required=(
            escalation_required
        ),
        escalation_reason=(
            escalation_reason
        ),
        hr_ticket_id=hr_ticket_id,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root() -> dict[str, str]:
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
        indexed_chunks=(
            _pipeline.store.size
        ),
        llm_available=(
            _pipeline
            .answer_engine
            .llm_available
        ),
    )


# ---------------------------------------------------------------------------
# Authentication / profile
# ---------------------------------------------------------------------------

@app.get(
    "/api/auth/profile"
)
def get_profile(
    auth=Depends(
        get_current_profile
    ),
):
    return auth["profile"]


# ---------------------------------------------------------------------------
# Development-only authentication test routes
# ---------------------------------------------------------------------------

if config.ENABLE_AUTH_TEST_ROUTES:

    @app.get(
        "/api/auth/test-employee"
    )
    def test_employee_access(
        auth=Depends(
            get_current_profile
        ),
    ):
        return {
            "message": (
                "Employee-level authentication "
                "successful."
            ),
            "role": auth[
                "profile"
            ]["role"],
        }

    @app.get(
        "/api/auth/test-hr"
    )
    def test_hr_access(
        auth=Depends(
            require_hr
        ),
    ):
        return {
            "message": (
                "HR-level access successful."
            ),
            "role": auth[
                "profile"
            ]["role"],
        }

    @app.get(
        "/api/auth/test-admin"
    )
    def test_admin_access(
        auth=Depends(
            require_admin
        ),
    ):
        return {
            "message": (
                "Admin-level access successful."
            ),
            "role": auth[
                "profile"
            ]["role"],
        }


@app.get(
    "/api/auth/me"
)
def get_me(
    auth=Depends(
        get_current_user
    ),
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
                "id, employee_id, full_name, "
                "email, role, department, "
                "designation, phone, joining_date, "
                "manager_id, is_active"
            )
            .eq(
                "id",
                current_user.id,
            )
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
            detail=(
                "Unable to retrieve HR365 profile."
            ),
        ) from exc

    if not profile:
        raise HTTPException(
            status_code=404,
            detail=(
                "HR365 profile not found."
            ),
        )

    return profile


# ---------------------------------------------------------------------------
# Ask HR365
# ---------------------------------------------------------------------------

@app.post(
    "/api/ask",
    response_model=AskResponse,
)
def ask(
    payload: AskRequest,
    auth=Depends(
        get_current_profile
    ),
) -> AskResponse:
    """
    Main HR365 assistant endpoint.

    Routing happens BEFORE retrieval.

    chitchat:
        direct response, no RAG, no ticket.

    out_of_scope:
        direct response, no RAG, no ticket.

    personal:
        authenticated employee data only.

    policy:
        RAG only.

    hybrid:
        authenticated employee data + RAG.
    """

    question = (
        payload.question or ""
    ).strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail=(
                "Question must not be empty."
            ),
        )

    route: QueryRoute = (
        classify_query(
            question
        )
    )

    logger.info(
        "HR365 query route=%s reason=%s",
        route.route,
        route.reason,
    )

    # ------------------------------------------------------------------
    # CHITCHAT
    #
    # Absolutely no RAG.
    # Absolutely no confidence escalation.
    # Absolutely no ticket.
    # ------------------------------------------------------------------

    if route.route == "chitchat":
        return _build_ask_response(
            answer=_chitchat_response(
                question
            ),
            sources=[],
            confidence=_direct_confidence(),
        )

    # ------------------------------------------------------------------
    # OUT OF SCOPE
    #
    # Do not send random questions into the HR knowledge base.
    # ------------------------------------------------------------------

    if route.route == "out_of_scope":
        return _build_ask_response(
            answer=_out_of_scope_response(),
            sources=[],
            confidence=_direct_confidence(),
        )

    # ------------------------------------------------------------------
    # Employee context
    # ------------------------------------------------------------------

    employee_context: Optional[
        str
    ] = None

    employee_data_service: Optional[
        EmployeeDataService
    ] = None

    profile = auth["profile"]
    client = auth["client"]

    needs_employee_data = (
        route.route
        in {
            "personal",
            "hybrid",
        }
    )

    if needs_employee_data:

        try:
            # IMPORTANT:
            # EmployeeDataService expects the complete authenticated
            # context, not separate client/employee_id arguments.
            employee_data_service = (
                EmployeeDataService(
                    auth
                )
            )

            employee_data = (
                employee_data_service
                .build_context(
                    question
                )
            )

            employee_intents = (
                employee_data.get(
                    "intents",
                    []
                )
            )

            if employee_intents:
                logger.info(
                    "Employee-specific intent "
                    "detected. employee_id=%s "
                    "intents=%s",
                    profile["id"],
                    employee_intents,
                )

            employee_context = (
                employee_data_service
                .format_context(
                    employee_data
                )
            )

        except Exception as exc:
            logger.exception(
                "Employee data retrieval failed: %s",
                exc,
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Employee data service "
                    "temporarily unavailable."
                ),
            ) from exc

    # ------------------------------------------------------------------
    # Personal-only
    #
    # No RAG.
    # ------------------------------------------------------------------

    if route.route == "personal":

        if not employee_data_service:
            return _build_ask_response(
                answer=(
                    "I couldn't access your "
                    "authenticated HR365 employee "
                    "data."
                ),
                sources=[],
                confidence=_direct_confidence(),
            )

        try:
            # Simple employee facts should be answered directly from
            # authenticated database data. This avoids unnecessary
            # Groq/RAG calls and guarantees exact numerical answers.
            deterministic_answer = (
                employee_data_service
                .get_deterministic_answer(
                    question=question,
                    context=employee_data,
                )
            )

            if deterministic_answer:
                return _build_ask_response(
                    answer=deterministic_answer,
                    sources=[],
                    confidence=_direct_confidence(),
                )

        except Exception as exc:
            logger.exception(
                "Deterministic employee answer failed: %s",
                exc,
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to process your "
                    "employee-specific request."
                ),
            ) from exc

        # Conversational employee questions that are not simple
        # deterministic facts can still use the assistant engine,
        # but RAG remains disabled.
        pipeline = _require_pipeline()

        try:
            result = pipeline.run(
                question=question,
                additional_context=(
                    employee_context
                ),
                use_rag=False,
            )

        except Exception as exc:
            logger.exception(
                "Personal assistant execution failed: %s",
                exc,
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to generate an "
                    "employee-specific answer."
                ),
            ) from exc

        return _build_ask_response(
            answer=result["answer"],
            sources=[],
            confidence=_direct_confidence(),
        )

    # ------------------------------------------------------------------
    # POLICY / HYBRID
    # ------------------------------------------------------------------

    pipeline = _require_pipeline()

    try:
        result = pipeline.run(
            question=question,
            additional_context=(
                employee_context
            ),
            use_rag=True,
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
            detail=(
                "RAG service temporarily "
                "unavailable."
            ),
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

    # ------------------------------------------------------------------
    # Automatic HR escalation
    #
    # ONLY policy/hybrid questions can reach here.
    # Chitchat/personal/out-of-scope have already returned.
    # ------------------------------------------------------------------

    hr_ticket_id = None

    should_escalate = (
        route.route
        in {
            "policy",
            "hybrid",
        }
        and result[
            "escalation_required"
        ]
    )

    if should_escalate:

        escalation_reason = (
            result[
                "escalation_reason"
            ]
            or (
                "HR365 could not confidently "
                "answer the question."
            )
        )

        try:
            ticket_response = (
                client
                .table("hr_requests")
                .insert(
                    {
                        "employee_id": (
                            profile["id"]
                        ),
                        "category": "policy",
                        "subject": encrypt_text(
                            "HR365 escalation: "
                            "AI could not confidently answer"
                        ),
                        "description": encrypt_text(
                            "Employee question:\n"
                            f"{question}\n\n"
                            "Escalation reason:\n"
                            f"{escalation_reason}"
                        ),
                        "status": "open",
                        "priority": "urgent",
                        "is_escalated": True,
                        "escalated_at": (
                            datetime.now(
                                timezone.utc
                            ).isoformat()
                        ),
                        "escalation_reason": (
                            escalation_reason
                        ),
                    }
                )
                .execute()
            )

            if ticket_response.data:

                hr_ticket_id = (
                    ticket_response
                    .data[0]["id"]
                )

                logger.info(
                    "Automatic HR escalation "
                    "created. ticket_id=%s "
                    "employee_id=%s",
                    hr_ticket_id,
                    profile["id"],
                )

        except Exception as exc:
            logger.exception(
                "Failed to create automatic "
                "HR escalation ticket: %s",
                exc,
            )

            # The answer remains available
            # even if ticket creation fails.
            hr_ticket_id = None

    # ------------------------------------------------------------------
    # Final response
    # ------------------------------------------------------------------

    return _build_ask_response(
        answer=result["answer"],
        sources=result["sources"],
        confidence=ConfidenceItem(
            **result["confidence"]
        ),
        escalation_required=(
            should_escalate
        ),
        escalation_reason=(
            result["escalation_reason"]
            if should_escalate
            else None
        ),
        hr_ticket_id=hr_ticket_id,
    )