import { MessageSquareText } from "lucide-react";

import RequestCard from "./RequestCard";
import { HRRequest } from "@/types/requests";
import { GlassPanel } from "@/components/ui/premium";

export default function RequestTable({
  requests,
  onCancel,
}: {
  requests: HRRequest[];
  onCancel?: (requestId: string) => Promise<void>;
}) {
  if (!requests.length) {
    return (
      <GlassPanel tone={5} padded={false}>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-5-soft)] text-[var(--accent-5)]">
            <MessageSquareText size={20} />
          </div>

          <p className="font-display mt-4 text-[18px] font-medium tracking-[-0.015em]">
            No HR requests yet
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[var(--muted)]">
            Use the form to submit your first request. Your history will
            appear here.
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}