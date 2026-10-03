export default function DashboardSkeleton() {
  const block = "bg-[var(--surface-hover)]/60";

  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className={`h-7 w-36 rounded-full ${block}`} />
        <div className={`h-12 w-[22rem] max-w-full rounded-2xl ${block}`} />
        <div className={`h-4 w-[26rem] max-w-full rounded-lg ${block}`} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-xl ${block}`} />
              <div className={`h-3 w-20 rounded ${block}`} />
            </div>
            <div className={`mt-5 h-9 w-24 rounded-lg ${block}`} />
            <div className={`mt-3 h-3.5 w-36 rounded ${block}`} />
          </div>
        ))}
      </div>

      {/* Attendance + Leave */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl lg:col-span-8">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <div className={`h-4.5 w-32 rounded ${block}`} />
            <div className={`mt-2 h-3.5 w-44 rounded ${block}`} />
          </div>
          <div className="flex flex-col items-center gap-8 p-6 sm:flex-row sm:gap-12">
            <div className={`h-44 w-44 shrink-0 rounded-full ${block}`} />
            <div className="w-full flex-1 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between gap-4">
                  <div className={`h-3.5 w-28 rounded ${block}`} />
                  <div className={`h-3.5 w-20 rounded ${block}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl lg:col-span-4">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <div className={`h-4.5 w-28 rounded ${block}`} />
            <div className={`mt-2 h-3.5 w-40 rounded ${block}`} />
          </div>
          <div className="flex flex-col items-center p-6">
            <div className={`h-36 w-36 rounded-full ${block}`} />
            <div className={`mt-6 h-3.5 w-48 rounded ${block}`} />
            <div className={`mt-2 h-3.5 w-40 rounded ${block}`} />
          </div>
        </div>
      </div>

      {/* Requests + Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl lg:col-span-8">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <div className={`h-4.5 w-36 rounded ${block}`} />
            <div className={`mt-2 h-3.5 w-48 rounded ${block}`} />
          </div>
          <div className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className={`h-10 w-10 shrink-0 rounded-xl ${block}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3.5 w-56 max-w-full rounded ${block}`} />
                  <div className={`h-3.5 w-36 rounded ${block}`} />
                </div>
                <div className={`h-6 w-20 rounded-full ${block}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl lg:col-span-4">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <div className={`h-4.5 w-32 rounded ${block}`} />
            <div className={`mt-2 h-3.5 w-40 rounded ${block}`} />
          </div>
          <div className="space-y-5 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 rounded-full ${block}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3.5 w-4/5 rounded ${block}`} />
                  <div className={`h-3.5 w-1/2 rounded ${block}`} />
                </div>
                <div className={`h-3.5 w-10 rounded ${block}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI banner */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl ${block}`} />
            <div className="space-y-2">
              <div className={`h-4 w-40 rounded ${block}`} />
              <div className={`h-3.5 w-64 max-w-full rounded ${block}`} />
            </div>
          </div>
          <div className={`hidden h-10 w-32 rounded-xl sm:block ${block}`} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <div className={`h-4 w-32 rounded ${block}`} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 backdrop-blur-2xl"
            >
              <div className={`h-11 w-11 shrink-0 rounded-xl ${block}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3.5 w-28 rounded ${block}`} />
                <div className={`h-3.5 w-36 rounded ${block}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}