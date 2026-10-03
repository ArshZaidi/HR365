"""
Leave management routes for HR365.

Includes:
- Employee leave retrieval
- Employee leave summary
- Normal leave submission
- Natural-language leave action preview
- Confirmed natural-language leave submission
- HR/admin leave management
- Automatic task reassignment after approved leave
"""

from __future__ import annotations

import logging
import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.auth.dependencies import (
    get_current_profile,
    require_hr,
)
from app.models.schemas import LeaveCreateRequest
from app.services.task_reassignment import TaskReassignmentService


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("hr365.leaves")


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(
    prefix="/api/leaves",
    tags=["Leave Management"],
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_LEAVE_TYPES = {
    "casual",
    "sick",
    "earned",
    "annual",
    "other",
}

ALLOWED_LEAVE_STATUSES = {
    "pending",
    "approved",
    "rejected",
    "cancelled",
}

LEAVE_TYPE_ALIASES = {
    "casual": "casual",
    "casual leave": "casual",
    "cl": "casual",
    "sick": "sick",
    "sick leave": "sick",
    "sl": "sick",
    "earned": "earned",
    "earned leave": "earned",
    "el": "earned",
    "annual": "annual",
    "annual leave": "annual",
    "vacation": "annual",
    "vacation leave": "annual",
    "other": "other",
    "other leave": "other",
}

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

MONTH_PATTERN = (
    "(?:"
    + "|".join(
        sorted(
            MONTHS.keys(),
            key=len,
            reverse=True,
        )
    )
    + ")"
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LeaveStatusUpdate(BaseModel):
    status: str


class LeaveActionPreviewRequest(BaseModel):
    """
    Natural-language command sent by the AI assistant.
    """

    command: str = Field(
        ...,
        min_length=1,
        max_length=1000,
    )


class LeaveActionExecuteRequest(BaseModel):
    """
    Normalized leave action submitted after the user confirms it.
    """

    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None
    confirmed: bool = False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise_leave_type(value: str) -> str | None:
    """
    Convert common leave-type names/abbreviations into the
    canonical HR365 leave type.
    """

    normalized = (
        value
        .strip()
        .lower()
    )

    return LEAVE_TYPE_ALIASES.get(
        normalized
    )


def _extract_leave_type(
    command: str,
) -> str | None:
    """
    Detect the leave type from a natural-language command.

    The longest aliases are checked first so that
    "casual leave" is detected before "casual".
    """

    normalized = command.lower()

    aliases = sorted(
        LEAVE_TYPE_ALIASES.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    for alias, canonical in aliases:
        pattern = rf"\b{re.escape(alias)}\b"

        if re.search(
            pattern,
            normalized,
        ):
            return canonical

    return None


def _safe_date(
    year: int,
    month: int,
    day: int,
) -> date | None:
    """
    Safely construct a date.
    """

    try:
        return date(
            year,
            month,
            day,
        )
    except ValueError:
        return None


def _extract_dates(
    command: str,
) -> list[date]:
    """
    Extract one or two dates from common natural-language formats.

    Supported examples:

    2026-10-07
    October 7
    October 7, 2026
    7 October
    7 October 2026
    October 7 to October 9
    October 7-9
    7 to 9 October
    2026-10-07 to 2026-10-09
    """

    text = (
        command
        .lower()
        .replace(",", " ")
    )

    extracted: list[date] = []

    # -----------------------------------------------------------------------
    # ISO dates
    # -----------------------------------------------------------------------

    iso_matches = re.findall(
        r"\b\d{4}-\d{1,2}-\d{1,2}\b",
        text,
    )

    for value in iso_matches:
        try:
            parsed = date.fromisoformat(
                value
            )
            extracted.append(parsed)
        except ValueError:
            continue

    # -----------------------------------------------------------------------
    # Month-first ranges
    #
    # October 7 to October 9
    # October 7-9
    # -----------------------------------------------------------------------

    month_first_range = re.search(
        rf"\b("
        rf"{MONTH_PATTERN}"
        rf")\s+"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"\s*(?:to|-)\s*"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"(?:\s+(\d{{4}}))?\b",
        text,
    )

    if month_first_range:
        (
            month_name,
            start_day,
            end_day,
            year,
        ) = month_first_range.groups()

        target_year = (
            int(year)
            if year
            else date.today().year
        )

        month = MONTHS[month_name]

        start = _safe_date(
            target_year,
            month,
            int(start_day),
        )

        end = _safe_date(
            target_year,
            month,
            int(end_day),
        )

        if start:
            extracted.append(start)

        if end:
            extracted.append(end)

    # -----------------------------------------------------------------------
    # Day-first ranges
    #
    # 7 to 9 October
    # 7-9 October
    # -----------------------------------------------------------------------

    day_first_range = re.search(
        rf"\b"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"\s*(?:to|-)\s*"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"\s+("
        rf"{MONTH_PATTERN}"
        rf")"
        rf"(?:\s+(\d{{4}}))?\b",
        text,
    )

    if day_first_range:
        (
            start_day,
            end_day,
            month_name,
            year,
        ) = day_first_range.groups()

        target_year = (
            int(year)
            if year
            else date.today().year
        )

        month = MONTHS[month_name]

        start = _safe_date(
            target_year,
            month,
            int(start_day),
        )

        end = _safe_date(
            target_year,
            month,
            int(end_day),
        )

        if start:
            extracted.append(start)

        if end:
            extracted.append(end)

    # -----------------------------------------------------------------------
    # Month-first individual dates
    #
    # October 7
    # October 7 2026
    # -----------------------------------------------------------------------

    month_first_matches = re.findall(
        rf"\b("
        rf"{MONTH_PATTERN}"
        rf")\s+"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"(?:\s+(\d{{4}}))?\b",
        text,
    )

    for (
        month_name,
        day,
        year,
    ) in month_first_matches:

        target_year = (
            int(year)
            if year
            else date.today().year
        )

        parsed = _safe_date(
            target_year,
            MONTHS[month_name],
            int(day),
        )

        if parsed:
            extracted.append(parsed)

    # -----------------------------------------------------------------------
    # Day-first individual dates
    #
    # 7 October
    # 7 October 2026
    # -----------------------------------------------------------------------

    day_first_matches = re.findall(
        rf"\b"
        rf"(\d{{1,2}})"
        rf"(?:st|nd|rd|th)?"
        rf"\s+("
        rf"{MONTH_PATTERN}"
        rf")"
        rf"(?:\s+(\d{{4}}))?\b",
        text,
    )

    for (
        day,
        month_name,
        year,
    ) in day_first_matches:

        target_year = (
            int(year)
            if year
            else date.today().year
        )

        parsed = _safe_date(
            target_year,
            MONTHS[month_name],
            int(day),
        )

        if parsed:
            extracted.append(parsed)

    # -----------------------------------------------------------------------
    # Deduplicate while preserving chronological order.
    # -----------------------------------------------------------------------

    return sorted(
        set(extracted)
    )


def _is_leave_command(
    command: str,
) -> bool:
    """
    Determine whether a natural-language command is attempting
    to perform a leave action.
    """

    normalized = (
        command
        .strip()
        .lower()
    )

    leave_terms = (
        "leave",
        "vacation",
        "time off",
    )

    action_terms = (
        "apply",
        "request",
        "submit",
        "take",
        "book",
        "need",
        "want",
        "use",
    )

    has_leave_term = any(
        term in normalized
        for term in leave_terms
    )

    has_action_term = any(
        term in normalized
        for term in action_terms
    )

    return (
        has_leave_term
        and has_action_term
    )


def _format_leave_type(
    leave_type: str,
) -> str:
    """
    Convert canonical leave types to UI-friendly labels.
    """

    labels = {
        "casual": "Casual Leave",
        "sick": "Sick Leave",
        "earned": "Earned Leave",
        "annual": "Annual Leave",
        "other": "Other Leave",
    }

    return labels.get(
        leave_type,
        leave_type.title(),
    )


def _calculate_leave_days(
    start_date: date,
    end_date: date,
) -> int:
    """
    Calculate inclusive leave duration.
    """

    return (
        end_date - start_date
    ).days + 1


def _check_leave_overlap(
    client,
    employee_id: str,
    start_date: date,
    end_date: date,
) -> bool:
    """
    Return True if the employee already has a pending or approved
    leave overlapping the requested period.
    """

    response = (
        client
        .table("leaves")
        .select(
            "id, start_date, end_date, status"
        )
        .eq(
            "employee_id",
            employee_id,
        )
        .in_(
            "status",
            [
                "pending",
                "approved",
            ],
        )
        .lte(
            "start_date",
            end_date.isoformat(),
        )
        .gte(
            "end_date",
            start_date.isoformat(),
        )
        .execute()
    )

    return bool(
        response.data
    )


def _create_leave_for_employee(
    *,
    client,
    employee_id: str,
    leave_type: str,
    start_date: date,
    end_date: date,
    reason: str | None,
) -> dict:
    """
    Shared validated leave-creation implementation.

    Both the normal API and the AI action endpoint use this function,
    ensuring the same validation rules apply to both paths.
    """

    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "end_date cannot be before "
                "start_date."
            ),
        )

    canonical_type = _normalise_leave_type(
        leave_type
    )

    if canonical_type is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid leave type. "
                "Use casual, sick, earned, annual, or other."
            ),
        )

    try:
        overlapping = _check_leave_overlap(
            client=client,
            employee_id=employee_id,
            start_date=start_date,
            end_date=end_date,
        )

    except Exception as exc:
        logger.exception(
            "Leave overlap validation failed. "
            "employee_id=%s error=%s",
            employee_id,
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to validate the requested "
                "leave period."
            ),
        ) from exc

    if overlapping:
        raise HTTPException(
            status_code=409,
            detail=(
                "You already have a pending or approved "
                "leave overlapping this period."
            ),
        )

    try:
        response = (
            client
            .table("leaves")
            .insert(
                {
                    "employee_id": employee_id,
                    "leave_type": canonical_type,
                    "start_date": (
                        start_date.isoformat()
                    ),
                    "end_date": (
                        end_date.isoformat()
                    ),
                    "reason": (
                        reason.strip()
                        if reason
                        and reason.strip()
                        else None
                    ),
                    "status": "pending",
                }
            )
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to create leave request. "
            "employee_id=%s error=%s",
            employee_id,
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create leave request.",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Leave request was not created.",
        )

    return response.data[0]


