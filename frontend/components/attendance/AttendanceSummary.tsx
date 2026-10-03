import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GlassPanel, IconChip, type Tone } from "@/components/ui/premium";

interface AttendanceSummaryProps {
  summary: {
    total_days: number;
    present: number;
    absent: number;
    half_day: number;
    attendance_percentage: number;
  };
}

interface StatConfig {
  label: string;
  value: string;
  hint: string;
  tone: Tone;
  icon: React.ReactNode;
}

export default function AttendanceSummary({
  summary,
}: AttendanceSummaryProps) {
  const stats: StatConfig[] = [
    {
      label: "Attendance",
      value: `${summary.attendance_percentage}%`,
      hint: `Across ${summary.total_days} working days`,
      tone: 2,
      icon: <CalendarDays size={17} />,
    },
    {
      label: "Present",
      value: String(summary.present),
      hint: "Days marked present",
      tone: 4,
      icon: <CheckCircle2 size={17} />,
    },
    {
      label: "Half days",
      value: String(summary.half_day),
      hint: "Partial working days",
      tone: 5,
      icon: <Clock3 size={17} />,
    },
    {
      label: "Absent",
      value: String(summary.absent),
      hint: "Unmarked working days",
      tone: 6,
      icon: <XCircle size={17} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href="/attendance"
          className="
            group relative overflow-hidden rounded-2xl
            border border-[var(--glass-border)]
            bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
            p-5
            shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
            transition-all duration-300 ease-[var(--ease-out-soft)]
            hover:-translate-y-1
            hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
          "
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-[0.16] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.3]"
            style={{ background: `var(--accent-${stat.tone})` }}
          />

          <div className="relative flex items-center justify-between">
            <IconChip tone={stat.tone} interactive>
              {stat.icon}
            </IconChip>

            <span className="text-[10.5px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              {stat.label}
            </span>
          </div>

          <div className="relative mt-5">
            <div className="text-[2rem] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[2.125rem]">
              {stat.value}
            </div>
            <div className="mt-2.5 text-[13px] text-[var(--muted)]">
              {stat.hint}
            </div>
          </div>

          <ArrowRight
            size={15}
            className="
              absolute right-5 bottom-5 opacity-0
              transition-all duration-300 ease-[var(--ease-out-soft)]
              group-hover:translate-x-0.5 group-hover:opacity-100
            "
            style={{ color: `var(--accent-${stat.tone})` }}
          />
        </Link>
      ))}
    </div>
  );
}