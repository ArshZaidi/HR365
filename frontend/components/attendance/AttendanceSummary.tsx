interface AttendanceSummaryProps {
  summary: {
    total_days: number;
    present: number;
    absent: number;
    half_day: number;
    attendance_percentage: number;
  };
}

export default function AttendanceSummary({
  summary,
}: AttendanceSummaryProps) {
  const stats = [
    {
      label: "Attendance",
      value: `${summary.attendance_percentage}%`,
    },
    {
      label: "Present",
      value: String(summary.present),
    },
    {
      label: "Half days",
      value: String(summary.half_day),
    },
    {
      label: "Absent",
      value: String(summary.absent),
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