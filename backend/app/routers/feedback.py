
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import require_employee, require_hr


router = APIRouter(
    prefix="/api/feedback",
    tags=["feedback"],
)


class FeedbackRequest(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)

    rating: str = Field(pattern="^(positive|negative)$")

    comment: str | None = None

    confidence_score: float | None = None
    confidence_level: str | None = None

    sources: list[dict[str, Any]] = Field(default_factory=list)


@router.post("")
def submit_feedback(
    payload: FeedbackRequest,
    auth=Depends(require_employee),
):
    client = auth["client"]
    profile = auth["profile"]

    try:
        response = (
            client.table("ai_feedback")
            .insert(
                {
                    "user_id": profile["id"],
                    "question": payload.question,
                    "answer": payload.answer,
                    "rating": payload.rating,
                    "comment": payload.comment,
                    "confidence_score": payload.confidence_score,
                    "confidence_level": payload.confidence_level,
                    "sources": payload.sources,
                }
            )
            .execute()
        )

        return {
            "message": "Feedback recorded successfully.",
            "feedback": response.data[0] if response.data else None,
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to record feedback.",
        )


@router.get("/me")
def get_my_feedback(
    auth=Depends(require_employee),
):
    client = auth["client"]
    profile = auth["profile"]

    try:
        response = (
            client.table("ai_feedback")
            .select(
                "id, question, answer, rating, comment, "
                "confidence_score, confidence_level, sources, created_at"
            )
            .eq("user_id", profile["id"])
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "feedback": response.data or [],
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve feedback.",
        )


@router.get("/analysis")
def feedback_analysis(
    auth=Depends(require_hr),
):
    client = auth["client"]

    try:
        # HR-side analysis should only inspect feedback that
        # the authenticated HR account is allowed to access.
        response = (
            client.table("ai_feedback")
            .select(
                "id, question, answer, rating, comment, "
                "confidence_score, confidence_level, sources, created_at"
            )
            .execute()
        )

        feedback = response.data or []

        total = len(feedback)
        positive = sum(
            1 for item in feedback
            if item["rating"] == "positive"
        )
        negative = sum(
            1 for item in feedback
            if item["rating"] == "negative"
        )

        negative_examples = []

        for item in feedback:
            if item["rating"] != "negative":
                continue

            confidence = item.get("confidence_score")
            sources = item.get("sources") or []

            if confidence is not None and confidence < 0.60:
                diagnosis = "low_confidence"

            elif not sources:
                diagnosis = "missing_retrieval_evidence"

            else:
                diagnosis = "review_retrieval_or_answer"

            negative_examples.append(
                {
                    "id": item["id"],
                    "question": item["question"],
                    "rating": item["rating"],
                    "confidence_score": confidence,
                    "confidence_level": item.get(
                        "confidence_level"
                    ),
                    "diagnosis": diagnosis,
                    "created_at": item["created_at"],
                }
            )

        negative_rate = (
            negative / total
            if total
            else 0.0
        )

        return {
            "total_feedback": total,
            "positive": positive,
            "negative": negative,
            "negative_rate": round(
                negative_rate,
                4,
            ),
            "negative_examples": negative_examples,
            "recommended_next_step": (
                "Review negative feedback and improve "
                "retrieval, chunking, or knowledge-base coverage. "
                "Then rerun Recall@1, Recall@3, and Recall@5."
            ),
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to analyze feedback.",
        )