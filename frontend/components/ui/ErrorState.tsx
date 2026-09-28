"use client";

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
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.2a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-red-700">
            {title}
          </div>

          <p className="mt-1 text-sm leading-6 text-red-600/80">
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-500/5"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}