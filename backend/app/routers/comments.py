"""
Ticket conversation routes for HR365.

HR can comment on any HR request.
Employees can comment only on their own requests.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_profile


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("hr365.comments")


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(
    prefix="/api/hr-requests",
    tags=["Ticket Comments"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CommentCreate(BaseModel):
    body: str


MAX_COMMENT_LENGTH = 1000


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_access(
    *,
    client,
    request_id: str,
    profile: dict,
) -> dict:
    """
    Confirm the current user can access this ticket.

    Returns a dict with the resolved role and ownership flags.
    Raises 404 if the ticket does not exist, 403 if forbidden.
    """

    try:
        request_response = (
            client
            .table("hr_requests")
            .select("id, employee_id")
            .eq("id", request_id)
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to retrieve HR request. request_id=%s",
            request_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve HR request.",
        ) from exc

    if not request_response.data:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    request_row = request_response.data[0]

    role = (profile.get("role") or "").lower()
    is_hr = role in ("hr", "admin")
    is_owner = request_row["employee_id"] == profile["id"]

    if not (is_hr or is_owner):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this ticket.",
        )

    return {
        "role": role,
        "is_hr": is_hr,
        "is_owner": is_owner,
    }


# ---------------------------------------------------------------------------
# List comments
# ---------------------------------------------------------------------------

@router.get("/{request_id}/comments")
def list_comments(
    request_id: str,
    auth=Depends(get_current_profile),
):
    """
    Return the full conversation thread for a ticket.
    """

    profile = auth["profile"]
    client = auth["client"]

    _resolve_access(
        client=client,
        request_id=request_id,
        profile=profile,
    )

    try:
        response = (
            client
            .table("ticket_comments")
            .select(
                "id, request_id, author_id, author_role, "
                "body, created_at"
            )
            .eq("request_id", request_id)
            .order("created_at", desc=False)
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to retrieve comments. request_id=%s",
            request_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve comments.",
        ) from exc

    comments = response.data or []

    # Hydrate author_name from the profiles table.
    author_ids = list({c["author_id"] for c in comments})

    name_map: dict[str, str] = {}

    if author_ids:
        try:
            profiles_response = (
                client
                .table("profiles")
                .select("id, full_name")
                .in_("id", author_ids)
                .execute()
            )

            for row in profiles_response.data or []:
                name_map[row["id"]] = (
                    row.get("full_name") or "User"
                )

        except Exception:
            logger.warning(
                "Unable to hydrate comment author names. "
                "request_id=%s",
                request_id,
            )

    for comment in comments:
        comment["author_name"] = name_map.get(
            comment["author_id"]
        ) or (
            "HR"
            if comment.get("author_role") == "hr"
            else "Employee"
        )

    return {
        "comments": comments,
        "count": len(comments),
    }


# ---------------------------------------------------------------------------
# Post a comment
# ---------------------------------------------------------------------------

@router.post("/{request_id}/comments")
def create_comment(
    request_id: str,
    payload: CommentCreate,
    auth=Depends(get_current_profile),
):
    """
    Post a new comment to a ticket thread.
    """

    profile = auth["profile"]
    client = auth["client"]

    access = _resolve_access(
        client=client,
        request_id=request_id,
        profile=profile,
    )

    body = (payload.body or "").strip()

    if not body:
        raise HTTPException(
            status_code=400,
            detail="Comment body is required.",
        )

    if len(body) > MAX_COMMENT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Comment cannot exceed {MAX_COMMENT_LENGTH} "
                "characters."
            ),
        )

    author_role = "hr" if access["is_hr"] else "employee"

    try:
        response = (
            client
            .table("ticket_comments")
            .insert(
                {
                    "request_id": request_id,
                    "author_id": profile["id"],
                    "author_role": author_role,
                    "body": body,
                }
            )
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to create comment. request_id=%s",
            request_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create comment.",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Comment was not created.",
        )

    comment = response.data[0]
    comment["author_name"] = (
        profile.get("full_name")
        or ("HR" if access["is_hr"] else "Employee")
    )

    return {
        "message": "Comment posted successfully.",
        "comment": comment,
    }