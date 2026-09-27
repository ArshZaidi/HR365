import { LeaveSummary as LeaveSummaryType } from "@/types/leave";

interface LeaveSummaryProps {
  summary: LeaveSummaryType;
}

export default function LeaveSummary({
  summary,
}: LeaveSummaryProps) {
  const stats = [
    {
      label: "Total requests",
      value: summary.total_requests,
    },
    {
      label: "Pending",
      value: summary.pending,
    },
    {
      label: "Approved",
      value: summary.approved,
    },
    {
      label: "Approved days",
      value: summary.approved_leave_days,
    },
  ];

  return (
    <div className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[var(--surface)] p-6"
        >
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            {stat.label}
          </p>

          <p className="mt-5 text-3xl font-medium tracking-[-0.04em]">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}