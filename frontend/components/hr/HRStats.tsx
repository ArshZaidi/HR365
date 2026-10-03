import {
  AlertTriangle,
  ClipboardList,
  Clock3,
  Flame,
} from "lucide-react";

import { IconChip, type Tone } from "@/components/ui/premium";

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
    tone: 5 as Tone,
    icon: <Clock3 size={17} />,
  },
  {
    key: "openRequests",
    label: "Open requests",
    description: "Need HR attention",
    tone: 2 as Tone,
    icon: <ClipboardList size={17} />,
  },
  {
    key: "escalatedRequests",
    label: "Escalated",
    description: "Require human review",
    tone: 6 as Tone,
    icon: <AlertTriangle size={17} />,
  },
  {
    key: "urgentRequests",
    label: "Urgent",
    description: "High-priority queue",
    tone: 1 as Tone,
    icon: <Flame size={17} />,
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
              {values[stat.key]}
            </div>
            <div className="mt-2.5 text-[13px] text-[var(--muted)]">
              {stat.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}