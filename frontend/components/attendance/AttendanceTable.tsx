import { CalendarDays, Clock } from "lucide-react";

import { AttendanceRecord } from "@/types/attendance";
import {
  GlassPanel,
  StatusBadge,
} from "@/components/ui/premium";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "info" | "danger" | "neutral" {
  const normalized = status.toLowerCase();

  if (normalized === "present") return "success";
  if (normalized === "absent") return "danger";
  if (normalized === "leave") return "info";
  if (normalized === "half_day" || normalized === "half day") return "warning";

  return "neutral";
}

export default function AttendanceTable({
  records,
}: {
  records: AttendanceRecord[];
}) {
  if (!records.length) {
    return (
      <GlassPanel tone={2} padded={false}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-2-soft)] text-[var(--accent-2)]">
            <CalendarDays size={20} />
          </div>

          <p className="font-display mt-4 text-[18px] font-medium tracking-[-0.015em]">
            No attendance records yet
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">
            Your daily check-ins and check-outs will appear here once you
            start marking attendance.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      tone={2}
      title="Attendance history"
      subtitle="Your recent attendance records"
      padded={false}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]/30">
              <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Date
              </th>

              <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Status
              </th>

              <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Check in
              </th>

              <th className="px-6 py-3.5 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                Check out
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="
                  group border-b border-[var(--border)] last:border-0
                  transition-colors duration-200 ease-[var(--ease-out-soft)]
                  hover:bg-[var(--surface-hover)]/40
                "
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-lg bg-[var(--accent-2-soft)] text-[var(--accent-2)]
                        transition-transform duration-300 ease-[var(--ease-out-soft)]
                        group-hover:scale-[1.06]
                      "
                    >
                      <CalendarDays size={14} />
                    </span>

                    <span className="text-[14px] font-medium tracking-[-0.005em] tabular-nums">
                      {formatDate(record.date)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <StatusBadge variant={getStatusVariant(record.status)}>
                    {record.status.replace("_", " ")}
                  </StatusBadge>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[14px] text-[var(--muted)]">
                    <Clock size={13} className="shrink-0" />
                    <span className="tabular-nums">
                      {formatTime(record.check_in)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[14px] text-[var(--muted)]">
                    <Clock size={13} className="shrink-0" />
                    <span className="tabular-nums">
                      {formatTime(record.check_out)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}