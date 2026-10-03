"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

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
          confidence_level: message.response.confidence?.level ?? null,
          sources: message.response.sources ?? [],
        }),
      });

      setSelected(rating);
      setStatus(
        rating === "positive"
          ? "Thanks — glad this helped."
          : "Thanks — your feedback has been recorded.",
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

  const baseBtn = [
    "flex h-8 w-8 items-center justify-center rounded-lg",
    "transition-all duration-300 ease-[var(--ease-out-soft)]",
    "disabled:cursor-not-allowed disabled:opacity-40",
  ].join(" ");

  const idle =
    "text-[var(--muted)] hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]";

  return (
    <div className="mt-5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => submit("positive")}
          disabled={loading || !!selected}
          aria-label="Helpful"
          className={`${baseBtn} ${
            selected === "positive" ? "" : idle
          }`}
          style={
            selected === "positive"
              ? {
                  background: "var(--success-soft)",
                  color: "var(--success)",
                }
              : undefined
          }
        >
          <ThumbsUp size={14} />
        </button>

        <button
          type="button"
          onClick={() => submit("negative")}
          disabled={loading || !!selected}
          aria-label="Not helpful"
          className={`${baseBtn} ${
            selected === "negative" ? "" : idle
          }`}
          style={
            selected === "negative"
              ? {
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                }
              : undefined
          }
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {status && (
        <p className="text-[11.5px] text-[var(--muted)]">{status}</p>
      )}
    </div>
  );
}