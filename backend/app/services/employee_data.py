"""
Employee-specific data retrieval for the HR365 hybrid assistant.

This module retrieves only data belonging to the authenticated employee.
The employee UUID is supplied by the authenticated profile, never by
the natural-language question.
"""

from __future__ import annotations

import logging
import re
from datetime import date
from typing import Any


logger = logging.getLogger("hr365.employee_data")


class EmployeeDataService:
    """
    Retrieves authenticated employee-specific data from Supabase.
    """

    def __init__(self, client: Any, employee_id: str):
        self.client = client
        self.employee_id = employee_id

    # ------------------------------------------------------------------
    # Intent detection
    # ------------------------------------------------------------------

    @staticmethod
    def detect_intents(question: str) -> set[str]:
        """
        Detect employee-specific data categories requested by the user.

        This is intentionally conservative. A question is routed to
        employee data only when it contains clear first-person or
        employee-specific language.
        """

        text = question.lower().strip()

        personal_markers = {
            "my",
            "me",
            "i ",
            "i'm",
            "i've",
            "mine",
            "myself",
        }

        is_personal = any(
            marker in text
            for marker in personal_markers
        )

        if not is_personal:
            return set()

        intents: set[str] = set()

        attendance_terms = {
            "attendance",
            "absent",
            "absence",
            "present",
            "half day",
            "half-day",
            "check in",
            "check-in",
            "check out",
            "check-out",
            "working hours",
            "attendance percentage",
        }

        leave_terms = {
            "leave",
            "leaves",
            "vacation",
            "casual leave",
            "sick leave",
            "earned leave",
            "annual leave",
            "leave balance",
            "leave request",
        }

        request_terms = {
            "hr request",
            "hr requests",
            "ticket",
            "tickets",
            "request status",
            "support request",
            "escalation",
        }

        profile_terms = {
            "profile",
            "employee id",
            "employee number",
            "department",
            "designation",
            "joining date",
            "manager",
            "my details",
            "my information",
        }

        if any(term in text for term in attendance_terms):
            intents.add("attendance")

        if any(term in text for term in leave_terms):
            intents.add("leave")

        if any(term in text for term in request_terms):
            intents.add("hr_requests")

        if any(term in text for term in profile_terms):
            intents.add("profile")

        return intents

    # ------------------------------------------------------------------
    # Database retrieval
    # ------------------------------------------------------------------

    def get_profile(self) -> dict[str, Any]:
        response = (
            self.client
            .table("profiles")
            .select(
                "employee_id, full_name, email, role, department, "
                "designation, joining_date, manager_id"
            )
            .eq("id", self.employee_id)
            .single()
            .execute()
        )

        return response.data or {}

    def get_attendance(self) -> dict[str, Any]:
        response = (
            self.client
            .table("attendance")
            .select(
                "date, status, check_in, check_out, "
                "working_hours, remarks"
            )
            .eq("employee_id", self.employee_id)
            .order("date", desc=True)
            .execute()
        )

        records = response.data or []

        present = sum(
            1
            for record in records
            if record.get("status") == "present"
        )

        absent = sum(
            1
            for record in records
            if record.get("status") == "absent"
        )

        half_day = sum(
            1
            for record in records
            if record.get("status") == "half_day"
        )

        attendance_days = present + absent + half_day

        percentage = 0.0

        if attendance_days:
            percentage = round(
                (
                    (present + half_day * 0.5)
                    / attendance_days
                )
                * 100,
                2,
            )

        return {
            "summary": {
                "total_records": len(records),
                "present": present,
                "absent": absent,
                "half_day": half_day,
                "attendance_days": attendance_days,
                "attendance_percentage": percentage,
            },
            "records": records[:30],
        }

    def get_leaves(self) -> dict[str, Any]:
        response = (
            self.client
            .table("leaves")
            .select(
                "leave_type, start_date, end_date, "
                "reason, status, created_at, updated_at"
            )
            .eq("employee_id", self.employee_id)
            .order("created_at", desc=True)
            .execute()
        )

        records = response.data or []

        pending = 0
        approved = 0
        rejected = 0
        cancelled = 0
        approved_days = 0

        for record in records:
            status = record.get("status")

            if status == "pending":
                pending += 1

            elif status == "approved":
                approved += 1

                try:
                    start = date.fromisoformat(
                        record["start_date"]
                    )
                    end = date.fromisoformat(
                        record["end_date"]
                    )

                    approved_days += (
                        end - start
                    ).days + 1

                except (
                    KeyError,
                    TypeError,
                    ValueError,
                ):
                    logger.warning(
                        "Invalid leave date data encountered "
                        "for employee_id=%s",
                        self.employee_id,
                    )

            elif status == "rejected":
                rejected += 1

            elif status == "cancelled":
                cancelled += 1

        return {
            "summary": {
                "total_requests": len(records),
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
                "cancelled": cancelled,
                "approved_leave_days": approved_days,
            },
            "records": records[:30],
        }

    def get_hr_requests(self) -> dict[str, Any]:
        response = (
            self.client
            .table("hr_requests")
            .select(
                "id, category, subject, description, status, "
                "priority, is_escalated, escalated_at, "
                "escalation_reason, created_at, updated_at, "
                "resolved_at"
            )
            .eq("employee_id", self.employee_id)
            .order("created_at", desc=True)
            .execute()
        )

        records = response.data or []

        # HR request subject/description are encrypted at rest.
        # Do not decrypt here. The dedicated HR request router already
        # handles controlled decryption. For the hybrid assistant,
        # only metadata is returned unless we explicitly add a secure
        # decryption path later.
        sanitized_records = []

        for record in records:
            sanitized_records.append(
                {
                    key: record.get(key)
                    for key in (
                        "id",
                        "category",
                        "status",
                        "priority",
                        "is_escalated",
                        "escalated_at",
                        "escalation_reason",
                        "created_at",
                        "updated_at",
                        "resolved_at",
                    )
                }
            )

        return {
            "total": len(records),
            "records": sanitized_records[:30],
        }

    # ------------------------------------------------------------------
    # Hybrid context
    # ------------------------------------------------------------------

    def build_context(
        self,
        intents: set[str],
    ) -> dict[str, Any]:
        """
        Retrieve only the employee data required by detected intents.
        """

        context: dict[str, Any] = {}

        try:
            if "profile" in intents:
                context["profile"] = self.get_profile()

            if "attendance" in intents:
                context["attendance"] = self.get_attendance()

            if "leave" in intents:
                context["leave"] = self.get_leaves()

            if "hr_requests" in intents:
                context["hr_requests"] = self.get_hr_requests()

        except Exception as exc:
            logger.exception(
                "Employee data retrieval failed. "
                "employee_id=%s error=%s",
                self.employee_id,
                exc,
            )
            raise

        return context

    @staticmethod
    def format_context(
        context: dict[str, Any],
    ) -> str:
        """
        Convert trusted database data into a compact context block.
        """

        if not context:
            return ""

        lines = [
            "AUTHENTICATED EMPLOYEE DATA:",
            (
                "This data was retrieved from the HR365 database "
                "for the authenticated employee."
            ),
            "",
        ]

        for section, data in context.items():
            lines.append(
                f"--- {section.upper()} ---"
            )

            lines.append(
                str(data)
            )

            lines.append(
                f"--- END {section.upper()} ---"
            )

        lines.extend(
            [
                "",
                "END OF AUTHENTICATED EMPLOYEE DATA.",
            ]
        )

        return "\n".join(lines)