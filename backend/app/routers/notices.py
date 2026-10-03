"""
Notice management routes for HR365.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_profile, require_hr


logger = logging.getLogger("hr365.notices")


router = APIRouter(
    prefix="/api/notices",
    tags=["Notices"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NoticeCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1, max_length=20000)
    priority: str = "normal"
    category: str = "general"
    expires_at: datetime | None = None


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_PRIORITIES = {
    "low",
    "normal",
    "high",
    "urgent",
}

ALLOWED_CATEGORIES = {
    "general",
    "policy",
    "holiday",
    "payroll",
    "event",
    "urgent",
    "other",
}


# ---------------------------------------------------------------------------
# Employee / HR / Admin: Get notices
# ---------------------------------------------------------------------------

@router.get("")
def get_notices(
    auth=Depends(get_current_profile),
):
    """
    Return notices visible to the current user.

    Employees receive active notices through RLS.

    HR/Admin can also see expired notices so that the notice
    management interface remains useful.
    """

    client = auth["client"]
    profile = auth["profile"]
    user_id = profile["id"]

    try:
        response = (
            client
            .table("notices")
            .select(
                "id, title, body, priority, category, "
                "author_id, author_name, published_at, expires_at"
            )
            .order("published_at", desc=True)
            .execute()
        )

        notices = response.data or []

        # Fetch the current user's read records.
        read_response = (
            client
            .table("notice_reads")
            .select("notice_id")
            .eq("user_id", user_id)
            .execute()
        )

        read_ids = {
            row["notice_id"]
            for row in (read_response.data or [])
        }

        result = []

        for notice in notices:
            result.append(
                {
                    "id": notice["id"],
                    "title": notice["title"],
                    "body": notice["body"],
                    "priority": notice["priority"],
                    "category": notice["category"],
                    "author_id": notice["author_id"],
                    "author_name": notice.get("author_name"),
                    "published_at": notice["published_at"],
                    "expires_at": notice.get("expires_at"),
                    "is_read": notice["id"] in read_ids,
                }
            )

        unread_count = sum(
            1
            for notice in result
            if not notice["is_read"]
        )

        return {
            "notices": result,
            "unread_count": unread_count,
        }

    except Exception as exc:
        logger.exception(
            "Failed to retrieve notices: %s",
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve notices.",
        ) from exc


# ---------------------------------------------------------------------------
# Employee: Mark notice as read
# ---------------------------------------------------------------------------

@router.post("/{notice_id}/read")
def mark_notice_read(
    notice_id: str,
    auth=Depends(get_current_profile),
):
    """
    Mark one notice as read for the authenticated employee.

    RLS guarantees that the read record belongs to the current user.
    """

    client = auth["client"]
    user_id = auth["profile"]["id"]

    try:
        # First verify that the notice is actually visible to this user.
        notice_response = (
            client
            .table("notices")
            .select("id")
            .eq("id", notice_id)
            .single()
            .execute()
        )

        if not notice_response.data:
            raise HTTPException(
                status_code=404,
                detail="Notice not found.",
            )

        client.table("notice_reads").upsert(
            {
                "notice_id": notice_id,
                "user_id": user_id,
                "read_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="notice_id,user_id",
        ).execute()

        return {
            "success": True,
            "notice_id": notice_id,
            "is_read": True,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Failed to mark notice as read: notice_id=%s error=%s",
            notice_id,
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to mark notice as read.",
        ) from exc


# ---------------------------------------------------------------------------
# HR/Admin: Create notice
# ---------------------------------------------------------------------------

@router.post("")
def create_notice(
    request: NoticeCreateRequest,
    auth=Depends(require_hr),
):
    """
    Create a company notice.

    HR and Admin only.
    """

    client = auth["client"]
    profile = auth["profile"]

    priority = request.priority.strip().lower()
    category = request.category.strip().lower()

    if priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid priority. Allowed values: "
                "low, normal, high, urgent."
            ),
        )

    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail="Invalid notice category.",
        )

    title = request.title.strip()
    body = request.body.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Notice title cannot be empty.",
        )

    if not body:
        raise HTTPException(
            status_code=400,
            detail="Notice body cannot be empty.",
        )

    try:
        payload = {
            "title": title,
            "body": body,
            "priority": priority,
            "category": category,
            "author_id": profile["id"],
            "author_name": profile.get("full_name"),
            "published_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (
                request.expires_at.isoformat()
                if request.expires_at
                else None
            ),
        }

        response = (
            client
            .table("notices")
            .insert(payload)
            .select(
                "id, title, body, priority, category, "
                "author_id, author_name, published_at, expires_at"
            )
            .single()
            .execute()
        )

        notice = response.data

        return {
            "notice": {
                **notice,
                "is_read": False,
            }
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Failed to create notice: %s",
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to create notice.",
        ) from exc


# ---------------------------------------------------------------------------
# HR/Admin: Delete notice
# ---------------------------------------------------------------------------

@router.delete("/{notice_id}")
def delete_notice(
    notice_id: str,
    auth=Depends(require_hr),
):
    """
    Delete a notice.

    HR and Admin only.
    """

    client = auth["client"]

    try:
        response = (
            client
            .table("notices")
            .delete()
            .eq("id", notice_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Notice not found.",
            )

        return {
            "success": True,
            "notice_id": notice_id,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Failed to delete notice: notice_id=%s error=%s",
            notice_id,
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to delete notice.",
        ) from exc