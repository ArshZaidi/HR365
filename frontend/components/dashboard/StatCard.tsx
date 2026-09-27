interface StatCardProps {
  label: string;
  value: string;
  description: string;
}

export default function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}