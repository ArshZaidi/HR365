"""
Automatic task reassignment for approved employee leave.
"""

from __future__ import annotations

import logging
from datetime import date

logger = logging.getLogger("hr365.task_reassignment")


class TaskReassignmentService:
    """
    Finds suitable replacement employees when an employee's
    leave is approved.

    Selection criteria:
    1. Employee is active.
    2. Employee has the required role.
    3. Employee belongs to the compatible department.
    4. Employee is not on approved leave during the affected period.
    5. Employee with the lowest active workload is preferred.
    """

    def __init__(
        self,
        client,
        employee_id: str,
        start_date: date,
        end_date: date,
    ):
        self.client = client
        self.employee_id = employee_id
        self.start_date = start_date
        self.end_date = end_date

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def reassign_tasks(self) -> dict:
        """
        Reassign active tasks belonging to the employee on leave.

        Returns a summary of the reassignment operation.
        """

        tasks = self._get_employee_tasks()

        if not tasks:
            return {
                "tasks_found": 0,
                "tasks_reassigned": 0,
                "tasks_unassigned": 0,
                "assignments": [],
            }

        reassigned = []
        unassigned = []

        for task in tasks:

            replacement = self._find_replacement(task)

            if replacement is None:
                unassigned.append(
                    {
                        "task_id": task["id"],
                        "task_title": task["title"],
                        "reason": (
                            "No eligible replacement employee "
                            "was available."
                        ),
                    }
                )
                continue

            self._assign_task(
                task_id=task["id"],
                new_employee_id=replacement["id"],
            )

            reason = (
                "Automatic reassignment after approved leave. "
                "Role match, department compatibility, availability, "
                "and lowest active workload considered."
            )

            self._create_assignment_record(
                task_id=task["id"],
                previous_employee_id=self.employee_id,
                new_employee_id=replacement["id"],
                reason=reason,
            )

            reassigned.append(
                {
                    "task_id": task["id"],
                    "task_title": task["title"],
                    "new_employee_id": replacement["id"],
                    "new_employee_name": replacement["full_name"],
                    "reason": reason,
                }
            )

        return {
            "tasks_found": len(tasks),
            "tasks_reassigned": len(reassigned),
            "tasks_unassigned": len(unassigned),
            "assignments": reassigned,
            "unassigned": unassigned,
        }

    # ------------------------------------------------------------------
    # Task retrieval
    # ------------------------------------------------------------------

    def _get_employee_tasks(self) -> list[dict]:
        """
        Get active tasks currently assigned to the employee on leave.
        """

        response = (
            self.client
            .table("tasks")
            .select(
                "id, title, description, assigned_to, "
                "required_role, department, priority, "
                "due_date, status"
            )
            .eq("assigned_to", self.employee_id)
            .in_(
                "status",
                ["open", "in_progress"],
            )
            .execute()
        )

        return response.data or []

    # ------------------------------------------------------------------
    # Candidate selection
    # ------------------------------------------------------------------

    def _find_replacement(
        self,
        task: dict,
    ) -> dict | None:
        """
        Find the best eligible replacement for a task.
        """

        required_role = task.get("required_role")
        department = task.get("department")

        candidates = self._get_role_candidates(
            required_role=required_role,
            department=department,
        )

        if not candidates:
            return None

        eligible = []

        for candidate in candidates:

            if candidate["id"] == self.employee_id:
                continue

            if self._is_on_leave(candidate["id"]):
                continue

            workload = self._get_workload(
                candidate["id"]
            )

            candidate_with_workload = {
                **candidate,
                "workload": workload,
            }

            eligible.append(candidate_with_workload)

        if not eligible:
            return None

        # Lowest workload wins.
        eligible.sort(
            key=lambda employee: employee["workload"]
        )

        return eligible[0]

    # ------------------------------------------------------------------
    # Candidate lookup
    # ------------------------------------------------------------------

    def _get_role_candidates(
        self,
        required_role: str | None,
        department: str | None,
    ) -> list[dict]:

        query = (
            self.client
            .table("profiles")
            .select(
                "id, employee_id, full_name, "
                "role, department, is_active"
            )
            .eq("is_active", True)
        )

        if required_role:
            query = query.eq(
                "designation",
                required_role,
            )

        if department:
            query = query.eq(
                "department",
                department,
            )

        response = query.execute()

        return response.data or []

    # ------------------------------------------------------------------
    # Leave availability
    # ------------------------------------------------------------------

    def _is_on_leave(
        self,
        employee_id: str,
    ) -> bool:
        """
        Determine whether an employee has approved leave that overlaps
        the original employee's leave period.
        """

        response = (
            self.client
            .table("leaves")
            .select(
                "id, start_date, end_date"
            )
            .eq(
                "employee_id",
                employee_id,
            )
            .eq(
                "status",
                "approved",
            )
            .lte(
                "start_date",
                self.end_date.isoformat(),
            )
            .gte(
                "end_date",
                self.start_date.isoformat(),
            )
            .execute()
        )

        return bool(response.data)

    # ------------------------------------------------------------------
    # Workload
    # ------------------------------------------------------------------

    def _get_workload(
        self,
        employee_id: str,
    ) -> int:
        """
        Current workload = number of active tasks.
        """

        response = (
            self.client
            .table("tasks")
            .select(
                "id",
                count="exact",
            )
            .eq(
                "assigned_to",
                employee_id,
            )
            .in_(
                "status",
                ["open", "in_progress"],
            )
            .execute()
        )

        return response.count or 0

    # ------------------------------------------------------------------
    # Task update
    # ------------------------------------------------------------------

    def _assign_task(
        self,
        task_id: str,
        new_employee_id: str,
    ) -> None:

        (
            self.client
            .table("tasks")
            .update(
                {
                    "assigned_to": new_employee_id,
                }
            )
            .eq(
                "id",
                task_id,
            )
            .execute()
        )

    # ------------------------------------------------------------------
    # Audit trail
    # ------------------------------------------------------------------

    def _create_assignment_record(
        self,
        task_id: str,
        previous_employee_id: str,
        new_employee_id: str,
        reason: str,
    ) -> None:

        (
            self.client
            .table("task_assignments")
            .insert(
                {
                    "task_id": task_id,
                    "previous_employee_id": previous_employee_id,
                    "new_employee_id": new_employee_id,
                    "reason": reason,
                }
            )
            .execute()
        )