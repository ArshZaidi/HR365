import { AlertCircle, ArrowUpRight } from "lucide-react";

interface EscalationCardProps {
  reason?: string | null;
  ticketId?: string | null;
}

export default function EscalationCard({
  reason,
  ticketId,
}: EscalationCardProps) {
  return (
    <div
      className="
        mt-5 rounded-2xl border p-4
        border-[var(--glass-border)]
        backdrop-blur-2xl
      "
      style={{
        background: "var(--warning-soft)",
      }}
    >
      <div className="flex gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--warning-soft)",
            color: "var(--warning)",
            boxShadow: "inset 0 0 0 1px var(--warning)",
          }}
        >
          <AlertCircle size={16} />
        </span>

        <div className="min-w-0">
          <p className="text-[14px] font-semibold tracking-[-0.005em]">
            HR assistance recommended
          </p>

          <p className="mt-1 text-[12.5px] leading-6 text-[var(--muted)]">
            {reason ||
              "This question has been escalated to human HR for review."}
          </p>

          {ticketId && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "var(--surface)/70",
                color: "var(--warning)",
              }}
            >
              Ticket {ticketId}
              <ArrowUpRight size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}