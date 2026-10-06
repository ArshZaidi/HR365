"use client";

import { CalendarDays, ExternalLink } from "lucide-react";

const EVENTS = [
  {
    date: "12–16 Oct 2026",
    title: "Odd Semester Mid-Term Exams",
  },
  {
    date: "20 Oct 2026",
    title: "Dussehra / Vijayadashami",
  },
  {
    date: "3 Dec 2026",
    title: "Last Teaching Day",
  },
  {
    date: "10–24 Dec 2026",
    title: "Odd Semester End-Term Exams",
  },
  {
    date: "4 Jan 2027",
    title: "Even Semester Classes Begin",
  },
  {
    date: "15–19 Mar 2027",
    title: "Even Semester Mid-Term Exams",
  },
  {
    date: "10–25 May 2027",
    title: "Even Semester End-Term Exams",
  },
];

export default function AcademicCalendarCard() {
  return (
    <section
      className="
        overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
      "
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "var(--accent-2-soft)",
              color: "var(--accent-2)",
            }}
          >
            <CalendarDays size={18} />
          </span>

          <div>
            <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
              Academic calendar
            </p>

            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              Bennett University · A.Y. 2026–27
            </p>
          </div>
        </div>

        <a
          href="https://d2xwywryb7yxbo.cloudfront.net/s3bucket-images/Academic-Calendar-2026-27.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex shrink-0 items-center gap-1.5 rounded-lg
            px-2.5 py-2 text-[11.5px] font-medium
            text-[var(--muted)]
            transition-colors hover:bg-[var(--surface-hover)]
            hover:text-[var(--foreground)]
          "
        >
          Full calendar
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {EVENTS.map((event) => (
          <div
            key={`${event.date}-${event.title}`}
            className="
              flex items-center justify-between gap-4 px-5 py-3.5
              transition-colors hover:bg-[var(--surface-hover)]/40
              sm:px-6
            "
          >
            <span className="text-[12px] font-semibold tracking-[0.06em] text-[var(--accent-2)]">
              {event.date}
            </span>

            <span className="text-right text-[13.5px] text-[var(--foreground)]">
              {event.title}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)] px-5 py-3 sm:px-6">
        <p className="text-[11px] leading-5 text-[var(--muted)]">
          Reference only. Dates are taken from Bennett University’s official
          A.Y. 2026–27 academic calendar.
        </p>
      </div>
    </section>
  );
}