# ---------------------------------------------------------------------------
# Employee: View own leaves
# ---------------------------------------------------------------------------

@router.get("/me")
def get_my_leaves(
    start_date: date | None = Query(
        default=None,
        description="Filter leaves from this date.",
    ),
    end_date: date | None = Query(
        default=None,
        description="Filter leaves until this date.",
    ),
    status: str | None = Query(
        default=None,
        description="Filter by leave status.",
    ),
    auth=Depends(get_current_profile),
):
    """
    Return leave requests belonging to the authenticated employee.
    """

    profile = auth["profile"]
    client = auth["client"]

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date.",
        )

    if status and status not in ALLOWED_LEAVE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid leave status.",
        )

    query = (
        client
        .table("leaves")
        .select(
            "id, employee_id, leave_type, start_date, "
            "end_date, reason, status, approved_by, "
            "created_at, updated_at"
        )
        .eq(
            "employee_id",
            profile["id"],
        )
        .order(
            "created_at",
            desc=True,
        )
    )

    if start_date:
        query = query.gte(
            "start_date",
            start_date.isoformat(),
        )

    if end_date:
        query = query.lte(
            "end_date",
            end_date.isoformat(),
        )

    if status:
        query = query.eq(
            "status",
            status,
        )

    try:
        response = query.execute()

    except Exception as exc:
        logger.exception(
            "Unable to retrieve leave records: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve leave records.",
        ) from exc

    records = response.data or []

    return {
        "employee": {
            "id": profile["id"],
            "employee_id": profile["employee_id"],
            "full_name": profile["full_name"],
        },
        "records": records,
        "count": len(records),
    }


