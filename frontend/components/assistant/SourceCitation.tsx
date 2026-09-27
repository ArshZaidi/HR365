import { FileText } from "lucide-react";
import { Source } from "@/types/assistant";

interface SourceCitationProps {
  sources: Source[];
}

export default function SourceCitation({
  sources,
}: SourceCitationProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        Sources
      </p>

      <div className="space-y-2">
        {sources.map((source, index) => {
          const filename =
            source.source ||
            source.filename ||
            `Source ${index + 1}`;

          return (
            <div
              key={`${filename}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-hover)]">
                <FileText size={13} />
              </div>

              <span className="min-w-0 flex-1 truncate text-xs">
                {filename}
              </span>

              {typeof source.score === "number" && (
                <span className="text-[10px] text-[var(--muted)]">
                  {Math.round(source.score * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}