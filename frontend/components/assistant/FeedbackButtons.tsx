"use client";

import { useState } from "react";
import {
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { ChatMessage } from "@/types/assistant";

interface FeedbackButtonsProps {
  question: string;
  message: ChatMessage;
}

export default function FeedbackButtons({
  question,
  message,
}: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<
    "positive" | "negative" | null
  >(null);

  const [loading, setLoading] = useState(false);

  async function submit(
    rating: "positive" | "negative"
  ) {
    if (
      selected ||
      loading ||
      !message.response
    ) {
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          question,
          answer: message.content,
          rating,
          confidence_score:
            message.response.confidence?.score ?? null,
          confidence_level:
            message.response.confidence?.level ?? null,
          sources:
            message.response.sources ?? [],
        }),
      });

      setSelected(rating);
    } catch {
      // Feedback failure should not interrupt chat.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-1">
      <button
        type="button"
        disabled={!!selected || loading}
        onClick={() => submit("positive")}
        className={`rounded-lg p-2 transition ${
          selected === "positive"
            ? "bg-emerald-500/10 text-emerald-600"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <ThumbsUp size={14} />
      </button>

      <button
        type="button"
        disabled={!!selected || loading}
        onClick={() => submit("negative")}
        className={`rounded-lg p-2 transition ${
          selected === "negative"
            ? "bg-red-500/10 text-red-600"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <ThumbsDown size={14} />
      </button>

      {selected && (
        <span className="ml-2 text-[10px] text-[var(--muted)]">
          Thanks for the feedback
        </span>
      )}
    </div>
  );
}