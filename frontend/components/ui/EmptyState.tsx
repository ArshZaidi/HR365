"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-hover)] text-[var(--muted)]">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M4 7h16M7 4v3M17 4v3M5 7v13h14V7" />
          <path d="M8 11h8M8 15h5" />
        </svg>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-md text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}