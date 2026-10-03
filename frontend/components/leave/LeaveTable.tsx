"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2, X } from "lucide-react";

import { Leave } from "@/types/leave";
import { GlassPanel, StatusBadge } from "@/components/ui/premium";

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  const s = status.toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  if (s === "pending") return "warning";
  return "neutral";
}

function getTypeTone(leaveType: string): string {
  const t = leaveType.toLowerCase();
  if (t === "sick") return "var(--accent-6)";
  if (t === "casual") return "var(--accent-3)";
  if (t === "earned") return "var(--accent-4)";
  if (t === "unpaid") return "var(--accent-5)";
  return "var(--accent-2)";
}

function getTypeSoft(leaveType: string): string {
  const t = leaveType.toLowerCase();
  if (t === "sick") return "var(--accent-6-soft)";
  if (t === "casual") return "var(--accent-3-soft)";
  if (t === "earned") return "var(--accent-4-soft)";
  if (t === "unpaid") return "var(--accent-5-soft)";
  return "var(--accent-2-soft)";
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* FEATURE ADDITION: only these two statuses are cancellable by the employee */
function isCancellable(status: string) {
  const s = status.toLowerCase();
  return s === "pending" || s === "approved";
}

export default function LeaveTable({
  leaves,
  onCancel,
}: {
  leaves: Leave[];
  onCancel?: (leaveId: string) => Promise<void>;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (leaveId: string) => {
    if (!onCancel) return;

    setBusyId(leaveId);
    setError(null);

    try {
      await onCancel(leaveId);
      setConfirmId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel leave.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <GlassPanel
      tone={4}
      title="Leave history"
      subtitle="Your submitted leave requests"
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

      {!leaves.length ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-4-soft)] text-[var(--accent-4)]">
            <CalendarDays size={20} />
          </div>

          <p className="font-display mt-4 text-[18px] font-medium tracking-[-0.015em]">
            No leave requests yet
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">
            Submit a leave request using the form. Your history will appear
            here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]/30">
                <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Type
                </th>
                <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Period
                </th>
                <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Reason
                </th>
                <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Status
                </th>
                {onCancel && (
                  <th className="px-6 py-3.5 text-right text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave) => {
                const cancellable = isCancellable(leave.status);
                const isConfirming = confirmId === leave.id;
                const isBusy = busyId === leave.id;

                return (
                  <tr
                    key={leave.id}
                    className="
                      group border-b border-[var(--border)] last:border-0
                      transition-colors duration-200 ease-[var(--ease-out-soft)]
                      hover:bg-[var(--surface-hover)]/40
                    "
                  >
                    <td className="px-6 py-4">
                      <span
                        className="
                          inline-flex items-center gap-2 rounded-full
                          px-3 py-1 text-[12px] font-semibold capitalize
                        "
                        style={{
                          background: getTypeSoft(leave.leave_type),
                          color: getTypeTone(leave.leave_type),
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: "currentColor" }}
                        />
                        {leave.leave_type}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[13.5px] tabular-nums">
                        <span className="font-medium">
                          {formatDate(leave.start_date)}
                        </span>
                        <span className="text-[var(--muted)]">→</span>
                        <span className="font-medium">
                          {formatDate(leave.end_date)}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-xs px-6 py-4 text-[13.5px] text-[var(--muted)]">
                      <span className="line-clamp-1">
                        {leave.reason || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge variant={getStatusVariant(leave.status)}>
                        {leave.status}
                      </StatusBadge>
                    </td>

                    {onCancel && (
                      <td className="px-6 py-4 text-right">
                        {!cancellable ? (
                          <span className="text-[12px] text-[var(--muted)]">
                            —
                          </span>
                        ) : !isConfirming ? (
                          <button
                            type="button"
                            onClick={() => setConfirmId(leave.id)}
                            className="
                              inline-flex h-8 items-center gap-1.5 rounded-lg
                              border px-2.5 text-[12px] font-medium
                              transition-all duration-200
                              hover:-translate-y-0.5
                            "
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--muted)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--danger)";
                              e.currentTarget.style.color = "var(--danger)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--border)";
                              e.currentTarget.style.color = "var(--muted)";
                            }}
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleConfirm(leave.id)}
                              className="
                                inline-flex h-8 items-center gap-1 rounded-lg
                                px-2.5 text-[12px] font-semibold text-white
                                transition-all duration-200
                                hover:-translate-y-0.5
                                disabled:cursor-not-allowed disabled:opacity-50
                              "
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                              }}
                            >
                              {isBusy ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              {isBusy ? "Cancelling…" : "Confirm"}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmId(null)}
                              className="
                                inline-flex h-8 items-center rounded-lg
                                border border-[var(--border)] px-2.5
                                text-[12px] font-medium text-[var(--muted)]
                                transition-colors duration-200
                                hover:bg-[var(--surface-hover)]
                                disabled:opacity-50
                              "
                            >
                              No
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassPanel>
  );
}