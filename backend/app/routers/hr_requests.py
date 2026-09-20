from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth.dependencies import get_current_profile


router = APIRouter(
    prefix="/api/hr-requests",
    tags=["HR Requests"],
)


class HRRequestCreateRequest(BaseModel):
    category: str
    subject: str
    description: str
    priority: str = "normal"


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