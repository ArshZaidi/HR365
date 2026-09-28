export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-black/[0.07] dark:bg-white/[0.08]" />
        <div className="h-9 w-72 rounded-xl bg-black/[0.08] dark:bg-white/[0.09]" />
        <div className="h-3 w-96 max-w-full rounded bg-black/[0.05] dark:bg-white/[0.06]" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.06] dark:bg-[#201f1d]"
          >
            <div className="h-3 w-24 rounded bg-black/[0.06] dark:bg-white/[0.07]" />
            <div className="mt-5 h-9 w-20 rounded-lg bg-black/[0.08] dark:bg-white/[0.09]" />
            <div className="mt-3 h-2.5 w-32 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Main overview */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {/* Attendance */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="flex items-start justify-between">
            <div>
              <div className="h-5 w-36 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
              <div className="mt-2 h-3 w-52 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
            </div>

            <div className="h-8 w-20 rounded-lg bg-black/[0.06] dark:bg-white/[0.07]" />
          </div>

          <div className="mt-8 h-44 rounded-xl bg-black/[0.04] dark:bg-white/[0.05]" />
        </div>

        {/* Leave */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="h-5 w-28 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="mt-2 h-3 w-40 rounded bg-black/[0.05] dark:bg-white/[0.06]" />

          <div className="mt-8 flex items-center justify-center">
            <div className="h-36 w-36 rounded-full border-[18px] border-black/[0.06] dark:border-white/[0.07]" />
          </div>

          <div className="mt-8 space-y-3">
            <div className="h-3 w-full rounded bg-black/[0.05] dark:bg-white/[0.06]" />
            <div className="h-3 w-4/5 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Requests */}
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
            <div className="h-5 w-40 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-52 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>

          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="space-y-2">
                  <div className="h-3.5 w-44 rounded bg-black/[0.07] dark:bg-white/[0.08]" />
                  <div className="h-2.5 w-28 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
                </div>

                <div className="h-6 w-20 rounded-full bg-black/[0.06] dark:bg-white/[0.07]" />
              </div>
            ))}
          </div>
        </div>

        {/* Notices */}
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
            <div className="h-5 w-32 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-44 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>

          <div className="space-y-5 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-3.5 w-4/5 rounded bg-black/[0.07] dark:bg-white/[0.08]" />
                <div className="h-2.5 w-full rounded bg-black/[0.05] dark:bg-white/[0.06]" />
                <div className="h-2.5 w-3/5 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI CTA */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-[#201f1d]">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="h-5 w-44 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="h-3 w-72 max-w-full rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>

          <div className="hidden h-10 w-28 rounded-xl bg-black/[0.07] dark:bg-white/[0.08] sm:block" />
        </div>
      </div>
    </div>
  );
}