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
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div>
        <p className="text-sm font-medium text-gray-900">
          Recent activity
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Your latest HR activity
        </p>
      </div>

      <div className="mt-5 divide-y divide-gray-100">
        {activities.length === 0 ? (
          <p className="py-4 text-sm text-gray-400">
            No recent activity.
          </p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={`${activity.title}-${index}`}
              className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500" />

              <div className="min-w-0">
                <p className="text-sm text-gray-800">
                  {activity.title}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {activity.description}
                </p>

                <p className="mt-1 text-[11px] text-gray-400">
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