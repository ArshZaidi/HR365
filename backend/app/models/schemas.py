"""Pydantic schemas used by the FastAPI layer."""

from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Natural-language question.")


class SourceItem(BaseModel):
    source: str = Field(..., description="Originating file name.")
    chunk_id: str = Field(..., description="Unique chunk identifier.")
    score: float = Field(..., description="Combined relevance score.")


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]


class HealthResponse(BaseModel):
    status: str
    indexed_chunks: int
    llm_available: bool

class LeaveCreateRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None