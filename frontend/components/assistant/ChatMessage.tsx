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
        <div
          className="
            max-w-[82%] rounded-2xl rounded-br-md
            px-4 py-3 text-[14.5px] leading-6 text-white
            shadow-[0_8px_24px_-12px_rgba(210,105,74,0.55)]
          "
          style={{
            background:
              "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const response = message.response;

  return (
    <div className="flex gap-3.5">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
          boxShadow:
            "0 8px 20px -8px rgba(23,22,20,0.3), inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        <Sparkles size={15} />
      </span>

      <div className="min-w-0 max-w-3xl flex-1">
        <p className="mb-2.5 text-[11.5px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
          HR365
        </p>

        <div
          className="
            rounded-2xl rounded-tl-md
            border border-[var(--glass-border)]
            bg-[var(--glass-bg)] backdrop-blur-2xl
            p-5 sm:p-6
            shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
          "
        >
          <div className="hr-markdown text-[14.5px] leading-[1.75] text-[var(--foreground)]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display mt-6 mb-4 text-[1.5rem] leading-tight font-medium tracking-[-0.03em] first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display mt-6 mb-3 text-[1.25rem] leading-tight font-medium tracking-[-0.025em] first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-5 mb-2 text-[15.5px] font-semibold">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
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
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-2 border-[var(--accent-2)] pl-4 text-[var(--muted)]">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-5 overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full min-w-[500px] border-collapse text-[13.5px]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[var(--surface-hover)]/60">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="border-b border-[var(--border)] px-4 py-3 text-left text-[11.5px] font-semibold tracking-[0.05em] uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-b border-[var(--border)] px-4 py-3 text-[13.5px] text-[var(--muted)] last:border-0">
                    {children}
                  </td>
                ),
                code: ({ children }) => (
                  <code className="rounded-md bg-[var(--surface-hover)]/80 px-1.5 py-0.5 text-[0.92em]">
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
              <ConfidenceBadge confidence={response.confidence} />
            </div>
          )}

          {response?.sources && <SourceCitation sources={response.sources} />}

          {response?.escalation_required && (
            <EscalationCard
              reason={response.escalation_reason}
              ticketId={response.hr_ticket_id}
            />
          )}

          {question && (
            <FeedbackButtons question={question} message={message} />
          )}
        </div>
      </div>
    </div>
  );
}