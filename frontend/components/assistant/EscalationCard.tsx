import {
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

interface EscalationCardProps {
  reason?: string | null;
  ticketId?: string | null;
}

export default function EscalationCard({
  reason,
  ticketId,
}: EscalationCardProps) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <AlertCircle size={16} />
        </div>

        <div>
          <p className="text-sm font-medium">
            HR assistance recommended
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {reason ||
              "This question has been escalated to human HR for review."}
          </p>

          {ticketId && (
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
              Ticket {ticketId}
              <ArrowUpRight size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}