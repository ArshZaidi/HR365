"""Pydantic schemas used by the FastAPI layer."""

from __future__ import annotations

from datetime import date
from typing import List

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural-language question.")


class SourceItem(BaseModel):
    source: str = Field(..., description="Originating file name.")
    chunk_id: str = Field(..., description="Unique chunk identifier.")
    score: float = Field(..., description="Combined relevance score.")

class ConfidenceItem(BaseModel):
    score: float
    level: str
    top_similarity: float
    mean_similarity: float
    evidence_score: float
    relevant_chunk_count: int

class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    confidence: ConfidenceItem
    escalation_required: bool
    escalation_reason: str | None = None
    hr_ticket_id: str | None = None

class HealthResponse(BaseModel):
    status: str
    indexed_chunks: int
    llm_available: bool

class LeaveCreateRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None

class HRRequestCreateRequest(BaseModel):
    category: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    subject: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )
    priority: str = Field(
        default="normal",
        max_length=20,
    )