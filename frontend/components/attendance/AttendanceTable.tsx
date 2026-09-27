import { AttendanceRecord } from "@/types/attendance";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "present"
      ? "bg-emerald-500/10 text-emerald-600"
      : normalized === "absent"
        ? "bg-red-500/10 text-red-600"
        : normalized === "leave"
          ? "bg-blue-500/10 text-blue-600"
          : "bg-amber-500/10 text-amber-600";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${styles}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function AttendanceTable({
  records,
}: {
  records: AttendanceRecord[];
}) {
  if (!records.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
        <p className="text-sm text-[var(--muted)]">
          No attendance records found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-6 py-5">
        <p className="text-sm font-medium">
          Attendance history
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Your recent attendance records
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Date
              </th>

              <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Status
              </th>

              <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Check in
              </th>

              <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                Check out
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-6 py-4 text-sm">
                  {formatDate(record.date)}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={record.status} />
                </td>

                <td className="px-6 py-4 text-sm text-[var(--muted)]">
                  {formatTime(record.check_in)}
                </td>

                <td className="px-6 py-4 text-sm text-[var(--muted)]">
                  {formatTime(record.check_out)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}