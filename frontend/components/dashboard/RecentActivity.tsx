interface Activity {
  title: string;
  description: string;
  date: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-sm)]">
      <div>
        <p className="text-[15px] font-medium text-[var(--foreground)]">
          Recent activity
        </p>

        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          Your latest HR activity
        </p>
      </div>

      <div className="mt-6 divide-y divide-[var(--border)]">
        {activities.length === 0 ? (
          <p className="py-4 text-[14px] text-[var(--muted)]">
            No recent activity.
          </p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={`${activity.title}-${index}`}
              className="flex items-start gap-3.5 py-5 first:pt-0 last:pb-0"
            >
              <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" />

              <div className="min-w-0">
                <p className="text-[14.5px] font-medium text-[var(--foreground)]">
                  {activity.title}
                </p>

                <p className="mt-1.5 text-[13px] text-[var(--muted)]">
                  {activity.description}
                </p>

                <p className="mt-1.5 text-[11.5px] font-medium text-[var(--muted)]">
                  {activity.date}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}