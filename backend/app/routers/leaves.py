from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_profile


router = APIRouter(
    prefix="/api/leaves",
    tags=["Leave Management"],
)


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
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve leave records.",
        )

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
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to calculate leave summary.",
        )

    records = response.data or []

    pending = 0
    approved = 0
    rejected = 0
    cancelled = 0
    approved_days = 0

    for record in records:
        status = record["status"]

        if status == "pending":
            pending += 1

        elif status == "approved":
            approved += 1

            start = date.fromisoformat(record["start_date"])
            end = date.fromisoformat(record["end_date"])

            approved_days += (
                end - start
            ).days + 1

        elif status == "rejected":
            rejected += 1

        elif status == "cancelled":
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