# ---------------------------------------------------------------------------
# Employee: Leave summary
# ---------------------------------------------------------------------------

@router.get("/me/summary")
def get_my_leave_summary(
    auth=Depends(get_current_profile),
):
    """
    Return leave statistics for the authenticated employee.
    """

    profile = auth["profile"]
    client = auth["client"]

    query = (
        client
        .table("leaves")
        .select(
            "id, start_date, end_date, status"
        )
        .eq(
            "employee_id",
            profile["id"],
        )
    )

    try:
        response = query.execute()

    except Exception as exc:
        logger.exception(
            "Unable to calculate leave summary: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to calculate leave summary.",
        ) from exc

    records = response.data or []

    pending = 0
    approved = 0
    rejected = 0
    cancelled = 0
    approved_days = 0

    for record in records:

        record_status = record["status"]

        if record_status == "pending":
            pending += 1

        elif record_status == "approved":
            approved += 1

            start = date.fromisoformat(
                record["start_date"]
            )

            end = date.fromisoformat(
                record["end_date"]
            )

            approved_days += (
                end - start
            ).days + 1

        elif record_status == "rejected":
            rejected += 1

        elif record_status == "cancelled":
            cancelled += 1

    return {
        "employee": {
            "id": profile["id"],
            "employee_id": profile["employee_id"],
            "full_name": profile["full_name"],
        },
        "summary": {
            "total_requests": len(records),
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "cancelled": cancelled,
            "approved_leave_days": approved_days,
        },
    }


