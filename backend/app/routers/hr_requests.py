from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth.dependencies import get_current_profile
from app.auth.dependencies import get_current_profile, require_hr
from datetime import datetime, timezone

router = APIRouter(
    prefix="/api/hr-requests",
    tags=["HR Requests"],
)


class HRRequestCreateRequest(BaseModel):
    category: str
    subject: str
    description: str
    priority: str = "normal"

class HRRequestAssignRequest(BaseModel):
    assigned_to: str

class HRRequestStatusUpdate(BaseModel):
    status: str

class HREscalationRequest(BaseModel):
    reason: str | None = None


@router.post("")
def create_hr_request(
    request: HRRequestCreateRequest,
    auth=Depends(get_current_profile),
):
    profile = auth["profile"]
    client = auth["client"]

    allowed_categories = {
        "payroll",
        "leave",
        "attendance",
        "IT",
        "general",
        "policy",
        "other",
    }

    allowed_priorities = {
        "low",
        "normal",
        "high",
        "urgent",
    }

    category = request.category.strip()
    subject = request.subject.strip()
    description = request.description.strip()
    priority = request.priority.strip().lower()

    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail="Invalid request category.",
        )

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=400,
            detail="Invalid request priority.",
        )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Subject cannot be empty.",
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Description cannot be empty.",
        )

    try:
        response = (
            client.table("hr_requests")
            .insert(
                {
                    "employee_id": profile["id"],
                    "category": category,
                    "subject": subject,
                    "description": description,
                    "status": "open",
                    "priority": priority,
                    "is_escalated": priority == "urgent",
                    "escalated_at": (
                        datetime.now(timezone.utc).isoformat()
                        if priority == "urgent"
                        else None
                    ),
                    "escalation_reason": (
                        "Automatically escalated because priority is urgent."
                        if priority == "urgent"
                        else None
                    ),
                }
            )
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create HR request: {str(exc)}",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="HR request was not created.",
        )

    return response.data[0]

@router.get("/me")
def get_my_hr_requests(
    auth=Depends(get_current_profile),
):
    profile = auth["profile"]
    client = auth["client"]

    try:
        response = (
            client.table("hr_requests")
            .select(
                "id, category, subject, description, status, "
                "priority, assigned_to, created_at, updated_at, resolved_at"
            )
            .eq("employee_id", profile["id"])
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve HR requests: {str(exc)}",
        )

    return {
        "requests": response.data or [],
        "total": len(response.data or []),
    }

@router.get("")
def get_all_hr_requests(
    status: str | None = None,
    employee_id: str | None = None,
    auth=Depends(require_hr),
):
    client = auth["client"]

    try:
        query = (
            client.table("hr_requests")
            .select(
                "id, employee_id, category, subject, description, "
                "status, priority, assigned_to, is_escalated, "
                "escalated_at, escalation_reason, "
                "created_at, updated_at, resolved_at"
            )
            .order("created_at", desc=True)
        )

        if status:
            query = query.eq("status", status)

        if employee_id:
            query = query.eq("employee_id", employee_id)

        response = query.execute()

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve HR requests: {str(exc)}",
        )

    return {
        "requests": response.data or [],
        "total": len(response.data or []),
    }

@router.patch("/{request_id}/assign")
def assign_hr_request(
    request_id: str,
    request: HRRequestAssignRequest,
    auth=Depends(require_hr),
):
    client = auth["client"]

    try:
        # Verify that the assignee exists and is HR/admin.
        profile_response = (
            client.table("profiles")
            .select("id, role, is_active")
            .eq("id", request.assigned_to)
            .single()
            .execute()
        )

        assignee = profile_response.data

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Assigned HR user not found.",
        )

    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assigned HR user not found.",
        )

    if assignee["role"] not in {"hr", "admin"}:
        raise HTTPException(
            status_code=400,
            detail="Requests can only be assigned to HR or admin users.",
        )

    if not assignee["is_active"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign a request to an inactive user.",
        )

    try:
        response = (
            client.table("hr_requests")
            .update({
                "assigned_to": request.assigned_to,
                "status": "in_progress",
            })
            .eq("id", request_id)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to assign HR request: {str(exc)}",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    return response.data[0]

@router.patch("/{request_id}/status")
def update_hr_request_status(
    request_id: str,
    request: HRRequestStatusUpdate,
    auth=Depends(require_hr),
):
    client = auth["client"]

    allowed_statuses = {
        "open",
        "in_progress",
        "resolved",
        "closed",
    }

    new_status = request.status.strip().lower()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid request status.",
        )

    try:
        existing_response = (
            client.table("hr_requests")
            .select("id, status")
            .eq("id", request_id)
            .single()
            .execute()
        )

        existing = existing_response.data

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    update_data = {
        "status": new_status,
    }

    if new_status == "resolved":
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status in {"open", "in_progress"}:
        update_data["resolved_at"] = None

    try:
        response = (
            client.table("hr_requests")
            .update(update_data)
            .eq("id", request_id)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to update HR request status: {str(exc)}",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    return response.data[0]

@router.patch("/{request_id}/escalate")
def escalate_hr_request(
    request_id: str,
    request: HREscalationRequest,
    auth=Depends(require_hr),
):
    client = auth["client"]

    reason = (
        request.reason.strip()
        if request.reason and request.reason.strip()
        else "Escalated to human HR for further review."
    )

    try:
        response = (
            client.table("hr_requests")
            .update({
                "is_escalated": True,
                "escalated_at": datetime.now(timezone.utc).isoformat(),
                "escalation_reason": reason,
                "priority": "urgent",
            })
            .eq("id", request_id)
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to escalate HR request: {str(exc)}",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="HR request not found.",
        )

    return response.data[0]