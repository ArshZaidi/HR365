"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceTable from "@/components/attendance/AttendanceTable";

import { apiFetch } from "@/lib/api";

import {
  AttendanceRecord,
  AttendanceSummary as AttendanceSummaryType,
} from "@/types/attendance";

export default function AttendancePage() {
  const [summary, setSummary] =
    useState<AttendanceSummaryType | null>(null);

  const [records, setRecords] =
    useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      try {
        const [summaryResponse, recordsResponse] =
          await Promise.all([
            apiFetch<{
              summary: AttendanceSummaryType;
            }>("/api/attendance/me/summary"),

            apiFetch<{
              records: AttendanceRecord[];
            }>("/api/attendance/me"),
          ]);

        setSummary(summaryResponse.summary);
        setRecords(recordsResponse.records || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load attendance."
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
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Employee
            </p>

            <h1 className="mt-2 text-4xl font-medium tracking-[-0.045em]">
              Attendance
            </h1>

            <p className="mt-3 text-sm text-[var(--muted)]">
              Track your attendance and working-day history.
            </p>
          </div>

          {loading ? (
            <AttendanceSkeleton />
          ) : error ? (
            <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-600">
              {error}
            </div>
          ) : summary ? (
            <>
              <div className="mt-10">
                <AttendanceSummary summary={summary} />
              </div>

              <div className="mt-8">
                <AttendanceTable records={records} />
              </div>
            </>
          ) : null}

        </div>
      </PageTransition>
    </AppShell>
  );
}

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--surface-hover)] ${className}`}
    />
  );
}

function AttendanceSkeleton() {
  return (
    <div className="mt-10 space-y-8">

      {/* Summary skeleton */}
      <div className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-[var(--surface)] p-6"
          >
            <SkeletonBlock className="h-3 w-24" />

            <SkeletonBlock className="mt-6 h-9 w-20" />

            <SkeletonBlock className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">

        <div className="border-b border-[var(--border)] px-6 py-5">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="mt-2 h-3 w-48" />
        </div>

        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="grid grid-cols-4 gap-6 border-b border-[var(--border)] px-6 py-5"
            >
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}