export default function LeaveSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.06] dark:bg-[#201f1d]"
          >
            <div className="h-3 w-20 rounded bg-black/[0.07] dark:bg-white/[0.08]" />
            <div className="mt-4 h-8 w-16 rounded-lg bg-black/[0.08] dark:bg-white/[0.09]" />
            <div className="mt-3 h-2.5 w-28 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-8 xl:grid-cols-[1.5fr_0.7fr]">

        {/* Leave history */}
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
            <div className="h-5 w-32 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-48 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
          </div>

          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="grid gap-4 px-6 py-5 sm:grid-cols-5 sm:items-center"
              >
                <div className="space-y-2">
                  <div className="h-3.5 w-20 rounded bg-black/[0.07] dark:bg-white/[0.08]" />
                  <div className="h-2.5 w-28 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
                </div>

                <div className="h-3 w-24 rounded bg-black/[0.06] dark:bg-white/[0.07]" />

                <div className="h-3 w-28 rounded bg-black/[0.06] dark:bg-white/[0.07]" />

                <div className="h-6 w-20 rounded-full bg-black/[0.07] dark:bg-white/[0.08]" />

                <div className="h-3 w-20 rounded bg-black/[0.05] dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>

        {/* Apply leave */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-[#201f1d]">
          <div className="h-5 w-28 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="mt-2 h-3 w-48 rounded bg-black/[0.05] dark:bg-white/[0.06]" />

          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-2 h-3 w-20 rounded bg-black/[0.06] dark:bg-white/[0.07]" />
              <div className="h-11 w-full rounded-xl bg-black/[0.06] dark:bg-white/[0.07]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div>
                <div className="mb-2 h-3 w-20 rounded bg-black/[0.06] dark:bg-white/[0.07]" />
                <div className="h-11 w-full rounded-xl bg-black/[0.06] dark:bg-white/[0.07]" />
              </div>

              <div>
                <div className="mb-2 h-3 w-20 rounded bg-black/[0.06] dark:bg-white/[0.07]" />
                <div className="h-11 w-full rounded-xl bg-black/[0.06] dark:bg-white/[0.07]" />
              </div>
            </div>

            <div>
              <div className="mb-2 h-3 w-20 rounded bg-black/[0.06] dark:bg-white/[0.07]" />
              <div className="h-24 w-full rounded-xl bg-black/[0.06] dark:bg-white/[0.07]" />
            </div>

            <div className="h-11 w-full rounded-xl bg-black/[0.08] dark:bg-white/[0.09]" />
          </div>
        </div>
      </div>
    </div>
  );
}