"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";

import { IconChip, type Tone } from "@/components/ui/premium";

const questions: {
  text: string;
  title: string;
  description: string;
  tone: Tone;
  icon: React.ReactNode;
}[] = [
  {
    text: "What is the remote work policy?",
    title: "Remote work",
    description: "Learn how the company handles working remotely",
    tone: 2,
    icon: <Sparkles size={16} />,
  },
  {
    text: "How many leave days have I used?",
    title: "My leave",
    description: "See your used and remaining leave balance",
    tone: 4,
    icon: <Clock3 size={16} />,
  },
  {
    text: "What is my attendance percentage?",
    title: "My attendance",
    description: "Check your current attendance percentage",
    tone: 3,
    icon: <CalendarDays size={16} />,
  },
  {
    text: "How do I raise an HR request?",
    title: "Raise a request",
    description: "Steps to submit a new HR request",
    tone: 5,
    icon: <FileText size={16} />,
  },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="mt-10 w-full max-w-3xl">
      <p className="mb-3.5 text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        Try asking
      </p>

      <div className="grid gap-3 text-left sm:grid-cols-2">
        {questions.map((q) => (
          <button
            key={q.text}
            type="button"
            onClick={() => onSelect(q.text)}
            className="
              group relative overflow-hidden rounded-2xl
              border border-[var(--glass-border)]
              bg-[var(--glass-bg)] backdrop-blur-2xl
              p-4
              shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-xs)]
              transition-all duration-300 ease-[var(--ease-out-soft)]
              hover:-translate-y-1
              hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
            "
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-[0.14] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.26]"
              style={{ background: `var(--accent-${q.tone})` }}
            />

            <div className="relative flex items-start gap-3.5">
              <IconChip tone={q.tone} size="sm" interactive>
                {q.icon}
              </IconChip>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold tracking-[-0.005em]">
                    {q.title}
                  </p>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-[var(--muted)] transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>

                <p className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">
                  {q.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}