from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_profile


router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"],
)


@router.get("/me")
def get_my_attendance(
    start_date: date | None = Query(
        default=None,
        description="Start date for attendance search.",
    ),
    end_date: date | None = Query(
        default=None,
        description="End date for attendance search.",
    ),
    auth=Depends(get_current_profile),
):
    """
    Return attendance records belonging to the authenticated employee.
    """

    profile = auth["profile"]
    client = auth["client"]

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date.",
        )

    query = (
        client
        .table("attendance")
        .select(
            "id, employee_id, date, status, "
            "check_in, check_out, working_hours, remarks, created_at"
        )
        .eq("employee_id", profile["id"])
        .order("date", desc=True)
    )

    if start_date:
        query = query.gte("date", start_date.isoformat())

    if end_date:
        query = query.lte("date", end_date.isoformat())

    try:
        response = query.execute()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve attendance records.",
        )

    return {
        "employee": {
            "id": profile["id"],
            "employee_id": profile["employee_id"],
            "full_name": profile["full_name"],
        },
        "records": response.data or [],
        "count": len(response.data or []),
    }

@router.get("/me/summary")
def get_my_attendance_summary(
    start_date: date | None = Query(
        default=None,
        description="Start date for attendance summary.",
    ),
    end_date: date | None = Query(
        default=None,
        description="End date for attendance summary.",
    ),
    auth=Depends(get_current_profile),
):
    """
    Return attendance statistics for the authenticated employee.
    """

    profile = auth["profile"]
    client = auth["client"]

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date.",
        )

    query = (
        client
        .table("attendance")
        .select("date, status")
        .eq("employee_id", profile["id"])
    )

    if start_date:
        query = query.gte("date", start_date.isoformat())

    if end_date:
        query = query.lte("date", end_date.isoformat())

    try:
        response = query.execute()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to calculate attendance summary.",
        )

    records = response.data or []

    total_records = len(records)

    present = sum(
        1 for record in records
        if record["status"] == "present"
    )

    absent = sum(
        1 for record in records
        if record["status"] == "absent"
    )

    half_day = sum(
        1 for record in records
        if record["status"] == "half_day"
    )

    leave = sum(
        1 for record in records
        if record["status"] == "leave"
    )

    holiday = sum(
        1 for record in records
        if record["status"] == "holiday"
    )

    attendance_days = present + absent + half_day

    attendance_percentage = 0.0

    if attendance_days > 0:
        attendance_percentage = round(
            (
                (present + (half_day * 0.5))
                / attendance_days
            ) * 100,
            2,
        )

    return {
        "employee": {
            "id": profile["id"],
            "employee_id": profile["employee_id"],
            "full_name": profile["full_name"],
        },
        "summary": {
            "total_records": total_records,
            "present": present,
            "absent": absent,
            "half_day": half_day,
            "leave": leave,
            "holiday": holiday,
            "attendance_days": attendance_days,
            "attendance_percentage": attendance_percentage,
        },
    }