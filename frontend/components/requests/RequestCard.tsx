"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  FileText,
  Flame,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";

import { HRRequest } from "@/types/requests";
import { StatusBadge } from "@/components/ui/premium";
import RequestComments from "./RequestComments";

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (s === "resolved" || s === "closed") return "success";
  if (s === "rejected") return "danger";
  if (s === "in_progress" || s === "in progress") return "info";
  if (s === "open" || s === "pending") return "warning";
  return "neutral";
}

function getPriorityTone(priority?: string) {
  const p = (priority || "").toLowerCase();
  if (p === "urgent")
    return { bg: "var(--danger-soft)", fg: "var(--danger)" };
  if (p === "high")
    return { bg: "var(--warning-soft)", fg: "var(--warning)" };
  if (p === "low")
    return { bg: "var(--surface-hover)", fg: "var(--muted)" };
  return { bg: "var(--accent-3-soft)", fg: "var(--accent-3)" };
}

/* Employee can only cancel requests still in "open" */
function isCancellable(status: string) {
  return status.toLowerCase() === "open";
}

export default function RequestCard({
  request,
  onCancel,
}: {
  request: HRRequest;
  onCancel?: (requestId: string) => Promise<void>;
}) {
  const priorityStyle = getPriorityTone(request.priority);

  /* Cancel state */
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Comments state */
  const [showComments, setShowComments] = useState(false);

  const handleConfirm = async () => {
    if (!onCancel) return;

    setBusy(true);
    setError(null);

    try {
      await onCancel(request.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel request.",
      );
      setBusy(false);
    }
  };

  const cancellable = isCancellable(request.status);

  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
        p-5
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-xs)]
        transition-all duration-300 ease-[var(--ease-out-soft)]
        hover:border-[var(--border-strong)]
        hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
      "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-[0.12] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.22]"
        style={{ background: "var(--accent-5)" }}
      />

      <div className="relative flex items-start gap-4">
        <span
          className="
            mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl text-white
            transition-transform duration-300 ease-[var(--ease-out-soft)]
            group-hover:scale-[1.06]
          "
          style={{
            background:
              "linear-gradient(135deg, var(--accent-5), color-mix(in oklab, var(--accent-5) 55%, black))",
            boxShadow:
              "0 8px 20px -8px rgba(23,22,20,0.28), inset 0 1px 0 rgba(255,255,255,0.28)",
          }}
        >
          <FileText size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={getStatusVariant(request.status)}>
              {request.status.replace("_", " ")}
            </StatusBadge>

            {request.priority && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize"
                style={{
                  background: priorityStyle.bg,
                  color: priorityStyle.fg,
                }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: "currentColor" }}
                />
                {request.priority}
              </span>
            )}

            {request.is_escalated && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                style={{
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                }}
              >
                <Flame size={10} />
                Escalated
              </span>
            )}
          </div>

          <h3 className="mt-3.5 text-[15px] font-medium tracking-[-0.005em]">
            {request.subject}
          </h3>

          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[var(--muted)]">
            {request.description}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--muted)]">
            <span className="capitalize">{request.category}</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="tabular-nums">
              {new Date(request.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

            {/* Cancel actions */}
            {onCancel && cancellable && (
              <>
                <span className="text-[var(--border-strong)]">·</span>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="
                      inline-flex items-center gap-1 font-medium
                      transition-colors duration-200
                    "
                    style={{ color: "var(--danger)" }}
                  >
                    <X size={11} />
                    Cancel request
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleConfirm}
                      className="
                        inline-flex items-center gap-1 rounded-md px-2 py-0.5
                        text-[11px] font-semibold text-white
                        transition-opacity duration-200
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                      }}
                    >
                      {busy ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      {busy ? "Cancelling…" : "Confirm"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirming(false)}
                      className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </span>
                )}
              </>
            )}

            {error && (
              <span className="text-[11px]" style={{ color: "var(--danger)" }}>
                {error}
              </span>
            )}
          </div>

          {/* Comments toggle + thread */}
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="
              mt-3.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1
              text-[11.5px] font-medium
              transition-colors duration-200 ease-[var(--ease-out-soft)]
            "
            style={{
              color: showComments ? "var(--accent-2)" : "var(--muted)",
              background: showComments
                ? "var(--accent-2-soft)"
                : "transparent",
            }}
          >
            <MessageSquareText size={12} />
            {showComments ? "Hide conversation" : "View conversation"}
          </button>

          {showComments && <RequestComments requestId={request.id} />}
        </div>

        <ArrowUpRight
          size={16}
          className="mt-1 shrink-0 text-[var(--muted)] transition-all duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent-5)]"
        />
      </div>
    </div>
  );
}