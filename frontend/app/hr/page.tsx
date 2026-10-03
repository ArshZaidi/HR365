"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import HRStats from "@/components/hr/HRStats";
import LeaveApproval from "@/components/hr/LeaveApproval";
import RequestManagement from "@/components/hr/RequestManagement";
import HRDashboardSkeleton from "@/components/hr/HRDashboardSkeleton";
import FeedbackAnalytics from "@/components/hr/FeedbackAnalytics";
import NoticeManager from "@/components/hr/NoticeManager";
import {
  EyebrowPill,
  GlassButton,
  PageBody,
  PageHeader,
} from "@/components/ui/premium";

import type { Leave } from "@/types/leave";
import type { HRRequest } from "@/types/requests";
import { supabase } from "@/lib/supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function priorityRank(p?: string) {
  return PRIORITY_RANK[(p || "normal").toLowerCase()] ?? 0;
}

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

      const [leavesResponse, requestsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/leaves?status=pending`, { headers }),
        fetch(`${API_BASE_URL}/api/hr-requests`, { headers }),
      ]);

      const leavesData = await leavesResponse.json();
      const requestsData = await requestsResponse.json();

      if (!leavesResponse.ok) {
        throw new Error(
          leavesData?.detail || "Unable to retrieve leave requests.",
        );
      }

      if (!requestsResponse.ok) {
        throw new Error(
          requestsData?.detail || "Unable to retrieve HR requests.",
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
        request.status === "open" || request.status === "in_progress",
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

  /**
   * Urgent-first, then high/normal/low.
   * Within a priority tier, unresolved before resolved,
   * then newest first.
   */
  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => {
        const pa = priorityRank(a.priority);
        const pb = priorityRank(b.priority);
        if (pa !== pb) return pb - pa;

        const aResolved =
          a.status === "resolved" || a.status === "closed";
        const bResolved =
          b.status === "resolved" || b.status === "closed";
        if (aResolved !== bResolved) return aResolved ? 1 : -1;

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      })
      .slice(0, 12);
  }, [requests]);

  return (
    <AppShell>
      <main className="min-h-full">
        <PageHeader
          eyebrow={<EyebrowPill tone={6}>HR Workspace</EyebrowPill>}
          title="People operations, simplified."
          description="Review employee requests, approve leave, monitor escalations, and publish company notices from one workspace."
          actions={
            <GlassButton onClick={loadData}>
              <RefreshCw size={15} />
              Refresh
            </GlassButton>
          }
        />

        {loading ? (
          <PageBody>
            <HRDashboardSkeleton />
          </PageBody>
        ) : (
          <PageBody>
            {error && (
              <div
                className="
                  flex flex-col gap-3 rounded-2xl border p-5
                  border-[var(--glass-border)]
                  bg-[var(--glass-bg)] backdrop-blur-2xl
                  shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
                  sm:flex-row sm:items-center sm:justify-between
                "
              >
                <p
                  className="text-[14px] font-medium"
                  style={{ color: "var(--danger)" }}
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadData}
                  className="
                    w-fit rounded-xl border px-4 py-2 text-[13px] font-medium
                    transition-colors duration-200 ease-[var(--ease-out-soft)]
                  "
                  style={{
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <HRStats {...stats} />

            <LeaveApproval
              leaves={leaves}
              onUpdated={loadData}
              getToken={getToken}
              apiBaseUrl={API_BASE_URL}
            />

            <RequestManagement
              requests={recentRequests}
              onUpdated={loadData}
              getToken={getToken}
              apiBaseUrl={API_BASE_URL}
            />

            <NoticeManager />

            <FeedbackAnalytics
              fallbackStats={{
                total: requests.length,
                resolved: requests.filter(
                  (r) => r.status === "resolved" || r.status === "closed",
                ).length,
                escalated: requests.filter((r) => r.is_escalated).length,
                open: requests.filter(
                  (r) => r.status === "open" || r.status === "in_progress",
                ).length,
              }}
            />
          </PageBody>
        )}
      </main>
    </AppShell>
  );
}