# ---------------------------------------------------------------------------
# AI Leave Actions: Preview
# ---------------------------------------------------------------------------

@router.post("/ai/preview")
def preview_leave_action(
    request: LeaveActionPreviewRequest,
    auth=Depends(get_current_profile),
):
    """
    Parse a natural-language leave command.

    This endpoint NEVER writes to the database.

    It returns a normalized action that the frontend can show to
    the employee for confirmation.
    """

    command = request.command.strip()

    if not _is_leave_command(command):
        return {
            "matched": False,
            "action": None,
            "requires_confirmation": False,
            "ready": False,
            "message": (
                "This does not appear to be a leave action."
            ),
            "payload": None,
        }

    leave_type = _extract_leave_type(
        command
    )

    dates = _extract_dates(
        command
    )

    missing_fields = []

    if leave_type is None:
        missing_fields.append(
            "leave_type"
        )

    if not dates:
        missing_fields.append(
            "start_date"
        )
        missing_fields.append(
            "end_date"
        )
    elif len(dates) == 1:
        start_date = dates[0]
        end_date = dates[0]
    else:
        start_date = dates[0]
        end_date = dates[1]

    if missing_fields:
        return {
            "matched": True,
            "action": "create_leave",
            "requires_confirmation": False,
            "ready": False,
            "missing_fields": missing_fields,
            "message": (
                "I can prepare the leave request, "
                "but I need "
                + ", ".join(
                    missing_fields
                )
                + "."
            ),
            "payload": None,
        }

    if end_date < start_date:
        return {
            "matched": True,
            "action": "create_leave",
            "requires_confirmation": False,
            "ready": False,
            "missing_fields": [],
            "message": (
                "The leave end date cannot be "
                "before the start date."
            ),
            "payload": None,
        }

    client = auth["client"]
    profile = auth["profile"]

    try:
        overlapping = _check_leave_overlap(
            client=client,
            employee_id=profile["id"],
            start_date=start_date,
            end_date=end_date,
        )

    except Exception as exc:
        logger.exception(
            "AI leave preview validation failed. "
            "employee_id=%s error=%s",
            profile["id"],
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to validate the requested "
                "leave period."
            ),
        ) from exc

    if overlapping:
        return {
            "matched": True,
            "action": "create_leave",
            "requires_confirmation": False,
            "ready": False,
            "missing_fields": [],
            "message": (
                "You already have a pending or approved "
                "leave overlapping this period."
            ),
            "payload": {
                "leave_type": leave_type,
                "start_date": (
                    start_date.isoformat()
                ),
                "end_date": (
                    end_date.isoformat()
                ),
                "reason": None,
            },
        }

    days = _calculate_leave_days(
        start_date,
        end_date,
    )

    formatted_type = _format_leave_type(
        leave_type
    )

    confirmation_text = (
        f"You're requesting {days} "
        f"{'day' if days == 1 else 'days'} "
        f"of {formatted_type} from "
        f"{start_date.strftime('%B')} "
        f"{start_date.day}, "
        f"{start_date.year} "
        f"to "
        f"{end_date.strftime('%B')} "
        f"{end_date.day}, "
        f"{end_date.year}."
    )

    return {
        "matched": True,
        "action": "create_leave",
        "requires_confirmation": True,
        "ready": True,
        "missing_fields": [],
        "message": confirmation_text,
        "confirmation_text": (
            confirmation_text
            + " Would you like me to submit it?"
        ),
        "payload": {
            "leave_type": leave_type,
            "start_date": (
                start_date.isoformat()
            ),
            "end_date": (
                end_date.isoformat()
            ),
            "reason": None,
        },
    }


