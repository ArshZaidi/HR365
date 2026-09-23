"""
Leave management routes for HR365.
"""

from __future__ import annotations

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

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
# Schemas
# ---------------------------------------------------------------------------

class LeaveStatusUpdate(BaseModel):
    status: str


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

    allowed_statuses = {
        "pending",
        "approved",
        "rejected",
        "cancelled",
    }

    if status and status not in allowed_statuses:
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
        .eq("employee_id", profile["id"])
        .order("created_at", desc=True)
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
        query = query.eq("status", status)

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
        .eq("employee_id", profile["id"])
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

    if request.end_date < request.start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date cannot be before start_date.",
        )

    allowed_leave_types = {
        "casual",
        "sick",
        "earned",
        "annual",
        "other",
    }

    if request.leave_type not in allowed_leave_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid leave type.",
        )

    try:
        response = (
            client
            .table("leaves")
            .insert(
                {
                    "employee_id": profile["id"],
                    "leave_type": request.leave_type,
                    "start_date": request.start_date.isoformat(),
                    "end_date": request.end_date.isoformat(),
                    "reason": request.reason,
                    "status": "pending",
                }
            )
            .execute()
        )

    except Exception as exc:
        logger.exception(
            "Unable to create leave request: %s",
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

    return {
        "message": "Leave request submitted successfully.",
        "leave": response.data[0],
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

    allowed_statuses = {
        "pending",
        "approved",
        "rejected",
        "cancelled",
    }

    if status and status not in allowed_statuses:
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
        .order("created_at", desc=True)
    )

    if status:
        query = query.eq("status", status)

    if employee_id:
        query = query.eq("employee_id", employee_id)

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

    allowed_statuses = {
        "approved",
        "rejected",
        "cancelled",
    }

    if request.status not in allowed_statuses:
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
            .eq("id", leave_id)
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
            detail="Only pending leave requests can be updated.",
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
            .eq("id", leave_id)
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
            reassignment_service = TaskReassignmentService(
                client=client,
                employee_id=approved_leave["employee_id"],
                start_date=date.fromisoformat(
                    approved_leave["start_date"]
                ),
                end_date=date.fromisoformat(
                    approved_leave["end_date"]
                ),
            )

            reassignment = (
                reassignment_service.reassign_tasks()
            )

            logger.info(
                "Leave-approved task reassignment completed. "
                "leave_id=%s employee_id=%s tasks_found=%s "
                "tasks_reassigned=%s tasks_unassigned=%s",
                leave_id,
                approved_leave["employee_id"],
                reassignment.get("tasks_found", 0),
                reassignment.get("tasks_reassigned", 0),
                reassignment.get("tasks_unassigned", 0),
            )

        except Exception as exc:
            logger.exception(
                "Automatic task reassignment failed. "
                "leave_id=%s employee_id=%s",
                leave_id,
                approved_leave["employee_id"],
            )

            # The leave approval itself remains successful.
            # HR receives an explicit indication that reassignment
            # could not be completed.
            reassignment = {
                "tasks_found": 0,
                "tasks_reassigned": 0,
                "tasks_unassigned": 0,
                "assignments": [],
                "unassigned": [],
                "error": (
                    "Automatic task reassignment could not "
                    "be completed."
                ),
            }

    # -----------------------------------------------------------------------
    # Response
    # -----------------------------------------------------------------------

    return {
        "message": f"Leave request {request.status}.",
        "leave": response.data[0],
        "task_reassignment": reassignment,
    }