import { Leave } from "@/types/leave";

function Status({
  status,
}: {
  status: string;
}) {
  const styles =
    status === "approved"
      ? "bg-emerald-500/10 text-emerald-600"
      : status === "rejected"
        ? "bg-red-500/10 text-red-600"
        : "bg-amber-500/10 text-amber-600";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

export default function LeaveTable({
  leaves,
}: {
  leaves: Leave[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-6 py-5">
        <p className="text-sm font-medium">
          Leave history
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Your submitted leave requests
        </p>
      </div>

      {!leaves.length ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">
          No leave requests yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Type
                </th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Period
                </th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Reason
                </th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave) => (
                <tr
                  key={leave.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-6 py-4 text-sm capitalize">
                    {leave.leave_type}
                  </td>

                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {leave.start_date} → {leave.end_date}
                  </td>

                  <td className="max-w-xs px-6 py-4 text-sm text-[var(--muted)]">
                    <span className="line-clamp-1">
                      {leave.reason || "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Status status={leave.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}