"use client";

interface HRStatsProps {
  pendingLeaves: number;
  openRequests: number;
  escalatedRequests: number;
  urgentRequests: number;
}

const stats = [
  {
    key: "pendingLeaves",
    label: "Pending leave",
    description: "Awaiting HR review",
  },
  {
    key: "openRequests",
    label: "Open requests",
    description: "Need HR attention",
  },
  {
    key: "escalatedRequests",
    label: "Escalated",
    description: "Require human review",
  },
  {
    key: "urgentRequests",
    label: "Urgent",
    description: "High-priority queue",
  },
] as const;

export default function HRStats({
  pendingLeaves,
  openRequests,
  escalatedRequests,
  urgentRequests,
}: HRStatsProps) {
  const values = {
    pendingLeaves,
    openRequests,
    escalatedRequests,
    urgentRequests,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/30 hover:shadow-sm"
        >
          <div className="text-sm text-[var(--muted)]">{stat.label}</div>

          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {values[stat.key]}
          </div>

          <div className="mt-2 text-xs text-[var(--muted)]">
            {stat.description}
          </div>
        </div>
      ))}
    </div>
  );
}