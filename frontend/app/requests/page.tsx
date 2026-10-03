"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import RequestTable from "@/components/requests/RequestTable";
import RequestForm from "@/components/requests/RequestForm";
import {
  EyebrowPill,
  PageBody,
  PageHeader,
} from "@/components/ui/premium";

import { apiFetch } from "@/lib/api";
import { HRRequest, HRRequestsResponse } from "@/types/requests";

export default function RequestsPage() {
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch<HRRequestsResponse>(
        "/api/hr-requests/me",
      );

      setRequests(response.requests || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load HR requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ─── FEATURE ADDITION: cancel an HR request ─── */
  async function cancelRequest(requestId: string) {
    await apiFetch(`/api/hr-requests/${requestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });

    await loadRequests();
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-full">
          <PageHeader
            eyebrow={<EyebrowPill tone={5}>Employee</EyebrowPill>}
            title="HR Requests"
            description="Submit and track requests with your HR team."
          />

          <PageBody>
            {loading ? (
              <RequestSkeleton />
            ) : error ? (
              <div
                className="
                  rounded-2xl border p-5 text-[14px]
                  border-[var(--glass-border)]
                  bg-[var(--glass-bg)] backdrop-blur-2xl
                  shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
                "
                style={{ color: "var(--danger)" }}
              >
                {error}
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
                <RequestTable
                  requests={requests}
                  onCancel={cancelRequest}
                />

                <RequestForm onCreated={loadRequests} />
              </div>
            )}
          </PageBody>
        </main>
      </PageTransition>
    </AppShell>
  );
}

/* Skeleton — same as previous batch */
function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-hover)]/60 ${className}`}
    />
  );
}

function RequestSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="
              rounded-2xl border border-[var(--glass-border)]
              bg-[var(--glass-bg)] p-5 backdrop-blur-2xl
            "
          >
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <Block className="h-6 w-24 rounded-full" />
                <Block className="h-4 w-2/3" />
                <Block className="h-3 w-full" />
                <Block className="h-3 w-40" />
              </div>
              <Block className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      <div
        className="
          rounded-2xl border border-[var(--glass-border)]
          bg-[var(--glass-bg)] p-6 backdrop-blur-2xl
        "
      >
        <Block className="h-5 w-40" />
        <Block className="mt-2 h-3.5 w-52" />

        <div className="mt-6 space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Block className="mb-2 h-3 w-24" />
              <Block className="h-11 w-full rounded-xl" />
            </div>
          ))}

          <Block className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}