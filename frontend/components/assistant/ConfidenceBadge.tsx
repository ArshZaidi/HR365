import { Confidence } from "@/types/assistant";

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

export default function ConfidenceBadge({
  confidence,
}: ConfidenceBadgeProps) {
  const level = confidence.level.toLowerCase();

  const variant =
    level === "high"
      ? { bg: "var(--success-soft)", fg: "var(--success)" }
      : level === "medium"
        ? { bg: "var(--warning-soft)", fg: "var(--warning)" }
        : { bg: "var(--danger-soft)", fg: "var(--danger)" };

  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-semibold tracking-[0.01em]"
      style={{ background: variant.bg, color: variant.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      Confidence {label}
      <span className="opacity-70">
        {Math.round(confidence.score * 100)}%
      </span>
    </div>
  );
}