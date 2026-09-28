"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import Magnetic from "@/components/ui/Magnetic";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { apiFetch } from "@/lib/api";
import { getGreeting } from "@/lib/greeting";
import { useProfile } from "@/hooks/useProfile";

interface DashboardData {
  attendance: number;
  approvedLeaveDays: number;
  openRequests: number;
  totalRequests: number;
  pendingRequests: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

interface HRRequest {
  id: string;
  subject: string;
  status: string;
  priority?: string;
  category?: string;
  created_at: string;
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();

  const [data, setData] = useState<DashboardData | null>(null);
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceResponse,
        leaveResponse,
        requestsResponse,
      ] = await Promise.all([
        apiFetch<{
          summary: {
            attendance_percentage: number;
          };
        }>("/api/attendance/me/summary"),

        apiFetch<{
          summary: {
            approved_leave_days: number;
          };
        }>("/api/leaves/me/summary"),

        apiFetch<{
          requests: HRRequest[];
        }>("/api/hr-requests/me"),
      ]);

      const requestRecords = requestsResponse.requests || [];

      /*
       * HR365 request statuses:
       * open → in_progress → resolved → closed
       *
       * "Pending requests" is represented by requests
       * currently in the open state.
       */
      const openRequests = requestRecords.filter(
        (request) =>
          request.status === "open" ||
          request.status === "in_progress",
      );

      const pendingRequests = requestRecords.filter(
        (request) => request.status === "open",
      );

      setData({
        attendance:
          attendanceResponse.summary?.attendance_percentage ?? 0,

        approvedLeaveDays:
          leaveResponse.summary?.approved_leave_days ?? 0,

        openRequests: openRequests.length,

        totalRequests: requestRecords.length,

        pendingRequests: pendingRequests.length,
      });

