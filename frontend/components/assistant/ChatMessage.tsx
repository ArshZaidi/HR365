"use client";

import { Sparkles } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types/assistant";
import ConfidenceBadge from "./ConfidenceBadge";
import SourceCitation from "./SourceCitation";
import EscalationCard from "./EscalationCard";
import FeedbackButtons from "./FeedbackButtons";

interface ChatMessageProps {
  message: ChatMessageType;
  question?: string;
}

export default function ChatMessage({
  message,
  question,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--foreground)] px-4 py-3 text-sm leading-6 text-[var(--background)]">
          {message.content}
        </div>
      </div>
    );
  }

  const response = message.response;

  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--foreground)] text-[var(--background)]">
        <Sparkles size={15} />
      </div>

      <div className="min-w-0 max-w-3xl pt-1">
        <p className="mb-2 text-xs font-medium text-[var(--muted)]">
          HR365
        </p>

        <div className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--foreground)]">
          {message.content}
        </div>

        {response?.confidence && (
          <div className="mt-4">
            <ConfidenceBadge
              confidence={response.confidence}
            />
          </div>
        )}

        {response?.sources && (
          <SourceCitation
            sources={response.sources}
          />
        )}

        {response?.escalation_required && (
          <EscalationCard
            reason={response.escalation_reason}
            ticketId={response.hr_ticket_id}
          />
        )}

        {question && (
          <FeedbackButtons
            question={question}
            message={message}
          />
        )}
      </div>
    </div>
  );
}