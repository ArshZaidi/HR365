"use client";

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

      <div className="min-w-0 max-w-3xl flex-1 pt-1">

        <p className="mb-3 text-xs font-medium text-[var(--muted)]">
          HR365
        </p>

        <div className="hr-markdown text-[15px] leading-7 text-[var(--foreground)]">

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-6 text-2xl font-medium tracking-[-0.035em] first:mt-0">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mb-3 mt-6 text-xl font-medium tracking-[-0.03em] first:mt-0">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-2 mt-5 text-base font-medium">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-4 last:mb-0">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="mb-4 ml-5 list-disc space-y-1.5">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-4 ml-5 list-decimal space-y-1.5">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="pl-1">
                  {children}
                </li>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold">
                  {children}
                </strong>
              ),

              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-2 border-[var(--border)] pl-4 text-[var(--muted)]">
                  {children}
                </blockquote>
              ),

              table: ({ children }) => (
                <div className="my-5 overflow-x-auto rounded-xl border border-[var(--border)]">
                  <table className="w-full min-w-[500px] border-collapse text-sm">
                    {children}
                  </table>
                </div>
              ),

              thead: ({ children }) => (
                <thead className="bg-[var(--surface-hover)]">
                  {children}
                </thead>
              ),

              th: ({ children }) => (
                <th className="border-b border-[var(--border)] px-4 py-3 text-left text-xs font-medium">
                  {children}
                </th>
              ),

              td: ({ children }) => (
                <td className="border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] last:border-0">
                  {children}
                </td>
              ),

              code: ({ children }) => (
                <code className="rounded-md bg-[var(--surface-hover)] px-1.5 py-0.5 text-[0.9em]">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

        </div>

        {response?.confidence && (
          <div className="mt-5">
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