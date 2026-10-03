"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatMessage as ChatMessageType } from "@/types/assistant";

import ConfidenceBadge from "@/components/assistant/ConfidenceBadge";
import SourceCitation from "@/components/assistant/SourceCitation";
import EscalationCard from "@/components/assistant/EscalationCard";
import FeedbackButtons from "@/components/assistant/FeedbackButtons";

interface ChatMessageProps {
  message: ChatMessageType;
  question?: string;
}

/* ================================================================
   CODE BLOCK — with copy button
================================================================ */

function CodeBlock({
  children,
  language,
}: {
  children: React.ReactNode;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="group/code relative my-5 overflow-hidden rounded-xl border border-[var(--border)]">
      {/* Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-hover)]/60 px-3.5 py-2">
        <span className="text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="
            inline-flex items-center gap-1.5 rounded-md px-2 py-1
            text-[11px] font-medium text-[var(--muted)]
            transition-colors duration-200 ease-[var(--ease-out-soft)]
            hover:bg-[var(--surface)]/60 hover:text-[var(--foreground)]
          "
        >
          {copied ? (
            <>
              <Check size={11} />
              Copied
            </>
          ) : (
            <>
              <Copy size={11} />
              Copy
            </>
          )}
        </button>
      </div>

      <pre
        className="
          overflow-x-auto bg-[var(--surface-hover)]/25
          p-4 text-[12.5px] leading-6
        "
      >
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

/* ================================================================
   CHAT MESSAGE
================================================================ */

export default function ChatMessage({
  message,
  question,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  /* ─── User bubble ─── */
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
                /* ─── Headings (Claude-style serif) ─── */
                h1: ({ children }) => (
                  <h1 className="font-display mt-6 mb-4 text-[1.5rem] leading-tight font-medium tracking-[-0.03em] first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display mt-6 mb-3 text-[1.3rem] leading-tight font-medium tracking-[-0.025em] first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-5 mb-2 text-[15.5px] font-semibold tracking-[-0.005em]">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="mt-4 mb-1.5 text-[14px] font-semibold tracking-[0.01em] text-[var(--foreground-soft)] uppercase">
                    {children}
                  </h4>
                ),

                /* ─── Body ─── */
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),

                /* ─── Lists ─── */
                ul: ({ children }) => (
                  <ul className="mb-4 ml-5 list-disc space-y-1.5 marker:text-[var(--accent-2)]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 ml-5 list-decimal space-y-1.5 marker:font-semibold marker:text-[var(--accent-2)]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="pl-1.5 leading-[1.7]">{children}</li>
                ),

                /* ─── Emphasis ─── */
                strong: ({ children }) => (
                  <strong className="font-semibold text-[var(--foreground)]">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-[var(--foreground-soft)] italic">
                    {children}
                  </em>
                ),

                /* ─── Link ─── */
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      font-medium underline underline-offset-4
                      transition-opacity duration-200 hover:opacity-80
                    "
                    style={{ color: "var(--accent-2)" }}
                  >
                    {children}
                  </a>
                ),

                /* ─── Blockquote ─── */
                blockquote: ({ children }) => (
                  <blockquote
                    className="
                      my-5 rounded-r-lg border-l-[3px] py-1 pl-4 pr-3
                      text-[var(--foreground-soft)] italic
                    "
                    style={{
                      borderColor: "var(--accent-2)",
                      background: "var(--accent-2-soft)",
                    }}
                  >
                    {children}
                  </blockquote>
                ),

                /* ─── Divider ─── */
                hr: () => (
                  <hr
                    className="my-6 h-px border-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--border-strong) 50%, transparent)",
                    }}
                  />
                ),

                /* ─── Code ─── */
                code: ({ children, className }) => {
                  const isBlock = Boolean(className);
                  const language = className?.replace("language-", "");

                  if (isBlock) {
                    return (
                      <CodeBlock language={language}>{children}</CodeBlock>
                    );
                  }

                  return (
                    <code
                      className="
                        rounded-md px-1.5 py-0.5 font-mono
                        text-[0.9em] text-[var(--foreground)]
                      "
                      style={{ background: "var(--surface-hover)" }}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,

                /* ─── Table ─── */
                table: ({ children }) => (
                  <div className="my-5 overflow-hidden rounded-xl border border-[var(--border)] shadow-[var(--shadow-xs)]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
                        {children}
                      </table>
                    </div>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[var(--surface-hover)]/70">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="[&>tr:nth-child(even)]:bg-[var(--surface-hover)]/25">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-[var(--border)] last:border-0 transition-colors duration-150 hover:bg-[var(--surface-hover)]/40">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="border-b border-[var(--border)] px-4 py-3 text-left text-[11px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-r border-[var(--border)] px-4 py-3 align-top text-[var(--foreground)] last:border-r-0">
                    {children}
                  </td>
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