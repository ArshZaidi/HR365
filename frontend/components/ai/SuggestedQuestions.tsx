"use client";

const questions = [
  "What is the remote work policy?",
  "How many leave days have I used?",
  "What is my attendance percentage?",
  "How do I raise an HR request?",
  "What benefits are available?",
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="mt-8">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Try asking
      </p>

      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}