import { ArrowUpRight } from "lucide-react";
import { HRRequest } from "@/types/requests";

function Status({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "resolved" ||
    normalized === "closed"
      ? "bg-emerald-500/10 text-emerald-600"
      : normalized === "rejected"
        ? "bg-red-500/10 text-red-600"
        : "bg-amber-500/10 text-amber-600";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${styles}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function RequestCard({
  request,
}: {
  request: HRRequest;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--foreground)]">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Status status={request.status} />

            {request.is_escalated && (
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-600">
                Escalated
              </span>
            )}
          </div>

          <h3 className="mt-4 text-sm font-medium">
            {request.subject}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
            {request.description}
          </p>

          <div className="mt-4 flex items-center gap-3 text-[10px] text-[var(--muted)]">
            <span className="capitalize">
              {request.category}
            </span>

            <span>•</span>

            <span className="capitalize">
              {request.priority}
            </span>
          </div>
        </div>

        <ArrowUpRight
          size={16}
          className="text-[var(--muted)] transition group-hover:text-[var(--foreground)]"
        />
      </div>
    </div>
  );
}