# ---------------------------------------------------------------------------
# AI Leave Actions: Confirm
# ---------------------------------------------------------------------------

@router.post("/ai/confirm")
def confirm_leave_action(
    request: LeaveActionExecuteRequest,
    auth=Depends(get_current_profile),
):
    """
    Execute a normalized leave action after explicit user confirmation.

    The request is validated again before writing to Supabase.
    """

    if not request.confirmed:
        raise HTTPException(
            status_code=400,
            detail=(
                "Leave action was not confirmed."
            ),
        )

    profile = auth["profile"]
    client = auth["client"]

    leave = _create_leave_for_employee(
        client=client,
        employee_id=profile["id"],
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason,
    )

    days = _calculate_leave_days(
        request.start_date,
        request.end_date,
    )

    return {
        "success": True,
        "action": "create_leave",
        "message": (
            f"Leave request submitted successfully "
            f"for {days} "
            f"{'day' if days == 1 else 'days'}."
        ),
        "leave": leave,
    }


# ---------------------------------------------------------------------------
# Employee: Create leave request
# ---------------------------------------------------------------------------

@router.post("")
def create_leave(
    request: LeaveCreateRequest,
    auth=Depends(get_current_profile),
):
    """
    Submit a new leave request for the authenticated employee.
    """

    profile = auth["profile"]
    client = auth["client"]

    leave = _create_leave_for_employee(
        client=client,
        employee_id=profile["id"],
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason,
    )

    return {
        "message": (
            "Leave request submitted successfully."
        ),
        "leave": leave,
    }


# ---------------------------------------------------------------------------
# HR/Admin: View all leaves
# ---------------------------------------------------------------------------

@router.get("")
def get_all_leaves(
    status: str | None = Query(
        default=None,
        description="Filter by leave status.",
    ),
    employee_id: str | None = Query(
        default=None,
        description="Filter by employee UUID.",
    ),
    auth=Depends(require_hr),
):
    """
    Return leave requests for HR/admin users.
    """

    client = auth["client"]

    if status and status not in ALLOWED_LEAVE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid leave status.",
        )

    query = (
        client
        .table("leaves")
        .select(
            "id, employee_id, leave_type, start_date, "
            "end_date, reason, status, approved_by, "
            "created_at, updated_at"
        )
        .order(
            "created_at",
            desc=True,
        )
    )

    if status:
        query = query.eq(
            "status",
            status,
        )

    if employee_id:
        query = query.eq(
            "employee_id",
            employee_id,
        )

    try:
        response = query.execute()

    except Exception as exc:
        logger.exception(
            "Unable to retrieve leave requests: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve leave requests.",
        ) from exc

    records = response.data or []

    return {
        "records": records,
        "count": len(records),
    }


