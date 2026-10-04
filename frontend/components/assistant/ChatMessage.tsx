"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type {
  ChatMessage as ChatMessageType,
  Source,
} from "@/types/assistant";

import FeedbackButtons from "@/components/assistant/FeedbackButtons";

interface ChatMessageProps {
  message: ChatMessageType;
  question?: string;
}

/* ================================================================
   CODE BLOCK
================================================================ */

function CodeBlock({
  children,
  language,
}: {
  children: React.ReactNode;
  language?: string;
}) {
  const [copied, setCopied] =
    useState(false);

  const handleCopy = async () => {
    const text =
      String(children).replace(
        /\n$/,
        "",
      );

    try {
      await navigator.clipboard.writeText(
        text,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className="group/code relative my-5 overflow-hidden rounded-xl border border-[var(--border)]">
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
            transition-colors duration-200
            hover:bg-[var(--surface)]/60
            hover:text-[var(--foreground)]
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
        <code className="font-mono">
          {children}
        </code>
      </pre>
    </div>
  );
}

/* ================================================================
   CONFIDENCE PANEL
================================================================ */

function ConfidencePanel({
  confidence,
}: {
  confidence: NonNullable<
    ChatMessageType["response"]
  >["confidence"];
}) {
  if (!confidence) {
    return null;
  }

  const level =
    confidence.level
      ?.toLowerCase() || "low";

  const percentage = Math.round(
    Math.max(
      0,
      Math.min(
        1,
        confidence.score,
      ),
    ) * 100,
  );

  const config =
    level === "high"
      ? {
          label: "High confidence",
          description:
            "Strong supporting evidence was found in the available HR information.",
          color:
            "var(--success)",
          soft:
            "var(--success-soft)",
        }
      : level === "medium"
        ? {
            label: "Moderate confidence",
            description:
              "The answer is supported by relevant HR information, but some uncertainty remains.",
            color:
              "var(--warning)",
            soft:
              "var(--warning-soft)",
          }
        : {
            label: "Low confidence",
            description:
              "Limited supporting information was found for this question.",
            color:
              "var(--danger)",
            soft:
              "var(--danger-soft)",
          };

  return (
    <div
      className="
        mt-5 rounded-xl border
        px-3.5 py-3.5
      "
      style={{
        borderColor:
          `color-mix(in srgb, ${config.color} 22%, var(--border))`,
        background:
          `color-mix(in srgb, ${config.soft} 48%, transparent)`,
      }}
    >
      {/* Header */}

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="
              flex h-7 w-7 shrink-0
              items-center justify-center
              rounded-lg
            "
            style={{
              background:
                config.soft,
              color:
                config.color,
            }}
          >
            <Sparkles size={13} />
          </span>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase">
              AI confidence
            </p>

            <p
              className="mt-0.5 text-[12px] font-semibold"
              style={{
                color:
                  config.color,
              }}
            >
              {config.label}
            </p>
          </div>
        </div>

        <span
          className="
            shrink-0
            text-[17px]
            font-semibold
            tracking-[-0.03em]
            tabular-nums
          "
          style={{
            color:
              config.color,
          }}
        >
          {percentage}%
        </span>
      </div>

      {/* Confidence bar */}

      <div
        className="
          mt-3 h-1.5
          overflow-hidden
          rounded-full
        "
        style={{
          background:
            `color-mix(in srgb, ${config.color} 12%, var(--border))`,
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background:
              `linear-gradient(90deg, ${config.color}, color-mix(in srgb, ${config.color} 65%, white))`,
          }}
        />
      </div>

      {/* Explanation */}

      <p className="mt-2.5 text-[10.5px] leading-5 text-[var(--muted)]">
        {config.description}
      </p>
    </div>
  );
}

/* ================================================================
   SOURCE DISCLOSURE
================================================================ */

function SourceDisclosure({
  sources,
}: {
  sources: Source[];
}) {
  const [open, setOpen] =
    useState(false);

  const uniqueSources =
    Array.from(
      new Map(
        sources
          .map((source) => {
            const name =
              source.source ||
              source.filename ||
              source.chunk ||
              "HR365 reference";

            return [
              name,
              source,
            ] as const;
          })
          .filter(
            ([name]) =>
              Boolean(name),
          ),
      ).values(),
    );

  if (!uniqueSources.length) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="
          flex w-full items-center
          justify-between
          text-left
          text-[11px]
          font-semibold
          tracking-[0.1em]
          text-[var(--muted)]
          uppercase
          transition-colors
          hover:text-[var(--foreground)]
        "
        aria-expanded={open}
      >
        <span>
          {uniqueSources.length}{" "}
          {uniqueSources.length === 1
            ? "supporting source"
            : "supporting sources"}
        </span>

        <ChevronDown
          size={14}
          className={[
            "transition-transform duration-200",
            open
              ? "rotate-180"
              : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {uniqueSources.map(
            (source, index) => {
              const filename =
                source.source ||
                source.filename ||
                `Source ${index + 1}`;

              return (
                <div
                  key={`${filename}-${index}`}
                  className="
                    flex items-center
                    gap-3 rounded-xl
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]/40
                    px-3 py-2.5
                  "
                >
                  <span
                    className="
                      flex h-7 w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                    "
                    style={{
                      background:
                        "var(--accent-3-soft)",
                      color:
                        "var(--accent-3)",
                    }}
                  >
                    <FileText size={13} />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                    {filename}
                  </span>

                  {typeof source.score ===
                    "number" && (
                    <span className="shrink-0 text-[10px] text-[var(--muted)] tabular-nums">
                      {Math.round(
                        source.score *
                          100,
                      )}
                      %
                    </span>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   ESCALATION
================================================================ */

function EscalationNotice({
  reason,
}: {
  reason?: string | null;
}) {
  return (
    <div
      className="
        mt-5 flex items-start
        gap-3 rounded-xl
        border px-3.5 py-3
      "
      style={{
        borderColor:
          "color-mix(in srgb, var(--warning) 24%, var(--border))",
        background:
          "color-mix(in srgb, var(--warning-soft) 55%, transparent)",
      }}
    >
      <span
        className="
          mt-0.5 flex h-7 w-7
          shrink-0 items-center
          justify-center rounded-lg
        "
        style={{
          background:
            "var(--warning-soft)",
          color:
            "var(--warning)",
        }}
      >
        <ShieldAlert size={14} />
      </span>

      <div className="min-w-0">
        <p className="text-[12px] font-semibold">
          HR review recommended
        </p>

        <p className="mt-0.5 text-[11.5px] leading-5 text-[var(--muted)]">
          {reason ||
            "This question has been referred to HR for review."}
        </p>
      </div>
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
  const isUser =
    message.role === "user";

  /* ==============================================================
     USER
  ============================================================== */

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="
            max-w-[82%]
            rounded-2xl rounded-br-md
            px-4 py-3
            text-[14.5px]
            leading-6
            text-white
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

  /* ==============================================================
     ASSISTANT
  ============================================================== */

  const response =
    message.response;

  return (
    <div className="flex gap-3.5">
      {/* AI icon */}

      <span
        className="
          mt-0.5 flex h-9 w-9
          shrink-0 items-center
          justify-center rounded-xl
          text-white
        "
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
            bg-[var(--glass-bg)]
            backdrop-blur-2xl
            p-5 sm:p-6
            shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
          "
        >
          {/* ======================================================
              ANSWER
          ====================================================== */}

          <div
            className="
              hr-markdown
              text-[14.5px]
              leading-[1.75]
              text-[var(--foreground)]
            "
          >
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
              ]}
              components={{
                h1: ({
                  children,
                }) => (
                  <h1 className="font-display mt-6 mb-4 text-[1.5rem] leading-tight font-medium tracking-[-0.03em] first:mt-0">
                    {children}
                  </h1>
                ),

                h2: ({
                  children,
                }) => (
                  <h2 className="font-display mt-6 mb-3 text-[1.3rem] leading-tight font-medium tracking-[-0.025em] first:mt-0">
                    {children}
                  </h2>
                ),

                h3: ({
                  children,
                }) => (
                  <h3 className="mt-5 mb-2 text-[15.5px] font-semibold">
                    {children}
                  </h3>
                ),

                h4: ({
                  children,
                }) => (
                  <h4 className="mt-4 mb-1.5 text-[14px] font-semibold tracking-[0.01em] text-[var(--foreground-soft)] uppercase">
                    {children}
                  </h4>
                ),

                p: ({
                  children,
                }) => (
                  <p className="mb-4 last:mb-0">
                    {children}
                  </p>
                ),

                ul: ({
                  children,
                }) => (
                  <ul className="mb-4 ml-5 list-disc space-y-1.5 marker:text-[var(--accent-2)]">
                    {children}
                  </ul>
                ),

                ol: ({
                  children,
                }) => (
                  <ol className="mb-4 ml-5 list-decimal space-y-1.5 marker:font-semibold marker:text-[var(--accent-2)]">
                    {children}
                  </ol>
                ),

                li: ({
                  children,
                }) => (
                  <li className="pl-1.5 leading-[1.7]">
                    {children}
                  </li>
                ),

                strong: ({
                  children,
                }) => (
                  <strong className="font-semibold text-[var(--foreground)]">
                    {children}
                  </strong>
                ),

                em: ({
                  children,
                }) => (
                  <em className="text-[var(--foreground-soft)] italic">
                    {children}
                  </em>
                ),

                a: ({
                  children,
                  href,
                }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
                    style={{
                      color:
                        "var(--accent-2)",
                    }}
                  >
                    {children}
                  </a>
                ),

                blockquote: ({
                  children,
                }) => (
                  <blockquote
                    className="my-5 rounded-r-lg border-l-[3px] py-1 pl-4 pr-3 text-[var(--foreground-soft)] italic"
                    style={{
                      borderColor:
                        "var(--accent-2)",
                      background:
                        "var(--accent-2-soft)",
                    }}
                  >
                    {children}
                  </blockquote>
                ),

                hr: () => (
                  <hr
                    className="my-6 h-px border-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--border-strong) 50%, transparent)",
                    }}
                  />
                ),

                code: ({
                  children,
                  className,
                }) => {
                  const isBlock =
                    Boolean(className);

                  const language =
                    className?.replace(
                      "language-",
                      "",
                    );

                  if (isBlock) {
                    return (
                      <CodeBlock
                        language={
                          language
                        }
                      >
                        {children}
                      </CodeBlock>
                    );
                  }

                  return (
                    <code
                      className="rounded-md px-1.5 py-0.5 font-mono text-[0.9em]"
                      style={{
                        background:
                          "var(--surface-hover)",
                      }}
                    >
                      {children}
                    </code>
                  );
                },

                pre: ({
                  children,
                }) => (
                  <>{children}</>
                ),

                table: ({
                  children,
                }) => (
                  <div className="my-5 overflow-hidden rounded-xl border border-[var(--border)] shadow-[var(--shadow-xs)]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
                        {children}
                      </table>
                    </div>
                  </div>
                ),

                thead: ({
                  children,
                }) => (
                  <thead className="bg-[var(--surface-hover)]/70">
                    {children}
                  </thead>
                ),

                tbody: ({
                  children,
                }) => (
                  <tbody className="[&>tr:nth-child(even)]:bg-[var(--surface-hover)]/25">
                    {children}
                  </tbody>
                ),

                tr: ({
                  children,
                }) => (
                  <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]/40">
                    {children}
                  </tr>
                ),

                th: ({
                  children,
                }) => (
                  <th className="border-b border-[var(--border)] px-4 py-3 text-left text-[11px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
                    {children}
                  </th>
                ),

                td: ({
                  children,
                }) => (
                  <td className="border-r border-[var(--border)] px-4 py-3 align-top last:border-r-0">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* ======================================================
              CONFIDENCE
          ====================================================== */}

          {response?.confidence && (
            <ConfidencePanel
              confidence={
                response.confidence
              }
            />
          )}

          {/* ======================================================
              ESCALATION
          ====================================================== */}

          {response?.escalation_required && (
            <EscalationNotice
              reason={
                response.escalation_reason
              }
            />
          )}

          {/* ======================================================
              SOURCES
          ====================================================== */}

          {response?.sources &&
            response.sources.length > 0 && (
              <SourceDisclosure
                sources={
                  response.sources
                }
              />
            )}

          {/* ======================================================
              FEEDBACK
          ====================================================== */}

          {question && (
            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <FeedbackButtons
                question={question}
                message={message}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}