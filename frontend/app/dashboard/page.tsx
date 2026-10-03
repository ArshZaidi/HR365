"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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

      const [attendanceResponse, leaveResponse, requestsResponse] =
        await Promise.all([
          apiFetch<{ summary: { attendance_percentage: number } }>(
            "/api/attendance/me/summary",
          ),
          apiFetch<{ summary: { approved_leave_days: number } }>(
            "/api/leaves/me/summary",
          ),
          apiFetch<{ requests: HRRequest[] }>("/api/hr-requests/me"),
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
        (r) => r.status === "open" || r.status === "in_progress",
      );
      const pendingRequests = requestRecords.filter(
        (r) => r.status === "open",
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
        err instanceof Error ? err.message : "Unable to load your dashboard.",
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
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.subject || "HR request",
        description: [
          r.category ? formatLabel(r.category) : "HR request",
          formatLabel(r.status),
        ].join(" · "),
        time: formatRelativeDate(r.created_at),
        status: r.status,
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

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const isLoading = loading || profileLoading;

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-full">
          {isLoading ? (
            <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
              <DashboardSkeleton />
            </div>
          ) : error ? (
            <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
              <DashboardError message={error} onRetry={loadDashboard} />
            </div>
          ) : (
            <>
              {/* ═══════════ Header ═══════════ */}
              <div className="border-b border-[var(--border)]">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-3.5 py-1.5 backdrop-blur-xl">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: "var(--accent-1)",
                          boxShadow: "0 0 8px var(--accent-1)",
                        }}
                      />
                      <span className="text-[13px] font-medium text-[var(--muted)]">
                        {today}
                      </span>
                    </div>

                    <h1 className="font-display mt-4 text-[2.25rem] leading-[1.08] font-medium tracking-[-0.03em] sm:text-[2.75rem] lg:text-[3.25rem]">
                      {getGreeting()}, {firstName}.
                    </h1>

                    <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-[var(--muted)]">
                      {profile?.designation && (
                        <span>{profile.designation}</span>
                      )}
                      {profile?.designation && profile?.department && (
                        <span className="text-[var(--border-strong)]">·</span>
                      )}
                      {profile?.department && (
                        <span>{profile.department}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <Link
                      href="/leave"
                      className="
                        hidden h-11 items-center gap-2 rounded-xl
                        border border-[var(--border)] bg-[var(--surface)]/50
                        px-4 text-[14px] font-medium backdrop-blur-xl
                        transition-all duration-300 ease-[var(--ease-out-soft)]
                        hover:-translate-y-0.5 hover:border-[var(--border-strong)]
                        hover:shadow-[var(--shadow-sm)]
                        sm:inline-flex
                      "
                    >
                      <CalendarDays size={16} />
                      Apply leave
                    </Link>

                    <Magnetic strength={0.1}>
                      <Link
                        href="/assistant"
                        className="
                          group inline-flex h-11 items-center gap-2 rounded-xl
                          px-5 text-[14px] font-medium text-white
                          transition-all duration-300 ease-[var(--ease-out-soft)]
                          hover:-translate-y-0.5
                        "
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent-1), var(--accent-6) 50%, var(--accent-2))",
                          boxShadow:
                            "0 12px 28px -10px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.25)",
                        }}
                      >
                        <Sparkles size={16} />
                        Ask HR365
                        <ArrowUpRight
                          size={15}
                          className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    </Magnetic>
                  </div>
                </div>
              </div>

              {/* ═══════════ Body ═══════════ */}
              <div className="mx-auto w-full max-w-[1600px] space-y-6 px-5 py-7 sm:px-8 lg:px-10">
                {/* KPI strip */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Kpi
                    tone={1}
                    icon={<CalendarDays size={17} />}
                    label="Attendance"
                    value={`${formatNumber(data?.attendance ?? 0)}%`}
                    hint="Current attendance rate"
                    href="/attendance"
                  />
                  <Kpi
                    tone={2}
                    icon={<Clock3 size={17} />}
                    label="Approved leave"
                    value={`${data?.approvedLeaveDays ?? 0}d`}
                    hint="Leave days used"
                    href="/leave"
                  />
                  <Kpi
                    tone={5}
                    icon={<FileText size={17} />}
                    label="Open requests"
                    value={String(data?.openRequests ?? 0)}
                    hint={
                      data?.pendingRequests
                        ? `${data.pendingRequests} pending review`
                        : "Nothing pending"
                    }
                    href="/requests"
                  />
                  <Kpi
                    tone={4}
                    icon={<CheckCircle2 size={17} />}
                    label="Total activity"
                    value={String(data?.totalRequests ?? 0)}
                    hint="Lifetime HR requests"
                    href="/requests"
                  />
                </section>

                {/* Attendance + Leave */}
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                  <Panel
                    className="lg:col-span-8"
                    tone={2}
                    title="Attendance"
                    subtitle="Current period overview"
                    actionLabel="View details"
                    actionHref="/attendance"
                  >
                    <div className="flex flex-col items-center gap-8 py-2 sm:flex-row sm:gap-12">
                      <ProgressRing
                        tone={2}
                        value={Math.min(
                          100,
                          Math.max(0, data?.attendance ?? 0),
                        )}
                        label="Present"
                      />

                      <div className="w-full flex-1 space-y-5">
                        <Metric
                          label="Attendance rate"
                          value={`${formatNumber(data?.attendance ?? 0)}%`}
                        />
                        <Metric
                          label="Approved leave"
                          value={`${data?.approvedLeaveDays ?? 0} days`}
                        />
                        <Metric label="Reporting period" value={today} />
                      </div>
                    </div>
                  </Panel>

                  <Panel
                    className="lg:col-span-4"
                    tone={4}
                    title="Leave balance"
                    subtitle="Approved days this cycle"
                    actionLabel="Apply"
                    actionHref="/leave"
                  >
                    <div className="flex flex-col items-center justify-center py-3 text-center">
                      <div className="relative flex h-36 w-36 items-center justify-center">
                        <svg
                          viewBox="0 0 120 120"
                          className="absolute inset-0 -rotate-90"
                        >
                          <defs>
                            <linearGradient
                              id="leaveGrad"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--accent-4)"
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--accent-3)"
                              />
                            </linearGradient>
                          </defs>
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="10"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="url(#leaveGrad)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${Math.min(
                              100,
                              (data?.approvedLeaveDays ?? 0) * 5,
                            )} 1000`}
                            className="transition-all duration-700 ease-[var(--ease-out-soft)]"
                            
                          />
                        </svg>

                        <div className="text-center">
                          <div className="text-[2.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                            {data?.approvedLeaveDays ?? 0}
                          </div>
                          <div className="mt-1.5 text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                            days
                          </div>
                        </div>
                      </div>

                      <p className="mt-6 max-w-[15rem] text-[13.5px] leading-6 text-[var(--muted)]">
                        Approved leave days used so far. New requests will
                        appear here once approved.
                      </p>
                    </div>
                  </Panel>
                </section>

                {/* Requests + Activity */}
                <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                  <Panel
                    className="lg:col-span-8"
                    tone={5}
                    title="Request overview"
                    subtitle="Your most recent HR requests"
                    actionLabel="All requests"
                    actionHref="/requests"
                    padded={false}
                  >
                    {recentRequests.length > 0 ? (
                      <div className="divide-y divide-[var(--border)]">
                        {recentRequests.map((r) => (
                          <RequestRow key={r.id} request={r} />
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-5-soft)] text-[var(--accent-5)]">
                          <MessageSquareText size={20} />
                        </div>
                        <p className="mt-4 text-[15px] font-medium">
                          No HR requests yet
                        </p>
                        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
                          Your submitted requests will appear here.
                        </p>
                      </div>
                    )}
                  </Panel>

                  <Panel
                    className="lg:col-span-4"
                    tone={6}
                    title="Recent activity"
                    subtitle="Latest updates"
                    actionLabel="View all"
                    actionHref="/requests"
                  >
                    {activities.length > 0 ? (
                      <div className="space-y-5">
                        {activities.map((a) => (
                          <ActivityItem key={a.id} {...a} />
                        ))}
                      </div>
                    ) : (
                      <EmptyActivity />
                    )}
                  </Panel>
                </section>

                {/* AI banner */}
                <section>
                  <div
                    className="
                      relative overflow-hidden rounded-2xl
                      border border-[var(--glass-border)]
                      bg-[var(--glass-bg)] backdrop-blur-2xl
                      shadow-[var(--shadow-sm)]
                      transition-all duration-300 ease-[var(--ease-out-soft)]
                      hover:shadow-[var(--shadow-md)]
                    "
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-32 -right-16 h-72 w-72 rounded-full opacity-40 blur-[80px]"
                      style={{ background: "var(--accent-2)" }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-25 blur-[80px]"
                      style={{ background: "var(--accent-6)" }}
                    />

                    <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                            boxShadow:
                              "0 10px 24px -10px var(--accent-2), inset 0 1px 0 rgba(255,255,255,0.28)",
                          }}
                        >
                          <Bot size={21} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <p className="font-display text-[18px] font-medium tracking-[-0.02em]">
                              HR365 Intelligence
                            </p>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase"
                              style={{
                                background: "var(--accent-2-soft)",
                                color: "var(--accent-2)",
                              }}
                            >
                              AI
                            </span>
                          </div>

                          <p className="mt-1.5 text-[14px] text-[var(--muted)]">
                            Ask about policies, leave, attendance, or your
                            personal HR information.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/assistant"
                        className="
                          group relative inline-flex shrink-0 items-center gap-2
                          rounded-xl border border-[var(--border-strong)]
                          bg-[var(--surface)]/60 px-4 py-2.5 backdrop-blur-xl
                          text-[13.5px] font-medium
                          transition-all duration-300 ease-[var(--ease-out-soft)]
                          hover:-translate-y-0.5 hover:border-[var(--foreground)]
                          hover:shadow-[var(--shadow-sm)]
                        "
                      >
                        Open assistant
                        <ArrowUpRight
                          size={14}
                          className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    </div>
                  </div>
                </section>

                {/* Quick actions */}
                <section>
                  <div className="mb-3">
                    <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
                      Quick actions
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--muted)]">
                      Frequently used HR actions
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <QuickAction
                      tone={2}
                      icon={<Bot size={18} />}
                      title="Ask HR365"
                      description="Get an instant HR answer"
                      href="/assistant"
                    />
                    <QuickAction
                      tone={4}
                      icon={<CalendarDays size={18} />}
                      title="Apply for leave"
                      description="Submit a new leave request"
                      href="/leave"
                    />
                    <QuickAction
                      tone={5}
                      icon={<FileText size={18} />}
                      title="HR requests"
                      description="Track and manage requests"
                      href="/requests"
                    />
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </PageTransition>
    </AppShell>
  );
}

/* ================================================================
   PANEL — glass
================================================================ */

function Panel({
  title,
  subtitle,
  actionLabel,
  actionHref,
  tone,
  padded = true,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  tone: number;
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl",
        "border border-[var(--glass-border)]",
        "bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]",
        "transition-all duration-500 ease-[var(--ease-out-soft)]",
        "hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]",
        className,
      ].join(" ")}
    >
      {/* Tinted glow per panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full opacity-[0.14] blur-[80px] transition-opacity duration-500 group-hover:opacity-[0.22]"
        style={{ background: `var(--accent-${tone})` }}
      />

      <div className="relative flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-6 w-1 shrink-0 rounded-full"
            style={{
              background: `var(--accent-${tone})`,
              boxShadow: `0 0 10px var(--accent-${tone})`,
            }}
          />
          <div className="min-w-0">
            <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="
              group/cta inline-flex shrink-0 items-center gap-1
              rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium
              text-[var(--muted)]
              transition-colors duration-200 ease-[var(--ease-out-soft)]
              hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]
            "
          >
            {actionLabel}
            <ChevronRight
              size={13}
              className="transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/cta:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      <div className={padded ? "relative p-5 sm:p-6" : "relative"}>
        {children}
      </div>
    </div>
  );
}

/* ================================================================
   KPI — gradient chip per tone
================================================================ */

function Kpi({
  icon,
  label,
  value,
  hint,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  href: string;
  tone: number;
}) {
  return (
    <Link
      href={href}
      className="
        group relative overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
        p-5
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
        transition-all duration-300 ease-[var(--ease-out-soft)]
        hover:-translate-y-1 hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
      "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-[0.16] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.3]"
        style={{ background: `var(--accent-${tone})` }}
      />

      <div className="relative flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-[1.08]"
          style={{
            background: `linear-gradient(135deg, var(--accent-${tone}), color-mix(in oklab, var(--accent-${tone}) 55%, black))`,
            boxShadow: `0 8px 20px -8px var(--accent-${tone}), inset 0 1px 0 rgba(255,255,255,0.28)`,
          }}
        >
          {icon}
        </span>

        <span className="text-[10.5px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </span>
      </div>

      <div className="relative mt-5">
        <div className="text-[2rem] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[2.125rem]">
          {value}
        </div>
        <div className="mt-2.5 flex items-center gap-1 text-[13px] text-[var(--muted)]">
          <span className="truncate">{hint}</span>
        </div>
      </div>

      <ArrowRight
        size={15}
        className="
          absolute right-5 bottom-5 opacity-0
          transition-all duration-300 ease-[var(--ease-out-soft)]
          group-hover:translate-x-0.5 group-hover:opacity-100
        "
        style={{ color: `var(--accent-${tone})` }}
      />
    </Link>
  );
}

/* ================================================================
   METRIC
================================================================ */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[var(--border)] pb-4 last:border-b-0 last:pb-0">
      <span className="text-[13px] font-medium text-[var(--muted)]">
        {label}
      </span>
      <span className="text-[16px] font-semibold tracking-[-0.01em] tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ================================================================
   PROGRESS RING — gradient stroke
================================================================ */

function ProgressRing({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: number;
}) {
  const radius = 52;
  const c = 2 * Math.PI * radius;
  const offset = c - (value / 100) * c;
  const gradId = `ring-${tone}`;

  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`var(--accent-${tone})`} />
            <stop offset="100%" stopColor="var(--accent-6)" />
          </linearGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="9"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-[var(--ease-out-soft)]"
        />
      </svg>

      <div className="text-center">
        <div className="text-[2.25rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">
          {value.toFixed(1)}%
        </div>
        <div className="mt-1.5 text-[10.5px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ACTIVITY ITEM
================================================================ */

function ActivityItem({ title, description, time, status }: Activity) {
  const completed = status === "resolved" || status === "closed";
  const inProgress = status === "in_progress";

  const colorVar = completed
    ? "var(--success)"
    : inProgress
      ? "var(--info)"
      : "var(--accent-6)";

  const softVar = completed
    ? "var(--success-soft)"
    : inProgress
      ? "var(--info-soft)"
      : "var(--accent-6-soft)";

  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4"
        style={{
          background: colorVar,
          boxShadow: `0 0 8px ${colorVar}`,
          // ring via box-shadow trick since dynamic ring-* is awkward
          outline: `3px solid ${softVar}`,
          outlineOffset: "0px",
        }}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{title}</p>
        <p className="mt-1 text-[12.5px] text-[var(--muted)]">{description}</p>
      </div>

      <span className="shrink-0 pt-0.5 text-[11.5px] font-medium text-[var(--muted)]">
        {time}
      </span>
    </div>
  );
}

/* ================================================================
   REQUEST ROW
================================================================ */

function RequestRow({ request }: { request: HRRequest }) {
  const closed =
    request.status === "resolved" || request.status === "closed";
  const inProgress = request.status === "in_progress";

  const statusStyle = closed
    ? { bg: "var(--success-soft)", fg: "var(--success)" }
    : inProgress
      ? { bg: "var(--info-soft)", fg: "var(--info)" }
      : { bg: "var(--warning-soft)", fg: "var(--warning)" };

  return (
    <Link
      href="/requests"
      className="
        group flex items-center gap-4 px-5 py-4
        transition-colors duration-200 ease-[var(--ease-out-soft)]
        hover:bg-[var(--surface-hover)]/50
        sm:px-6
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
          bg-[var(--accent-5-soft)] text-[var(--accent-5)]
          transition-all duration-300 ease-[var(--ease-out-soft)]
          group-hover:scale-[1.06]
        "
      >
        <FileText size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">
          {request.subject || "HR request"}
        </p>
        <p className="mt-1 text-[12.5px] text-[var(--muted)]">
          {request.category ? formatLabel(request.category) : "HR request"}
          {" · "}
          {formatRelativeDate(request.created_at)}
        </p>
      </div>

      <span
        className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.01em]"
        style={{ background: statusStyle.bg, color: statusStyle.fg }}
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
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  tone: number;
}) {
  return (
    <Link
      href={href}
      className="
        group relative flex items-center gap-3.5 overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
        p-4
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-xs)]
        transition-all duration-300 ease-[var(--ease-out-soft)]
        hover:-translate-y-1
        hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
      "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-8 h-28 w-28 rounded-full opacity-[0.16] blur-[50px] transition-opacity duration-500 group-hover:opacity-[0.3]"
        style={{ background: `var(--accent-${tone})` }}
      />

      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-[1.08]"
        style={{
          background: `linear-gradient(135deg, var(--accent-${tone}), color-mix(in oklab, var(--accent-${tone}) 55%, black))`,
          boxShadow: `0 8px 20px -8px var(--accent-${tone}), inset 0 1px 0 rgba(255,255,255,0.28)`,
        }}
      >
        {icon}
      </div>

      <div className="relative min-w-0">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={16}
        className="
          relative ml-auto shrink-0 text-[var(--muted)]
          transition-all duration-300 ease-[var(--ease-out-soft)]
          group-hover:translate-x-0.5 group-hover:-translate-y-0.5
        "
        style={{ color: `var(--accent-${tone})` }}
      />
    </Link>
  );
}

/* ================================================================
   EMPTY ACTIVITY
================================================================ */

function EmptyActivity() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/30 px-4 py-8 text-center backdrop-blur-xl">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-6-soft)] text-[var(--accent-6)]">
        <MessageSquareText size={17} />
      </div>
      <p className="mt-3.5 text-[14px] font-medium">No recent activity</p>
      <p className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">
        Your HR activity will appear here.
      </p>
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
      <div
        className="
          w-full max-w-md rounded-2xl p-8 text-center
          border border-[var(--glass-border)]
          bg-[var(--glass-bg)] backdrop-blur-2xl
          shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
        "
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
          <RefreshCw size={22} />
        </div>

        <h2 className="font-display mt-5 text-[20px] font-medium">
          Unable to load your dashboard
        </h2>

        <p className="mt-2.5 text-[14px] leading-7 text-[var(--muted)]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="
            mt-6 inline-flex items-center gap-2 rounded-xl
            px-5 py-3 text-[14px] font-medium text-white
            transition-all duration-300 ease-[var(--ease-out-soft)]
            hover:-translate-y-0.5
          "
          style={{
            background:
              "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
            boxShadow: "0 12px 28px -10px var(--accent-1)",
          }}
        >
          <RefreshCw size={15} />
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
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(1);
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}