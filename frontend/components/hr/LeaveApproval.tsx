"use client";

import { useState } from "react";
import type { Leave } from "@/types/leave";
import TaskReassignment from "./TaskReassignment";

interface LeaveApprovalProps {
  leaves: Leave[];
  onUpdated: () => void;
  getToken: () => Promise<string | null>;
  apiBaseUrl: string;
}

export default function LeaveApproval({
  leaves,
  onUpdated,
  getToken,
  apiBaseUrl,
}: LeaveApprovalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const updateLeave = async (
    leaveId: string,
    status: "approved" | "rejected",
  ) => {
    setLoadingId(leaveId);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication session expired.");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/leaves/${leaveId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update leave request.",
        );
      }

      setResult((current) => ({
        ...current,
        [leaveId]: data,
      }));

      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update leave request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  if (leaves.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="text-sm font-medium text-[var(--foreground)]">
          No pending leave requests
        </div>

        <div className="mt-1 text-sm text-[var(--muted)]">
          Everything is caught up.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)]">
          Leave approvals
        </h2>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Review pending employee leave requests.
        </p>
      </div>

      {error && (
        <div className="mx-5 mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="divide-y divide-[var(--border)]">
        {leaves.map((leave) => {
          const isLoading = loadingId === leave.id;
          const response = result[leave.id];

          return (
            <div key={leave.id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-hover)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--foreground)]">
                      {leave.leave_type}
                    </span>

                    <span className="text-xs text-[var(--muted)]">
                      {new Date(leave.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-[var(--foreground)]">
                    Employee
                  </div>

                  <div className="mt-1 font-medium text-[var(--foreground)]">
                    {leave.employee_id}
                  </div>

                  <div className="mt-3 text-sm text-[var(--muted)]">
                    {leave.start_date} → {leave.end_date}
                  </div>

                  {leave.reason && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      {leave.reason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateLeave(leave.id, "rejected")
                    }
                    className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      updateLeave(leave.id, "approved")
                    }
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Updating..." : "Approve"}
                  </button>
                </div>
              </div>

              {response?.task_reassignment && (
                <TaskReassignment
                  data={response.task_reassignment}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}