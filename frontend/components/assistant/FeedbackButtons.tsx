"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ChatMessage } from "@/types/assistant";

interface FeedbackButtonsProps {
  message: ChatMessage;
  question?: string;
}

export default function FeedbackButtons({
  message,
  question = "HR365 assistant response",
}: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<
    "positive" | "negative" | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (rating: "positive" | "negative") => {
    if (loading || selected || !message.response) return;

    setLoading(true);
    setStatus("");

    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          question,
          answer: message.content,
          rating,
          confidence_score: message.response.confidence?.score ?? null,
          confidence_level:
            message.response.confidence?.level ?? null,
          sources: message.response.sources ?? [],
        }),
      });

      setSelected(rating);
      setStatus(
        rating === "positive"
          ? "Thanks — glad this helped."
          : "Thanks — your feedback has been recorded."
      );
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Unable to record feedback.";

      setStatus(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => submit("positive")}
          disabled={loading || !!selected}
          aria-label="Helpful"
          className={`
            flex h-9 w-9 items-center justify-center rounded-lg
            border transition-all
            ${
              selected === "positive"
                ? "border-black/15 bg-black/[0.06] text-black dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
                : "border-transparent text-black/35 hover:border-black/[0.08] hover:bg-black/[0.04] hover:text-black/65 dark:text-white/35 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.04] dark:hover:text-white/65"
            }
            disabled:cursor-not-allowed
            disabled:opacity-50
          `}
        >
          <span className="text-lg">♧</span>
        </button>

        <button
          type="button"
          onClick={() => submit("negative")}
          disabled={loading || !!selected}
          aria-label="Not helpful"
          className={`
            flex h-9 w-9 items-center justify-center rounded-lg
            border transition-all
            ${
              selected === "negative"
                ? "border-black/15 bg-black/[0.06] text-black dark:border-white/15 dark:bg-white/[0.08] dark:text-white"
                : "border-transparent text-black/35 hover:border-black/[0.08] hover:bg-black/[0.04] hover:text-black/65 dark:text-white/35 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.04] dark:hover:text-white/65"
            }
            disabled:cursor-not-allowed
            disabled:opacity-50
          `}
        >
          <span className="text-lg rotate-180">♧</span>
        </button>
      </div>

      {status && (
        <p className="text-xs text-black/40 dark:text-white/40">
          {status}
        </p>
      )}
    </div>
  );
}