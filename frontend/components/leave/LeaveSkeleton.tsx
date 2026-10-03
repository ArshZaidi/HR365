function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-hover)]/60 ${className}`}
    />
  );
}

export default function LeaveSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="
              rounded-2xl border border-[var(--glass-border)]
              bg-[var(--glass-bg)] p-5 backdrop-blur-2xl
            "
          >
            <div className="flex items-center justify-between">
              <Block className="h-10 w-10 rounded-xl" />
              <Block className="h-3 w-20" />
            </div>
            <Block className="mt-5 h-9 w-20" />
            <Block className="mt-3 h-3.5 w-32" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        {/* Leave history */}
        <div
          className="
            overflow-hidden rounded-2xl
            border border-[var(--glass-border)]
            bg-[var(--glass-bg)] backdrop-blur-2xl
          "
        >
          <div className="border-b border-[var(--border)] px-6 py-4">
            <Block className="h-4 w-32" />
            <Block className="mt-2 h-3.5 w-48" />
          </div>

          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="
                  flex items-center gap-4 border-b border-[var(--border)]
                  px-6 py-4 last:border-0
                "
              >
                <Block className="h-7 w-20 rounded-full" />
                <Block className="h-4 w-40" />
                <Block className="h-4 flex-1" />
                <Block className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Apply form */}
        <div
          className="
            rounded-2xl border border-[var(--glass-border)]
            bg-[var(--glass-bg)] p-6 backdrop-blur-2xl
          "
        >
          <Block className="h-5 w-32" />
          <Block className="mt-2 h-3.5 w-52" />

          <div className="mt-6 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Block className="mb-2 h-3 w-20" />
                <Block className="h-11 w-full rounded-xl" />
              </div>
            ))}

            <Block className="h-24 w-full rounded-xl" />
            <Block className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}