"use client";

import { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { IconChip, type Tone } from "@/components/ui/premium";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: Tone;
}

export default function EmptyState({
  title,
  description,
  action,
  tone = 2,
}: EmptyStateProps) {
  return (
    <div
      className="
        relative flex flex-col items-center justify-center overflow-hidden
        rounded-2xl border border-dashed
        border-[var(--border-strong)]
        bg-[var(--glass-bg)] backdrop-blur-2xl
        px-6 py-14 text-center
      "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-[0.12] blur-[80px]"
        style={{ background: `var(--accent-${tone})` }}
      />

      <div className="relative">
        <IconChip tone={tone} size="lg">
          <Inbox size={20} />
        </IconChip>

        <h3 className="font-display mt-5 text-[18px] font-medium tracking-[-0.015em]">
          {title}
        </h3>

        {description && (
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-6 text-[var(--muted)]">
            {description}
          </p>
        )}

        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}