"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
        p-6
      "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-[0.16] blur-[60px]"
        style={{ background: "var(--danger)" }}
      />

      <div className="relative flex items-start gap-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          <AlertTriangle size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] font-medium tracking-[-0.005em]"
            style={{ color: "var(--danger)" }}
          >
            {title}
          </p>

          <p className="mt-1.5 text-[13.5px] leading-6 text-[var(--muted)]">
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="
                mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg
                border px-3 text-[12.5px] font-medium
                transition-all duration-300 ease-[var(--ease-out-soft)]
                hover:-translate-y-0.5
              "
              style={{
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
            >
              <RefreshCw size={13} />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}