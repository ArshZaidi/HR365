"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import {
  EyebrowPill,
  PageBody,
  PageHeader,
} from "@/components/ui/premium";

import { apiFetch } from "@/lib/api";

import {
  AttendanceRecord,
  AttendanceSummary as AttendanceSummaryType,
} from "@/types/attendance";

export default function AttendancePage() {
  const [summary, setSummary] =
    useState<AttendanceSummaryType | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      try {
        const [summaryResponse, recordsResponse] = await Promise.all([
          apiFetch<{ summary: AttendanceSummaryType }>(
            "/api/attendance/me/summary",
          ),
          apiFetch<{ records: AttendanceRecord[] }>("/api/attendance/me"),
        ]);

        setSummary(summaryResponse.summary);
        setRecords(recordsResponse.records || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load attendance.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-full">
          <PageHeader
            eyebrow={<EyebrowPill tone={2}>Employee</EyebrowPill>}
            title="Attendance"
            description="Track your attendance and working-day history."
          />

          {loading ? (
            <PageBody>
              <AttendanceSkeleton />
            </PageBody>
          ) : error ? (
            <PageBody>
              <div
                className="
                  rounded-2xl border p-6 text-[14px]
                  border-[var(--glass-border)]
                  bg-[var(--glass-bg)] backdrop-blur-2xl
                  shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
                "
                style={{ color: "var(--danger)" }}
              >
                {error}
              </div>
            </PageBody>
          ) : summary ? (
            <PageBody>
              <AttendanceSummary summary={summary} />

              <AttendanceTable records={records} />
            </PageBody>
          ) : null}
        </main>
      </PageTransition>
    </AppShell>
  );
}

/* ================================================================
   SKELETON
================================================================ */

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-hover)]/60 ${className}`}
    />
  );
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          <CalendarDays key="a" size={17} />,
          <CheckCircle2 key="b" size={17} />,
          <Clock3 key="c" size={17} />,
          <XCircle key="d" size={17} />,
        ].map((icon, i) => (
          <div
            key={i}
            className="
              rounded-2xl border border-[var(--glass-border)]
              bg-[var(--glass-bg)] p-5 backdrop-blur-2xl
            "
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[var(--surface-hover)]/60" />
              <div className="h-3 w-20 rounded bg-[var(--surface-hover)]/60" />
            </div>
            <div className="mt-5 h-9 w-24 rounded-lg bg-[var(--surface-hover)]/60" />
            <div className="mt-3 h-3.5 w-32 rounded bg-[var(--surface-hover)]/60" />
            {icon}
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="
          overflow-hidden rounded-2xl
          border border-[var(--glass-border)]
          bg-[var(--glass-bg)] backdrop-blur-2xl
        "
      >
        <div className="border-b border-[var(--border)] px-6 py-4">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="mt-2 h-3.5 w-56" />
        </div>

        <div>
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="grid grid-cols-4 gap-6 border-b border-[var(--border)] px-6 py-4 last:border-0"
            >
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}