      setRequests(requestRecords);
    } catch (err) {
      console.error("Unable to load dashboard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const activities = useMemo<Activity[]>(() => {
    return requests
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      )
      .slice(0, 4)
      .map((request) => ({
        id: request.id,
        title: request.subject || "HR request",
        description: [
          request.category
            ? formatLabel(request.category)
            : "HR request",
          formatLabel(request.status),
        ].join(" · "),
        time: formatRelativeDate(request.created_at),
        status: request.status,
      }));
  }, [requests]);

  const recentRequests = useMemo(() => {
    return requests
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      )
      .slice(0, 5);
  }, [requests]);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] || "there";

  const isLoading = loading || profileLoading;

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-screen">
          <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
            {isLoading ? (
              <DashboardSkeleton />
            ) : error ? (
              <DashboardError
                message={error}
                onRetry={loadDashboard}
              />
            ) : (
              <>
                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                      {today}
                    </p>

                    <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">
                      {getGreeting()}, {firstName}.
                    </h1>

                    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
                      Here&apos;s a quick look at your HR
                      workspace and the things that may
                      need your attention.
                    </p>

                    {profile?.designation && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {profile.designation}
                        {profile.department
                          ? ` · ${profile.department}`
                          : ""}
                      </p>
                    )}
                  </div>

                  <Magnetic strength={0.12}>
                    <Link
                      href="/assistant"
                      className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-85"
                    >
                      <Sparkles size={15} />
                      Ask HR365
                      <ArrowUpRight size={15} />
                    </Link>
                  </Magnetic>
                </section>

                {/* =================================================
                    STATS
                ================================================= */}

                <section className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    icon={<CalendarDays size={18} />}
                    label="Attendance"
                    value={`${formatNumber(
                      data?.attendance ?? 0,
                    )}%`}
                    description="Current attendance"
                  />

                  <Stat
                    icon={<Clock3 size={18} />}
                    label="Approved leave"
                    value={`${data?.approvedLeaveDays ?? 0} days`}
                    description="Approved leave used"
                  />

                  <Stat
                    icon={<FileText size={18} />}
                    label="Open requests"
                    value={String(data?.openRequests ?? 0)}
                    description={
                      data?.pendingRequests
                        ? `${data.pendingRequests} pending review`
                        : "Nothing pending"
                    }
                  />

                  <Stat
                    icon={<CheckCircle2 size={18} />}
                    label="HR activity"
                    value={String(data?.totalRequests ?? 0)}
                    description="Total requests"
                  />
                </section>

                {/* =================================================
                    AI + ACTIVITY
                ================================================= */}

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                  {/* AI */}

                  <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 lg:p-10">
                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl" />

                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
                        <Bot size={20} />
                      </div>

                      <p className="mt-8 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                        HR365 Intelligence
                      </p>

                      <h2 className="mt-3 max-w-xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                        Your HR questions,
                        <br />
                        answered instantly.
                      </h2>

                      <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">
                        Ask about policies, leave,
                        attendance, benefits, or your
                        personal HR information.
                      </p>

                      <Magnetic strength={0.1}>
                        <Link
                          href="/assistant"
                          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium transition hover:border-[var(--foreground)]"
                        >
                          Open AI Assistant
                          <ArrowUpRight size={15} />
                        </Link>
                      </Magnetic>
                    </div>
                  </div>

                  {/* Activity */}

                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          Recent activity
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Your latest HR requests
                        </p>
                      </div>

                      <Link
                        href="/requests"
                        className="text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="mt-7">
                      {activities.length > 0 ? (
                        <div className="space-y-6">
                          {activities.map((activity) => (
                            <Activity
                              key={activity.id}
                              {...activity}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyActivity />
                      )}
                    </div>
                  </div>
                </section>

                {/* =================================================
                    REQUEST OVERVIEW
                ================================================= */}

                <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-7 py-6">
                    <div>
                      <p className="text-sm font-medium">
                        Request overview
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Your most recent HR requests
                      </p>
                    </div>

                    <Link
                      href="/requests"
                      className="inline-flex items-center gap-1 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    >
                      All requests
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>

                  {recentRequests.length > 0 ? (
                    <div className="divide-y divide-[var(--border)]">
                      {recentRequests.map((request) => (
                        <RequestRow
                          key={request.id}
                          request={request}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-7 py-14 text-center">
                      <MessageSquareText
                        size={20}
                        className="mx-auto text-[var(--muted)]"
                      />

                      <p className="mt-3 text-sm font-medium">
                        No HR requests yet
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Your submitted requests will appear
                        here.
                      </p>
                    </div>
                  )}
                </section>

                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <section className="mt-8">
                  <div className="mb-4">
                    <p className="text-sm font-medium">
                      Quick actions
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Frequently used HR actions
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <QuickAction
                      icon={<Bot size={18} />}
                      title="Ask HR365"
                      description="Ask an HR question"
                      href="/assistant"
                    />

                    <QuickAction
                      icon={<CalendarDays size={18} />}
                      title="Apply for leave"
                      description="Submit a new request"
                      href="/leave"
                    />

                    <QuickAction
                      icon={<FileText size={18} />}
                      title="HR requests"
                      description="Track your requests"
                      href="/requests"
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </PageTransition>
    </AppShell>
  );
}

/* ================================================================
   STAT
================================================================ */

function Stat({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--surface-hover)]">
      <div className="flex items-center gap-3 text-[var(--muted)]">
        {icon}

        <span className="text-xs font-medium uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-7 text-3xl font-medium tracking-[-0.04em]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}

/* ================================================================
   ACTIVITY
================================================================ */

function Activity({
  title,
  description,
  time,
  status,
}: Activity) {
  const completed =
    status === "resolved" ||
    status === "closed";

  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          completed
            ? "bg-emerald-500"
            : "bg-[var(--accent)]",
        ].join(" ")}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          {description}
        </p>
      </div>

      <span className="shrink-0 text-[10px] text-[var(--muted)]">
        {time}
      </span>
    </div>
  );
}

/* ================================================================
   REQUEST ROW
================================================================ */

function RequestRow({
  request,
}: {
  request: HRRequest;
}) {
  const closed =
    request.status === "resolved" ||
    request.status === "closed";

  const inProgress =
    request.status === "in_progress";

  return (
    <Link
      href="/requests"
      className="group flex items-center gap-4 px-7 py-5 transition-colors hover:bg-[var(--surface-hover)]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--muted)] transition-colors group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        <FileText size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {request.subject || "HR request"}
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          {request.category
            ? formatLabel(request.category)
            : "HR request"}
          {" · "}
          {formatRelativeDate(request.created_at)}
        </p>
      </div>

      <span
        className={[
          "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium",
          closed
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : inProgress
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        ].join(" ")}
      >
        {formatLabel(request.status)}
      </span>
    </Link>
  );
}

/* ================================================================
   QUICK ACTION
================================================================ */

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--foreground)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--foreground)] transition group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={15}
        className="ml-auto text-[var(--muted)] transition group-hover:text-[var(--foreground)]"
      />
    </Link>
  );
}

/* ================================================================
   EMPTY ACTIVITY
================================================================ */

function EmptyActivity() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
      <MessageSquareText
        size={20}
        className="mx-auto text-[var(--muted)]"
      />

      <p className="mt-3 text-sm font-medium">
        No recent activity
      </p>

      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Your HR request activity will appear here.
      </p>

      <Link
        href="/requests"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] hover:underline"
      >
        View requests
        <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

/* ================================================================
   ERROR
================================================================ */

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
          <RefreshCw size={20} />
        </div>

        <h2 className="mt-5 text-lg font-medium">
          Unable to load your dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-85"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   HELPERS
================================================================ */

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(1);
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}