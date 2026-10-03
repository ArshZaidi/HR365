import { FileText } from "lucide-react";
import { Source } from "@/types/assistant";

interface SourceCitationProps {
  sources: Source[];
}

export default function SourceCitation({
  sources,
}: SourceCitationProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <details className="mt-5 group">
      <summary className="cursor-pointer list-none text-[11.5px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase transition-colors duration-200 hover:text-[var(--foreground)]">
        {sources.length} source{sources.length !== 1 ? "s" : ""}
      </summary>

      <div className="mt-3 space-y-2">
        {sources.map((source, index) => {
          const filename =
            source.source || source.filename || `Source ${index + 1}`;

          return (
            <div
              key={`${filename}-${index}`}
              className="
                flex items-center gap-3 rounded-xl
                border border-[var(--border)]
                bg-[var(--surface)]/40 px-3 py-2.5 backdrop-blur-xl
              "
            >
              <span
                className="
                  flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                  text-[var(--accent-3)]
                "
                style={{ background: "var(--accent-3-soft)" }}
              >
                <FileText size={13} />
              </span>

              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                {filename}
              </span>

              {typeof source.score === "number" && (
                <span className="shrink-0 text-[11px] font-medium text-[var(--muted)] tabular-nums">
                  {Math.round(source.score * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}