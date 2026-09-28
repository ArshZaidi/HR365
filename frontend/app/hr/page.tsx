"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import HRStats from "@/components/hr/HRStats";
import LeaveApproval from "@/components/hr/LeaveApproval";
import RequestManagement from "@/components/hr/RequestManagement";
import HRDashboardSkeleton from "@/components/hr/HRDashboardSkeleton";
import type { Leave } from "@/types/leave";
import type { HRRequest } from "@/types/requests";
import { supabase } from "@/lib/supabase";
import FeedbackAnalytics from "@/components/hr/FeedbackAnalytics";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export default function HRPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication session expired.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [leavesResponse, requestsResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/leaves?status=pending`,
            { headers },
          ),
          fetch(
            `${API_BASE_URL}/api/hr-requests`,
            { headers },
          ),
        ]);

      const leavesData = await leavesResponse.json();
      const requestsData = await requestsResponse.json();

      if (!leavesResponse.ok) {
        throw new Error(
          leavesData?.detail ||
            "Unable to retrieve leave requests.",
        );
      }

      if (!requestsResponse.ok) {
        throw new Error(
          requestsData?.detail ||
            "Unable to retrieve HR requests.",
        );
      }

      setLeaves(leavesData.records || []);
      setRequests(requestsData.requests || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load HR workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const openRequests = requests.filter(
      (request) =>
        request.status === "open" ||
        request.status === "in_progress",
    ).length;

    const escalatedRequests = requests.filter(
      (request) => request.is_escalated,
    ).length;

    const urgentRequests = requests.filter(
      (request) => request.priority === "urgent",
    ).length;

    return {
      pendingLeaves: leaves.length,
      openRequests,
      escalatedRequests,
      urgentRequests,
    };
  }, [leaves, requests]);

  const recentRequests = requests.slice(0, 6);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-76px)] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          {loading ? (
            <HRDashboardSkeleton />
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--accent)]">
                    HR Workspace
                  </p>

                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    People operations, simplified.
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Review employee requests, approve leave, and
                    monitor escalations from one workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadData}
                  className="w-fit rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  Refresh
                </button>
              </div>

              {error && (
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-red-600">
                    {error}
                  </div>

                  <button
                    type="button"
                    onClick={loadData}
                    className="w-fit rounded-xl border border-red-500/20 px-4 py-2 text-sm font-medium text-red-600"
                  >
                    Retry
                  </button>
                </div>
              )}

              <HRStats {...stats} />

              <div className="mt-8">
                <LeaveApproval
                  leaves={leaves}
                  onUpdated={loadData}
                  getToken={getToken}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>

              <div className="mt-8">
                <RequestManagement
                  requests={recentRequests}
                  onUpdated={loadData}
                  getToken={getToken}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>

              <div className="mt-8">
                <FeedbackAnalytics />
            </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}