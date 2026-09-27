import RequestCard from "./RequestCard";
import { HRRequest } from "@/types/requests";

export default function RequestTable({
  requests,
}: {
  requests: HRRequest[];
}) {
  if (!requests.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
        <p className="text-sm text-[var(--muted)]">
          You don't have any HR requests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
        />
      ))}
    </div>
  );
}