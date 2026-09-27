"use client";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import Magnetic from "@/components/ui/Magnetic";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
          
          {/* Header */}
          <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm text-[var(--muted)]">
                Saturday, September 27
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] text-[var(--foreground)]">
                Good morning, Arsh.
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--muted)]">
                Your HR workspace is ready. Here's a quick look at
                everything that needs your attention.
              </p>
            </div>

            <Magnetic strength={0.12}>
              <a
                href="/assistant"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-85"
              >
                <Sparkles size={15} />
                Ask HR365
                <ArrowUpRight size={15} />
              </a>
            </Magnetic>
          </section>

          {/* Stats */}
          <section className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={<CalendarDays size={18} />}
              label="Attendance"
              value="92%"
              description="This month"
            />

            <Stat
              icon={<Clock3 size={18} />}
              label="Leave balance"
              value="12 days"
              description="Remaining"
            />

            <Stat
              icon={<FileText size={18} />}
              label="HR requests"
              value="2"
              description="Open requests"
            />

            <Stat
              icon={<CheckCircle2 size={18} />}
              label="Tasks"
              value="4"
              description="In progress"
            />
          </section>

          {/* Main grid */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

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

                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.03em]">
                  Your HR questions,
                  <br />
                  answered instantly.
                </h2>

                <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">
                  Ask about policies, leave, attendance, benefits or
                  your personal HR information. Answers are grounded
                  in your organization's trusted data.
                </p>

                <Magnetic strength={0.1}>
                  <a
                    href="/assistant"
                    className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium transition hover:border-[var(--foreground)]"
                  >
                    Open AI Assistant
                    <ArrowUpRight size={15} />
                  </a>
                </Magnetic>
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Recent activity
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Your latest updates
                  </p>
                </div>

                <button className="text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]">
                  View all
                </button>
              </div>

              <div className="mt-7 space-y-6">
                <Activity
                  title="Leave request submitted"
                  description="Casual leave"
                  time="Today"
                />

                <Activity
                  title="Attendance marked"
                  description="Present"
                  time="Today"
                />

                <Activity
                  title="HR request updated"
                  description="Status changed"
                  time="Yesterday"
                />
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-sm font-semibold">
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
        </div>
      </PageTransition>
    </AppShell>
  );
}

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
    <div className="bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3 text-[var(--muted)]">
        {icon}

        <span className="text-xs font-medium uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-7 text-3xl font-semibold tracking-[-0.03em]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}

function Activity({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          {description}
        </p>
      </div>

      <span className="ml-auto shrink-0 text-[10px] text-[var(--muted)]">
        {time}
      </span>
    </div>
  );
}

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
    <a
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
    </a>
  );
}