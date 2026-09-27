"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import RequestTable from "@/components/requests/RequestTable";
import RequestForm from "@/components/requests/RequestForm";
import { apiFetch } from "@/lib/api";
import {
  HRRequest,
  HRRequestsResponse,
} from "@/types/requests";

export default function RequestsPage() {
  const [requests, setRequests] =
    useState<HRRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiFetch<HRRequestsResponse>(
          "/api/hr-requests/me"
        );

      setRequests(response.requests || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load HR requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Employee
          </p>

          <h1 className="mt-2 text-4xl font-medium tracking-[-0.045em]">
            HR Requests
          </h1>

          <p className="mt-3 text-sm text-[var(--muted)]">
            Submit and track requests with your HR team.
          </p>

          {loading ? (
            <div className="mt-10 text-sm text-[var(--muted)]">
              Loading requests...
            </div>
          ) : error ? (
            <div className="mt-10 rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="mt-10 grid gap-8 xl:grid-cols-[1.5fr_0.7fr]">
              <RequestTable requests={requests} />

              <RequestForm
                onCreated={loadRequests}
              />
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}