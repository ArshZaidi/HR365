"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";

import LeaveSummary from "@/components/leave/LeaveSummary";
import LeaveTable from "@/components/leave/LeaveTable";
import LeaveForm from "@/components/leave/LeaveForm";
import LeaveSkeleton from "@/components/leave/LeaveSkeleton";
import {
  EyebrowPill,
  PageBody,
  PageHeader,
} from "@/components/ui/premium";

import { apiFetch } from "@/lib/api";
import { Leave, LeaveSummary as LeaveSummaryType } from "@/types/leave";

export default function LeavePage() {
  const [summary, setSummary] = useState<LeaveSummaryType | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeaves() {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, leavesResponse] = await Promise.all([
        apiFetch<{ summary: LeaveSummaryType }>("/api/leaves/me/summary"),
        apiFetch<{ records: Leave[] }>("/api/leaves/me"),
      ]);

      setSummary(summaryResponse.summary);
      setLeaves(leavesResponse.records || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load leave data.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ─── FEATURE ADDITION: cancel a leave request ─── */
  async function cancelLeave(leaveId: string) {
    await apiFetch(`/api/leaves/${leaveId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });

    await loadLeaves();
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-full">
          <PageHeader
            eyebrow={<EyebrowPill tone={4}>Employee</EyebrowPill>}
            title="Leave"
            description="Manage your leave requests and view their status."
          />

          {loading ? (
            <PageBody>
              <LeaveSkeleton />
            </PageBody>
          ) : error ? (
            <PageBody>
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
            </PageBody>
          ) : (
            <PageBody>
              {summary && <LeaveSummary summary={summary} />}

              <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
                <LeaveTable leaves={leaves} onCancel={cancelLeave} />
                <LeaveForm onCreated={loadLeaves} />
              </div>
            </PageBody>
          )}
        </main>
      </PageTransition>
    </AppShell>
  );
}