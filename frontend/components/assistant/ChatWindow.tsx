"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowUp,
  CalendarDays,
  Check,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

import ChatMessage from "@/components/ai/ChatMessage";
import SuggestedQuestions from "@/components/ai/SuggestedQuestions";
import { useChat } from "@/hooks/useChat";

/* ================================================================
   HELPERS
================================================================ */

function formatDate(
  value: string,
): string {
  const date = new Date(
    `${value}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function formatLeaveType(
  value: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    casual: "Casual Leave",
    sick: "Sick Leave",
    earned: "Earned Leave",
    annual: "Annual Leave",
    maternity: "Maternity Leave",
    paternity: "Paternity Leave",
    bereavement: "Bereavement Leave",
    lwp: "Leave Without Pay",
    other: "Other Leave",
  };

  return (
    labels[value] ||
    value
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  );
}

function calculateDays(
  start: string,
  end: string,
): number {
  const startDate = new Date(
    `${start}T00:00:00`,
  );

  const endDate = new Date(
    `${end}T00:00:00`,
  );

  const difference =
    endDate.getTime() -
    startDate.getTime();

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24),
    ) + 1
  );
}

/* ================================================================
   CHAT WINDOW
================================================================ */

export default function ChatWindow() {
  const {
    messages,
    loading,
    sendMessage,
    pendingLeave,
    confirmLeave,
    cancelLeave,
  } = useChat();

  const [input, setInput] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  /* ==============================================================
     SCROLL TO LATEST MESSAGE
  ============================================================== */

  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "end",
        },
      );
    }
  }, [
    messages,
    loading,
  ]);

  /* ==============================================================
     AUTO FOCUS
  ============================================================== */

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /* ==============================================================
     TEXTAREA RESIZE
  ============================================================== */

  useEffect(() => {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height =
      "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      180,
    )}px`;
  }, [input]);

  /* ==============================================================
     SUBMIT
  ============================================================== */

  const submitQuestion = async (
    question: string,
  ) => {
    const trimmed =
      question.trim();

    if (
      !trimmed ||
      loading
    ) {
      return;
    }

    setInput("");

    await sendMessage(trimmed);
  };

  /* ==============================================================
     FORM
  ============================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await submitQuestion(
      input,
    );
  };

  /* ==============================================================
     KEYBOARD
  ============================================================== */

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    /*
     * Enter = send
     * Shift + Enter = newline
     */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !loading &&
        input.trim()
      ) {
        void submitQuestion(
          input,
        );
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)]">
      {/* =========================================================
          ASSISTANT HEADER
      ========================================================= */}

      <div
        className="
          shrink-0
          border-b border-[var(--border)]
          bg-[var(--surface)]/80
          px-5 py-4
          backdrop-blur-xl
          sm:px-8
        "
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                text-white
              "
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                boxShadow:
                  "0 8px 18px -8px var(--accent-2)",
              }}
            >
              <Sparkles size={17} />
            </div>

            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">
                HR365 Assistant
              </h1>

              <p className="text-xs text-[var(--muted)]">
                Your AI-powered HR workspace
              </p>
            </div>
          </div>

          <div
            className="
              hidden items-center gap-1.5
              rounded-full border
              border-[var(--border)]
              bg-[var(--surface)]/60
              px-3 py-1.5
              text-[10px] font-semibold
              tracking-[0.12em]
              text-[var(--muted)]
              uppercase
              sm:flex
            "
          >
            <span
              className="
                h-1.5 w-1.5
                rounded-full
                bg-emerald-400
                shadow-[0_0_8px_rgba(52,211,153,0.65)]
              "
            />

            AI
          </div>
        </div>
      </div>

      {/* =========================================================
          MESSAGE AREA
      ========================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {messages.length === 0 ? (
            <EmptyChat
              onSelectQuestion={(
                question,
              ) => {
                void submitQuestion(
                  question,
                );
              }}
            />
          ) : (
            <div className="space-y-8">
              {messages.map(
                (message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ),
              )}

              {/* ==================================================
                  TYPING INDICATOR
              ================================================== */}

              {loading && (
                <TypingIndicator />
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          LEAVE CONFIRMATION
      ========================================================= */}

      {pendingLeave?.payload && (
        <div
          className="
            shrink-0
            border-t border-[var(--border)]
            bg-[var(--background)]/95
            px-4 py-3
            backdrop-blur-xl
            sm:px-8
          "
        >
          <div className="mx-auto max-w-5xl">
            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                shadow-[var(--shadow-md)]
              "
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-xl
                  "
                  style={{
                    background:
                      "var(--accent-2-soft)",
                    color:
                      "var(--accent-2)",
                  }}
                >
                  <CalendarDays
                    size={17}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                    Confirm leave request
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {formatLeaveType(
                      pendingLeave
                        .payload
                        .leave_type,
                    )}
                  </p>

                  <p className="mt-1 text-[12.5px] text-[var(--muted)]">
                    {formatDate(
                      pendingLeave
                        .payload
                        .start_date,
                    )}{" "}
                    →{" "}
                    {formatDate(
                      pendingLeave
                        .payload
                        .end_date,
                    )}{" "}
                    ·{" "}
                    {calculateDays(
                      pendingLeave
                        .payload
                        .start_date,
                      pendingLeave
                        .payload
                        .end_date,
                    )}{" "}
                    {calculateDays(
                      pendingLeave
                        .payload
                        .start_date,
                      pendingLeave
                        .payload
                        .end_date,
                    ) === 1
                      ? "day"
                      : "days"}
                  </p>

                  {pendingLeave
                    .payload
                    .reason && (
                    <p className="mt-2 text-[12px] leading-5 text-[var(--foreground-soft)]">
                      {
                        pendingLeave
                          .payload
                          .reason
                      }
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    cancelLeave
                  }
                  disabled={loading}
                  aria-label="Cancel leave request"
                  className="
                    flex h-8 w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-[var(--muted)]
                    transition-colors
                    hover:bg-[var(--surface-hover)]
                    hover:text-[var(--foreground)]
                    disabled:opacity-40
                  "
                >
                  <X size={15} />
                </button>
              </div>

              <div
                className="
                  flex items-center
                  justify-end gap-2
                  border-t
                  border-[var(--border)]
                  bg-[var(--surface-hover)]/30
                  px-4 py-3
                "
              >
                <button
                  type="button"
                  onClick={
                    cancelLeave
                  }
                  disabled={loading}
                  className="
                    rounded-xl
                    px-3.5 py-2
                    text-[12px]
                    font-medium
                    text-[var(--muted)]
                    transition-colors
                    hover:bg-[var(--surface-hover)]
                    hover:text-[var(--foreground)]
                    disabled:opacity-40
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    () => {
                      void confirmLeave();
                    }
                  }
                  disabled={loading}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    px-4 py-2
                    text-[12px]
                    font-semibold
                    text-white
                    shadow-sm
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                  }}
                >
                  {loading ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={14}
                    />
                  )}

                  {loading
                    ? "Submitting..."
                    : "Confirm & submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          COMPOSER
      ========================================================= */}

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 sm:px-8 sm:py-5">
        <div className="mx-auto max-w-5xl">
          <form
            onSubmit={
              handleSubmit
            }
            className="
              relative
              rounded-2xl
              border border-[var(--border)]
              bg-[var(--surface)]
              shadow-sm
              transition
              focus-within:border-[var(--foreground)]/30
            "
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value,
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask HR365 anything..."
              rows={1}
              disabled={loading}
              className="
                block w-full
                max-h-[180px]
                min-h-[58px]
                resize-none
                bg-transparent
                px-5 py-4 pr-16
                text-sm
                leading-6
                text-[var(--foreground)]
                outline-none
                placeholder:text-[var(--muted)]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            <button
              type="submit"
              disabled={
                loading ||
                !input.trim()
              }
              aria-label="Send message"
              className="
                absolute
                bottom-3 right-3
                flex h-9 w-9
                items-center
                justify-center
                rounded-xl
                bg-[var(--foreground)]
                text-[var(--background)]
                transition-all
                hover:scale-105
                hover:opacity-85
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ArrowUp
                  size={17}
                />
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
            HR365 answers using trusted company information
            and your authenticated HR data.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   EMPTY CHAT
================================================================ */

function EmptyChat({
  onSelectQuestion,
}: {
  onSelectQuestion: (
    question: string,
  ) => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div
        className="
          flex h-14 w-14
          items-center justify-center
          rounded-2xl
          text-white
        "
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
          boxShadow:
            "0 12px 28px -12px var(--accent-2)",
        }}
      >
        <Sparkles size={24} />
      </div>

      <p className="mt-7 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        HR365 Intelligence
      </p>

      <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
        How can I help?
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
        Ask about company policies, leave,
        attendance, benefits, HR requests,
        or your personal HR information.
      </p>

      <SuggestedQuestions
        onSelect={
          onSelectQuestion
        }
      />
    </div>
  );
}

/* ================================================================
   TYPING INDICATOR
================================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div
        className="
          flex h-8 w-8 shrink-0
          items-center
          justify-center
          rounded-xl
          text-white
        "
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
        }}
      >
        <Sparkles size={14} />
      </div>

      <div
        className="
          rounded-2xl
          rounded-tl-md
          border border-[var(--border)]
          bg-[var(--surface)]
          px-4 py-3
        "
      >
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)]" />

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)] [animation-delay:150ms]" />

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}