"""
Employee-specific data service for HR365.

This service retrieves authenticated employee data from Supabase.
It is intentionally separate from the RAG knowledge base.

Employee-specific information:
- Profile
- Attendance
- Leave records
- HR requests

Policy/general information should continue to be handled by RAG.
"""

from __future__ import annotations

from typing import Any


class EmployeeDataService:
    """Retrieve employee-specific HR data using the authenticated profile."""

    def __init__(self, auth_context: dict[str, Any]):
        self.auth_context = auth_context
        self.client = auth_context["client"]
        self.profile = auth_context["profile"]

        # IMPORTANT:
        # Always use the authenticated profile ID.
        # Never take an employee ID from the user's question.
        self.employee_id = self.profile["id"]

    # ------------------------------------------------------------------
    # PROFILE
    # ------------------------------------------------------------------

    def get_profile(self) -> dict[str, Any]:
        """Return the authenticated employee's profile."""

        response = (
            self.client.table("profiles")
            .select(
                "id, employee_id, full_name, email, role, "
                "department, designation, phone, joining_date, manager_id, is_active"
            )
            .eq("id", self.employee_id)
            .single()
            .execute()
        )

        return response.data or {}

    # ------------------------------------------------------------------
    # ATTENDANCE
    # ------------------------------------------------------------------

    def get_attendance(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict[str, Any]]:
        """Return attendance records for the authenticated employee."""

        query = (
            self.client.table("attendance")
            .select(
                "id, date, status, check_in, check_out, "
                "working_hours, remarks, created_at"
            )
            .eq("employee_id", self.employee_id)
            .order("date", desc=True)
        )

        if start_date:
            query = query.gte("date", start_date)

        if end_date:
            query = query.lte("date", end_date)

        response = query.execute()

        return response.data or []

    # ------------------------------------------------------------------
    # LEAVES
    # ------------------------------------------------------------------

    def get_leaves(self) -> list[dict[str, Any]]:
        """Return leave records for the authenticated employee."""

        response = (
            self.client.table("leaves")
            .select(
                "id, leave_type, start_date, end_date, "
                "reason, status, created_at, updated_at"
            )
            .eq("employee_id", self.employee_id)
            .order("start_date", desc=True)
            .execute()
        )

        return response.data or []

    # ------------------------------------------------------------------
    # HR REQUESTS
    # ------------------------------------------------------------------

    def get_hr_requests(self) -> list[dict[str, Any]]:
        """
        Return HR request metadata for the authenticated employee.

        Subject/description are intentionally not decrypted here.
        """

        response = (
            self.client.table("hr_requests")
            .select(
                "id, category, priority, status, assigned_to, "
                "is_escalated, escalated_at, escalation_reason, "
                "created_at, updated_at, resolved_at"
            )
            .eq("employee_id", self.employee_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    # ------------------------------------------------------------------
    # INTENT DETECTION
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise(text: str) -> str:
        return " ".join(text.lower().strip().split())

    def detect_intents(self, question: str) -> set[str]:
        """Detect employee-data intents from a natural-language question."""

        q = self._normalise(question)
        intents: set[str] = set()

        attendance_terms = (
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
            "attendance record",
            "attendance records",
            "show my attendance",
            "show my attendance records",
            "how many days have i been absent",
            "how many days was i absent",
            "how many days have i been present",
            "how many days was i present",
        )

        leave_terms = (
            "leave",
            "leaves",
            "leave balance",
            "leave request",
            "leave requests",
            "show my leave",
            "show my leave requests",
            "pending leave",
            "approved leave",
            "rejected leave",
        )

        request_terms = (
            "hr request",
            "hr requests",
            "my ticket",
            "my tickets",
            "request status",
            "support request",
            "support requests",
            "escalation",
            "escalated",
        )

        profile_terms = (
            "my profile",
            "my details",
            "my information",
            "my employee id",
            "my employee number",
            "my department",
            "my designation",
            "my joining date",
            "my manager",
        )

        if any(term in q for term in attendance_terms):
            intents.add("attendance")

        if any(term in q for term in leave_terms):
            intents.add("leave")

        if any(term in q for term in request_terms):
            intents.add("hr_requests")

        if any(term in q for term in profile_terms):
            intents.add("profile")

        return intents

    # ------------------------------------------------------------------
    # DETERMINISTIC EMPLOYEE ANSWERS
    # ------------------------------------------------------------------

    def get_deterministic_answer(
        self,
        question: str,
        context: dict[str, Any],
    ) -> str | None:
        """
        Answer simple employee-specific questions directly.

        This avoids unnecessary LLM/RAG calls for facts that can be
        calculated exactly from authenticated HR data.
        """

        q = self._normalise(question)

        attendance = context.get("attendance", [])
        leaves = context.get("leaves", [])

        # --------------------------------------------------------------
        # ATTENDANCE PERCENTAGE
        # --------------------------------------------------------------

        if (
            "attendance percentage" in q
            or "what is my attendance" in q
            or "my attendance percentage" in q
        ):
            present = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower() == "present"
            )

            half_day = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower()
                in {"half_day", "half-day", "half day"}
            )

            absent = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower() == "absent"
            )

            total = present + half_day + absent

            if total == 0:
                return "I don't have enough attendance records to calculate your attendance percentage."

            percentage = ((present + 0.5 * half_day) / total) * 100

            return (
                f"Your current attendance percentage is "
                f"{percentage:.2f}%."
            )

        # --------------------------------------------------------------
        # ABSENT DAYS
        # --------------------------------------------------------------

        if (
            "how many days have i been absent" in q
            or "how many days was i absent" in q
            or "how many days have i been absent for" in q
            or "number of absent days" in q
            or "how many absent days" in q
        ):
            absent = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower() == "absent"
            )

            return f"You have been absent for {absent} day(s)."

        # --------------------------------------------------------------
        # PRESENT DAYS
        # --------------------------------------------------------------

        if (
            "how many days have i been present" in q
            or "how many days was i present" in q
            or "number of present days" in q
            or "how many present days" in q
        ):
            present = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower() == "present"
            )

            return f"You have been present for {present} day(s)."

        # --------------------------------------------------------------
        # HALF DAYS
        # --------------------------------------------------------------

        if "how many half days" in q:
            half_day = sum(
                1
                for record in attendance
                if str(record.get("status", "")).lower()
                in {"half-day", "half day"}
            )

            return f"You have {half_day} half-day attendance record(s)."

        # --------------------------------------------------------------
        # TOTAL ATTENDANCE RECORDS
        # --------------------------------------------------------------

        if (
            "total recorded days" in q
            or "how many attendance records" in q
            or "how many days are recorded" in q
        ):
            return (
                f"You have {len(attendance)} attendance record(s)."
            )

        # --------------------------------------------------------------
        # WORKING HOURS
        # --------------------------------------------------------------

        if (
            "working hours" in q
            or "hours have i worked" in q
            or "how many hours have i worked" in q
        ):
            total_hours = 0.0

            for record in attendance:
                value = record.get("working_hours")

                if value is not None:
                    try:
                        total_hours += float(value)
                    except (TypeError, ValueError):
                        pass

            return (
                f"You have recorded approximately "
                f"{total_hours:.2f} working hours."
            )

        # --------------------------------------------------------------
        # LEAVE COUNTS
        # --------------------------------------------------------------

        if "pending leave" in q or "pending leaves" in q:
            count = sum(
                1
                for leave in leaves
                if str(leave.get("status", "")).lower() == "pending"
            )

            return f"You have {count} pending leave request(s)."

        if "approved leave" in q or "approved leaves" in q:
            count = sum(
                1
                for leave in leaves
                if str(leave.get("status", "")).lower() == "approved"
            )

            return f"You have {count} approved leave request(s)."

        if "rejected leave" in q or "rejected leaves" in q:
            count = sum(
                1
                for leave in leaves
                if str(leave.get("status", "")).lower() == "rejected"
            )

            return f"You have {count} rejected leave request(s)."

        return None

    # ------------------------------------------------------------------
    # BUILD EMPLOYEE CONTEXT
    # ------------------------------------------------------------------

    def build_context(
        self,
        question: str,
    ) -> dict[str, Any]:
        """Retrieve only the employee data relevant to the question."""

        intents = self.detect_intents(question)

        context: dict[str, Any] = {
            "profile": {},
            "attendance": [],
            "leaves": [],
            "hr_requests": [],
            "intents": sorted(intents),
        }

        if "profile" in intents:
            context["profile"] = self.get_profile()

        if "attendance" in intents:
            context["attendance"] = self.get_attendance()

        if "leave" in intents:
            context["leaves"] = self.get_leaves()

        if "hr_requests" in intents:
            context["hr_requests"] = self.get_hr_requests()

        return context

    # ------------------------------------------------------------------
    # FORMAT CONTEXT FOR LLM
    # ------------------------------------------------------------------

    def format_context(
        self,
        context: dict[str, Any],
    ) -> str:
        """
        Convert employee data into safe context for the assistant.

        This is only used when an employee question actually needs
        natural-language generation.
        """

        sections: list[str] = []

        profile = context.get("profile") or {}

        if profile:
            sections.append(
                "AUTHENTICATED EMPLOYEE PROFILE:\n"
                f"- Employee ID: {profile.get('employee_id', 'N/A')}\n"
                f"- Name: {profile.get('full_name', 'N/A')}\n"
                f"- Email: {profile.get('email', 'N/A')}\n"
                f"- Department: {profile.get('department', 'N/A')}\n"
                f"- Designation: {profile.get('designation', 'N/A')}\n"
                f"- Joining Date: {profile.get('joining_date', 'N/A')}"
            )

        attendance = context.get("attendance") or []

        if attendance:
            lines = ["AUTHENTICATED ATTENDANCE RECORDS:"]

            for record in attendance:
                lines.append(
                    f"- {record.get('date', 'N/A')}: "
                    f"{record.get('status', 'N/A')}, "
                    f"{record.get('working_hours', 0)} hours"
                )

            sections.append("\n".join(lines))

        leaves = context.get("leaves") or []

        if leaves:
            lines = ["AUTHENTICATED LEAVE RECORDS:"]

            for leave in leaves:
                lines.append(
                    f"- {leave.get('leave_type', 'N/A')}: "
                    f"{leave.get('start_date', 'N/A')} to "
                    f"{leave.get('end_date', 'N/A')}, "
                    f"status={leave.get('status', 'N/A')}"
                )

            sections.append("\n".join(lines))

        hr_requests = context.get("hr_requests") or []

        if hr_requests:
            lines = ["AUTHENTICATED HR REQUEST METADATA:"]

            for request in hr_requests:
                lines.append(
                    f"- ID: {request.get('id', 'N/A')}, "
                    f"category={request.get('category', 'N/A')}, "
                    f"priority={request.get('priority', 'N/A')}, "
                    f"status={request.get('status', 'N/A')}, "
                    f"escalated={request.get('is_escalated', False)}"
                )

            sections.append("\n".join(lines))

        if not sections:
            return "No relevant authenticated employee data was found."

        return "\n\n".join(sections)