# ---------------------------------------------------------------------------
# HR/Admin: Approve / reject / cancel leave
# ---------------------------------------------------------------------------

@router.patch("/{leave_id}")
def update_leave_status(
    leave_id: str,
    request: LeaveStatusUpdate,
    auth=Depends(require_hr),
):
    """
    Approve, reject, or cancel an employee leave request.

    When a leave is approved, HR365 automatically attempts to
    reassign the employee's active tasks to suitable available
    employees based on role, department, availability, and workload.
    """

    client = auth["client"]
    profile = auth["profile"]

    if request.status not in {
        "approved",
        "rejected",
        "cancelled",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Use approved, rejected, or cancelled."
            ),
        )

    # -----------------------------------------------------------------------
    # Check that the leave exists
    # -----------------------------------------------------------------------

    try:
        existing = (
            client
            .table("leaves")
            .select(
                "id, employee_id, leave_type, "
                "start_date, end_date, reason, status"
            )
            .eq(
                "id",
                leave_id,
            )
            .single()
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to retrieve leave request: %s",
            exc,
        )

        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        ) from exc

    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if existing.data["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending leave requests "
                "can be updated."
            ),
        )

    # -----------------------------------------------------------------------
    # Update leave request
    # -----------------------------------------------------------------------

    try:
        response = (
            client
            .table("leaves")
            .update(
                {
                    "status": request.status,
                    "approved_by": profile["id"],
                }
            )
            .eq(
                "id",
                leave_id,
            )
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to update leave request: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update leave request.",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Leave request was not updated.",
        )

    # -----------------------------------------------------------------------
    # Automatic task reassignment
    # -----------------------------------------------------------------------

    reassignment = None

    if request.status == "approved":

        approved_leave = response.data[0]

        try:
            reassignment_service = (
                TaskReassignmentService(
                    client=client,
                    employee_id=(
                        approved_leave[
                            "employee_id"
                        ]
                    ),
                    start_date=date.fromisoformat(
                        approved_leave[
                            "start_date"
                        ]
                    ),
                    end_date=date.fromisoformat(
                        approved_leave[
                            "end_date"
                        ]
                    ),
                )
            )

            reassignment = (
                reassignment_service
                .reassign_tasks()
            )

            logger.info(
                "Leave-approved task reassignment completed. "
                "leave_id=%s employee_id=%s tasks_found=%s "
                "tasks_reassigned=%s tasks_unassigned=%s",
                leave_id,
                approved_leave[
                    "employee_id"
                ],
                reassignment.get(
                    "tasks_found",
                    0,
                ),
                reassignment.get(
                    "tasks_reassigned",
                    0,
                ),
                reassignment.get(
                    "tasks_unassigned",
                    0,
                ),
            )

        except Exception:
            logger.exception(
                "Automatic task reassignment failed. "
                "leave_id=%s employee_id=%s",
                leave_id,
                approved_leave[
                    "employee_id"
                ],
            )

            reassignment = {
                "tasks_found": 0,
                "tasks_reassigned": 0,
                "tasks_unassigned": 0,
                "assignments": [],
                "unassigned": [],
                "error": (
                    "Automatic task reassignment "
                    "could not be completed."
                ),
            }

    # -----------------------------------------------------------------------
    # Response
    # -----------------------------------------------------------------------

    return {
        "message": (
            f"Leave request "
            f"{request.status}."
        ),
        "leave": response.data[0],
        "task_reassignment": reassignment,
    }