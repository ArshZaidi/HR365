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
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] transition-shadow duration-300 ease-[var(--ease-out-soft)] hover:shadow-[var(--shadow-sm)]">
      <p className="text-[12.5px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
        {label}
      </p>

      <p className="mt-4 text-[2rem] leading-none font-medium tracking-[-0.035em] tabular-nums text-[var(--foreground)]">
        {value}
      </p>

      <p className="mt-2.5 text-[13px] text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}