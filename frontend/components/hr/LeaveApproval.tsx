"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import type { Leave } from "@/types/leave";
import { GlassPanel, StatusBadge } from "@/components/ui/premium";

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
        throw new Error(data?.detail || "Unable to update leave request.");
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
      <GlassPanel tone={4} padded={false}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-4-soft)] text-[var(--accent-4)]">
            <Check size={20} />
          </div>

          <p className="font-display mt-4 text-[18px] font-medium tracking-[-0.015em]">
            No pending leave requests
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">
            Everything is caught up. New requests will appear here as they
            arrive.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      tone={4}
      title="Leave approvals"
      subtitle="Review pending employee leave requests"
      padded={false}
    >
      {error && (
        <div
          className="mx-5 mt-5 rounded-xl border p-3 text-[13px]"
          style={{
            borderColor: "var(--danger)",
            background: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="divide-y divide-[var(--border)]">
        {leaves.map((leave) => {
          const isLoading = loadingId === leave.id;
          const response = result[leave.id];

          return (
            <div key={leave.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold capitalize"
                      style={{
                        background: "var(--accent-4-soft)",
                        color: "var(--accent-4)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "currentColor" }}
                      />
                      {leave.leave_type}
                    </span>

                    <StatusBadge variant="warning">Pending</StatusBadge>

                    <span className="text-[12px] text-[var(--muted)] tabular-nums">
                      {new Date(leave.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-4), var(--accent-3))",
                      }}
                    >
                      {leave.employee_id?.slice(0, 2).toUpperCase() || "EM"}
                    </span>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
                        Employee
                      </p>
                      <p className="mt-0.5 truncate text-[13.5px] font-medium">
                        {leave.employee_id}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 text-[13.5px] tabular-nums">
                    <span className="font-medium">
                      {leave.start_date}
                    </span>
                    <span className="text-[var(--muted)]">→</span>
                    <span className="font-medium">{leave.end_date}</span>
                  </div>

                  {leave.reason && (
                    <p className="mt-3 max-w-2xl text-[13.5px] leading-6 text-[var(--muted)]">
                      {leave.reason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => updateLeave(leave.id, "rejected")}
                    className="
                      inline-flex h-10 items-center gap-2 rounded-xl px-4
                      border border-[var(--border)]
                      bg-[var(--surface)]/50 backdrop-blur-xl
                      text-[13px] font-medium
                      transition-all duration-300 ease-[var(--ease-out-soft)]
                      hover:-translate-y-0.5 hover:border-[var(--border-strong)]
                      hover:shadow-[var(--shadow-sm)]
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <X size={14} />
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => updateLeave(leave.id, "approved")}
                    className="
                      inline-flex h-10 items-center gap-2 rounded-xl px-4
                      text-[13px] font-medium text-white
                      transition-all duration-300 ease-[var(--ease-out-soft)]
                      hover:-translate-y-0.5
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent-4), var(--accent-3))",
                      boxShadow:
                        "0 12px 28px -10px rgba(47,158,107,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {isLoading ? "Updating…" : "Approve"}
                  </button>
                </div>
              </div>

              {response?.task_reassignment && (
                <TaskReassignment data={response.task_reassignment} />
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}