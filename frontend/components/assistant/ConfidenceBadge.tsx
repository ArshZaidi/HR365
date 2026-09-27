import { Confidence } from "@/types/assistant";

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export default function ConfidenceBadge({
  confidence,
}: ConfidenceBadgeProps) {
  const level = confidence.level.toLowerCase();

  const styles =
    level === "high"
      ? "bg-emerald-500/10 text-emerald-600"
      : level === "medium"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-red-500/10 text-red-600";

  const label =
    level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      Confidence {label}

      <span className="opacity-60">
        {Math.round(confidence.score * 100)}%
      </span>
    </div>
  );
}