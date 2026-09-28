"use client";

import { useState } from "react";
import type { HRRequest } from "@/types/requests";

interface RequestManagementProps {
  requests: HRRequest[];
  onUpdated: () => void;
  getToken: () => Promise<string | null>;
  apiBaseUrl: string;
}

export default function RequestManagement({
  requests,
  onUpdated,
  getToken,
  apiBaseUrl,
}: RequestManagementProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    requestId: string,
    status: string,
  ) => {
    setLoadingId(requestId);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication session expired.");
      }

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
        throw new Error(
          data?.detail || "Unable to update request.",
        );
      }

      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update request.",
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

      if (!token) {
        throw new Error("Authentication session expired.");
      }

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
        throw new Error(
          data?.detail || "Unable to escalate request.",
        );
      }

      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to escalate request.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="text-sm font-medium text-[var(--foreground)]">
          No HR requests
        </div>

        <div className="mt-1 text-sm text-[var(--muted)]">
          The request queue is currently empty.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)]">
          HR request queue
        </h2>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Review, escalate, and resolve employee requests.
        </p>
      </div>

      {error && (
        <div className="mx-5 mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="divide-y divide-[var(--border)]">
        {requests.map((request) => {
          const isLoading = loadingId === request.id;

          return (
            <div key={request.id} className="p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                      {request.category}
                    </span>

                    <span className="rounded-full bg-[var(--surface-hover)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--foreground)]">
                      {request.priority}
                    </span>

                    {request.is_escalated && (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600">
                        Escalated
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-medium text-[var(--foreground)]">
                    {request.subject}
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                    {request.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span>
                      Employee: {request.employee_id}
                    </span>

                    <span>
                      Status: {request.status}
                    </span>

                    {request.assigned_to && (
                      <span>
                        Assigned: {request.assigned_to}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-start gap-2 xl:max-w-xs xl:justify-end">
                  {request.status === "open" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "in_progress",
                        )
                      }
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}

                  {request.status === "in_progress" && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "resolved",
                        )
                      }
                      className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}

                  {!request.is_escalated &&
                    request.status !== "closed" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                          escalate(request.id)
                        }
                        className="rounded-xl border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-500/5 disabled:opacity-50"
                      >
                        Escalate
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}