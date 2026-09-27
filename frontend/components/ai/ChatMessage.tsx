"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FeedbackButtons from "@/components/assistant/FeedbackButtons";
import type { ChatMessage as ChatMessageType } from "@/types/assistant";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const response = message.response;

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[80%] rounded-2xl rounded-br-md bg-[#242321] px-5 py-3.5 text-sm leading-7 text-white dark:bg-[#f1eee7] dark:text-[#242321]"
            : "w-full max-w-4xl"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="hr365-markdown text-[15px] leading-7 text-black/80 dark:text-white/80">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-5 mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    {children}
                  </h1>
                ),

                h2: ({ children }) => (
                  <h2 className="mb-4 mt-7 text-xl font-semibold tracking-[-0.025em]">
                    {children}
                  </h2>
                ),

                h3: ({ children }) => (
                  <h3 className="mb-3 mt-6 text-base font-semibold">
                    {children}
                  </h3>
                ),

                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),

                ul: ({ children }) => (
                  <ul className="mb-5 ml-5 list-disc space-y-2">
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol className="mb-5 ml-5 list-decimal space-y-2">
                    {children}
                  </ol>
                ),

                li: ({ children }) => (
                  <li className="pl-1">{children}</li>
                ),

                strong: ({ children }) => (
                  <strong className="font-semibold text-black dark:text-white">
                    {children}
                  </strong>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="my-5 border-l-2 border-black/20 pl-4 text-black/60 dark:border-white/20 dark:text-white/60">
                    {children}
                  </blockquote>
                ),

                code: ({ children, className }) => {
                  const isBlock = Boolean(className);

                  return isBlock ? (
                    <code
                      className={`${className} block overflow-x-auto rounded-xl bg-black/[0.04] p-4 text-[13px] leading-6 dark:bg-white/[0.06]`}
                    >
                      {children}
                    </code>
                  ) : (
                    <code className="rounded-md bg-black/[0.06] px-1.5 py-0.5 font-mono text-[13px] dark:bg-white/[0.08]">
                      {children}
                    </code>
                  );
                },

                pre: ({ children }) => (
                  <pre className="mb-5 overflow-x-auto rounded-xl">
                    {children}
                  </pre>
                ),

                table: ({ children }) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
                    <table className="w-full min-w-[600px] border-collapse text-sm">
                      {children}
                    </table>
                  </div>
                ),

                thead: ({ children }) => (
                  <thead className="bg-black/[0.035] dark:bg-white/[0.05]">
                    {children}
                  </thead>
                ),

                th: ({ children }) => (
                  <th className="border-b border-black/[0.08] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60 dark:border-white/[0.08] dark:text-white/60">
                    {children}
                  </th>
                ),

                td: ({ children }) => (
                  <td className="border-b border-black/[0.06] px-4 py-3 align-top dark:border-white/[0.06]">
                    {children}
                  </td>
                ),

                hr: () => (
                  <hr className="my-7 border-black/[0.08] dark:border-white/[0.08]" />
                ),

                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* AI metadata */}
        {!isUser && response && (
          <div className="mt-6 space-y-4">
            {/* Confidence */}
            {response.confidence && (
              <div className="flex items-center gap-2 text-xs text-black/45 dark:text-white/40">
                <span className="font-medium">
                  Confidence
                </span>

                <span className="capitalize">
                  {response.confidence.level}
                </span>

                <span>·</span>

                <span>
                  {Math.round(response.confidence.score * 100)}%
                </span>
              </div>
            )}

            {/* Escalation */}
            {response.escalation_required && (
              <div className="rounded-xl border border-[#d97757]/20 bg-[#d97757]/[0.06] px-4 py-3 text-sm">
                <p className="font-medium text-[#b85c3e]">
                  HR review required
                </p>

                {response.escalation_reason && (
                  <p className="mt-1 text-xs leading-5 text-black/55 dark:text-white/50">
                    {response.escalation_reason}
                  </p>
                )}

                {response.hr_ticket_id && (
                  <p className="mt-2 text-xs text-black/45 dark:text-white/40">
                    Ticket: {response.hr_ticket_id}
                  </p>
                )}
              </div>
            )}

            {/* Sources */}
            {response.sources?.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-black/45 transition-colors hover:text-black/70 dark:text-white/40 dark:hover:text-white/70">
                  {response.sources.length} source
                  {response.sources.length !== 1 ? "s" : ""}
                </summary>

                <div className="mt-3 space-y-2">
                  {response.sources.map((source, index) => (
                    <div
                      key={`${source.source ?? source.filename ?? "source"}-${index}`}
                      className="rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-2.5 text-xs dark:border-white/[0.06] dark:bg-white/[0.02]"
                    >
                      <div className="font-medium text-black/70 dark:text-white/70">
                        {source.source ?? source.filename ?? "Reference"}
                      </div>

                      {typeof source.score === "number" && (
                        <div className="mt-1 text-black/40 dark:text-white/35">
                          Relevance: {Math.round(source.score * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Feedback */}
            <FeedbackButtons
            message={message}
            />
          </div>
        )}
      </div>
    </div>
  );
}