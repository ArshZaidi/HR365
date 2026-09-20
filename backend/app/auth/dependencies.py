from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from app.config import SUPABASE_KEY, SUPABASE_URL


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Authenticate the request using a Supabase access token.

    Returns:
        {
            "user": Supabase user,
            "client": authenticated Supabase client
        }
    """

    token = credentials.credentials

    try:
        client = create_client(
            SUPABASE_URL,
            SUPABASE_KEY,
        )

        response = client.auth.get_user(token)

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

        # Make subsequent database queries use this user's JWT.
        client.postgrest.auth(token)

        return {
            "user": response.user,
            "client": client,
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )


def get_current_profile(
    auth=Depends(get_current_user),
):
    """
    Get the authenticated user's HR365 profile.
    """

    current_user = auth["user"]
    client = auth["client"]

    try:
        response = (
            client
            .table("profiles")
            .select(
                "id, employee_id, full_name, email, role, "
                "department, designation, phone, joining_date, "
                "manager_id, is_active"
            )
            .eq("id", current_user.id)
            .single()
            .execute()
        )

        profile = response.data

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve HR365 profile.",
        )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="HR365 profile not found.",
        )

    if not profile["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    return {
        "profile": profile,
        "user": current_user,
        "client": client,
    }


def require_role(*allowed_roles: str):
    """
    Restrict an endpoint to specific HR365 roles.

    Example:
        Depends(require_role("hr", "admin"))
    """

    valid_roles = {"employee", "hr", "admin"}

    invalid_roles = set(allowed_roles) - valid_roles

    if invalid_roles:
        raise ValueError(
            f"Invalid HR365 role(s): {', '.join(invalid_roles)}"
        )

    def role_dependency(
        auth=Depends(get_current_profile),
    ):
        profile = auth["profile"]

        if profile["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return auth

    return role_dependency


def require_employee(
    auth=Depends(get_current_profile),
):
    """
    Allow employees, HR and admins to access an endpoint.
    """

    return auth


def require_hr(
    auth=Depends(require_role("hr", "admin")),
):
    """
    Allow HR and admins.
    """

    return auth


def require_admin(
    auth=Depends(require_role("admin")),
):
    """
    Allow admins only.
    """

    return auth