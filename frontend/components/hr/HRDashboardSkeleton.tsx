function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--surface-hover)]/60 ${className}`}
    />
  );
}

function PanelShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: boolean;
}) {
  return (
    <div
      className="
        overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl
      "
    >
      {title && (
        <div className="border-b border-[var(--border)] px-6 py-4">
          <Block className="h-4 w-40" />
          <Block className="mt-2 h-3.5 w-56" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function HRDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
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
            <Block className="mt-5 h-9 w-16" />
            <Block className="mt-3 h-3.5 w-32" />
          </div>
        ))}
      </div>

      {/* Leave approvals */}
      <PanelShell title>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              flex flex-col gap-5 border-b border-[var(--border)] p-6
              last:border-0 lg:flex-row lg:justify-between
            "
          >
            <div className="flex-1 space-y-3">
              <div className="flex gap-2.5">
                <Block className="h-6 w-20 rounded-full" />
                <Block className="h-6 w-20 rounded-full" />
                <Block className="h-4 w-24" />
              </div>
              <Block className="h-8 w-48" />
              <Block className="h-4 w-64" />
              <Block className="h-4 w-3/4" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Block className="h-10 w-24 rounded-xl" />
              <Block className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </PanelShell>

      {/* Request queue */}
      <PanelShell title>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              flex flex-col gap-5 border-b border-[var(--border)] p-6
              last:border-0 xl:flex-row xl:justify-between
            "
          >
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Block className="h-6 w-20 rounded-full" />
                <Block className="h-6 w-16 rounded-full" />
                <Block className="h-6 w-20 rounded-full" />
              </div>
              <Block className="h-5 w-64" />
              <Block className="h-4 w-full" />
              <Block className="h-3.5 w-2/3" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Block className="h-9 w-20 rounded-lg" />
              <Block className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </PanelShell>

      {/* Feedback analytics */}
      <PanelShell title>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <Block className="h-24 rounded-xl" />
          <Block className="h-24 rounded-xl" />
          <Block className="h-24 rounded-xl" />
        </div>
        <div className="border-t border-[var(--border)] p-6">
          <Block className="h-3 w-full rounded-full" />
        </div>
      </PanelShell>
    </div>
  );
}