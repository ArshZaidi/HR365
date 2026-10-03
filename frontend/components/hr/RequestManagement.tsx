"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CircleDashed,
  Flame,
  Loader2,
  MessageSquareText,
  Play,
} from "lucide-react";

import type { HRRequest } from "@/types/requests";
import { GlassPanel, StatusBadge } from "@/components/ui/premium";
import RequestComments from "./RequestComments";

interface RequestManagementProps {
  requests: HRRequest[];
  onUpdated: () => void;
  getToken: () => Promise<string | null>;
  apiBaseUrl: string;
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (s === "resolved" || s === "closed") return "success";
  if (s === "rejected") return "danger";
  if (s === "in_progress" || s === "in progress") return "info";
  if (s === "open") return "warning";
  return "neutral";
}

function getPriorityStyle(priority?: string) {
  const p = (priority || "").toLowerCase();
  if (p === "urgent")
    return { bg: "var(--danger-soft)", fg: "var(--danger)" };
  if (p === "high")
    return { bg: "var(--warning-soft)", fg: "var(--warning)" };
  if (p === "low")
    return { bg: "var(--surface-hover)", fg: "var(--muted)" };
  return { bg: "var(--accent-3-soft)", fg: "var(--accent-3)" };
}

export default function RequestManagement({
  requests,
  onUpdated,
  getToken,
  apiBaseUrl,
}: RequestManagementProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const updateStatus = async (requestId: string, status: string) => {
    setLoadingId(requestId);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication session expired.");

      const response = await fetch(
        `${apiBaseUrl}/api/hr-requests/${requestId}/status`,
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
        throw new Error(data?.detail || "Unable to update request.");
      }

      onUpdated();

      /* Auto-open comments when HR starts working on a ticket */
      if (status === "in_progress") {
        setOpenComments(requestId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const escalate = async (requestId: string) => {
    setLoadingId(requestId);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication session expired.");

      const response = await fetch(
        `${apiBaseUrl}/api/hr-requests/${requestId}/escalate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Escalated from HR workspace for further review.",
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to escalate request.");
      }

      onUpdated();
      setOpenComments(requestId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to escalate request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <GlassPanel tone={2} padded={false}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-2-soft)] text-[var(--accent-2)]">
            <CircleDashed size={20} />
          </div>

          <p className="font-display mt-4 text-[18px] font-medium tracking-[-0.015em]">
            Request queue is empty
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">
            New employee requests will appear here as they come in.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      tone={2}
      title="HR request queue"
      subtitle="Urgent and high-priority requests appear first"
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
        {requests.map((request) => {
          const isLoading = loadingId === request.id;
          const priority = getPriorityStyle(request.priority);
          const isCommentOpen = openComments === request.id;

          return (
            <div key={request.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={getStatusVariant(request.status)}>
                      {request.status.replace("_", " ")}
                    </StatusBadge>

                    {request.priority && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize"
                        style={{
                          background: priority.bg,
                          color: priority.fg,
                        }}
                      >
                        <span
                          className="h-1 w-1 rounded-full"
                          style={{ background: "currentColor" }}
                        />
                        {request.priority}
                      </span>
                    )}

                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize"
                      style={{
                        background: "var(--surface-hover)",
                        color: "var(--muted)",
                      }}
                    >
                      {request.category}
                    </span>

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

                  <h3 className="mt-3.5 text-[15.5px] font-medium tracking-[-0.005em]">
                    {request.subject}
                  </h3>

                  <p className="mt-2 max-w-3xl text-[13.5px] leading-6 text-[var(--muted)]">
                    {request.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]">
                    <span>
                      Employee:{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {request.employee_id}
                      </span>
                    </span>

                    {request.assigned_to && (
                      <span>
                        Assigned:{" "}
                        <span className="font-medium text-[var(--foreground)]">
                          {request.assigned_to}
                        </span>
                      </span>
                    )}

                    <span className="tabular-nums">
                      {new Date(request.created_at).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-start gap-2 xl:max-w-xs xl:justify-end">
                  {request.status === "open" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateStatus(request.id, "in_progress")}
                      className="
                        inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                        border border-[var(--border)]
                        bg-[var(--surface)]/50 backdrop-blur-xl
                        text-[12.5px] font-medium
                        transition-all duration-300 ease-[var(--ease-out-soft)]
                        hover:-translate-y-0.5 hover:border-[var(--border-strong)]
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      {isLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Play size={13} />
                      )}
                      Start
                    </button>
                  )}

                  {request.status === "in_progress" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => updateStatus(request.id, "resolved")}
                      className="
                        inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                        text-[12.5px] font-medium text-white
                        transition-all duration-300 ease-[var(--ease-out-soft)]
                        hover:-translate-y-0.5
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                        boxShadow:
                          "0 10px 24px -10px rgba(124,108,240,0.5)",
                      }}
                    >
                      {isLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ArrowUpRight size={13} />
                      )}
                      Resolve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setOpenComments((current) =>
                        current === request.id ? null : request.id,
                      )
                    }
                    className="
                      inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                      text-[12.5px] font-medium
                      transition-all duration-300 ease-[var(--ease-out-soft)]
                      hover:-translate-y-0.5
                    "
                    style={{
                      border: `1px solid ${
                        isCommentOpen
                          ? "var(--accent-2)"
                          : "var(--border)"
                      }`,
                      color: isCommentOpen
                        ? "var(--accent-2)"
                        : "var(--muted)",
                      background: isCommentOpen
                        ? "var(--accent-2-soft)"
                        : "transparent",
                    }}
                  >
                    <MessageSquareText size={13} />
                    Comment
                  </button>

                  {!request.is_escalated &&
                    request.status !== "closed" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => escalate(request.id)}
                        className="
                          inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                          text-[12.5px] font-medium
                          transition-all duration-300 ease-[var(--ease-out-soft)]
                          hover:-translate-y-0.5
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                        style={{
                          border: "1px solid var(--danger)",
                          color: "var(--danger)",
                        }}
                      >
                        <Flame size={13} />
                        Escalate
                      </button>
                    )}
                </div>
              </div>

              {isCommentOpen && (
                <RequestComments
                  requestId={request.id}
                  getToken={getToken}
                  apiBaseUrl={apiBaseUrl}
                />
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}