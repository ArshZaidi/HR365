"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Check,
  Download,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import ChatMessage from "./ChatMessage";
import SuggestedQuestions from "./SuggestedQuestions";
import { useChat } from "@/hooks/useChat";

/* ================================================================
   VOICE INPUT — Web Speech API
================================================================ */

function useVoiceInput({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    setSupported(Boolean(SR));
  }, []);

  const start = (baseText: string) => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return;

    baseRef.current = baseText;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const base = baseRef.current;
      const spacer = base && !base.endsWith(" ") ? " " : "";

      onTranscript(base + spacer + final + interim);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // no-op
    }

    setListening(false);
  };

  return {
    listening,
    supported,
    toggle: (baseText: string) =>
      listening ? stop() : start(baseText),
  };
}

/* ================================================================
   DEFAULT QUESTIONS
================================================================ */

const DEFAULT_QUESTIONS = [
  {
    title: "Leave policy",
    question: "What is the leave policy?",
    description: "Understand leave types, eligibility and rules",
  },
  {
    title: "My attendance",
    question: "What is my current attendance?",
    description: "View your attendance information",
  },
  {
    title: "My leave",
    question: "What are my current leave requests?",
    description: "Check your leave applications and status",
  },
  {
    title: "Remote work",
    question: "What is the company's remote work policy?",
    description: "Learn about working remotely",
  },
];

/* ================================================================
   CHAT EXPORT
================================================================ */

function downloadChat(
  messages: Array<{
    role: string;
    content: string;
  }>,
) {
  if (!messages.length) return;

  const lines: string[] = [
    "HR365 ASSISTANT CHAT",
    "====================",
    "",
  ];

  messages.forEach((message) => {
    const speaker =
      message.role === "user"
        ? "You"
        : "HR365 Assistant";

    lines.push(`${speaker}:`);
    lines.push(message.content.trim());
    lines.push("");
  });

  const text = lines.join("\n");

  const blob = new Blob(
    [text],
    { type: "text/plain;charset=utf-8" },
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `hr365-chat-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

/* ================================================================
   CHAT WINDOW
================================================================ */

export default function ChatWindow() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    pendingLeave,
    confirmLeave,
    cancelLeave,
  } = useChat();

  const [input, setInput] = useState("");
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Auto-scroll the inner region only — never the page. */
  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, pendingLeave]);

  /* Auto-focus composer on mount. */
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /* Auto-resize textarea. */
  useEffect(() => {
    const ta = textareaRef.current;

    if (!ta) return;

    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  const voice = useVoiceInput({
    onTranscript: (text) => setInput(text),
  });

  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    if (voice.listening) {
      voice.toggle(input);
    }

    setInput("");

    try {
      await sendMessage(trimmed);
    } catch {
      // useChat owns error state.
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await submitQuestion(input);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!loading && input.trim()) {
        void submitQuestion(input);
      }
    }
  };

  const handleConfirmLeave = async () => {
    if (confirmingLeave) return;

    setConfirmingLeave(true);

    try {
      await confirmLeave();
    } finally {
      setConfirmingLeave(false);
    }
  };

  const handleCancelLeave = () => {
    if (confirmingLeave) return;

    cancelLeave();
  };

  const canSend = Boolean(input.trim()) && !loading;
  const canDownloadChat = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-72px)] min-h-0 flex-col overflow-hidden">
      {/* ═══════════ Header ═══════════ */}

      <div className="relative shrink-0 border-b border-[var(--border)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/4 h-40 w-40 rounded-full opacity-[0.12] blur-[70px]"
          style={{ background: "var(--accent-2)" }}
        />

        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                boxShadow:
                  "0 8px 20px -8px rgba(23,22,20,0.3), inset 0 1px 0 rgba(255,255,255,0.28)",
              }}
            >
              <Sparkles size={17} />
            </span>

            <div className="min-w-0">
              <p className="font-display text-[17px] leading-tight font-medium tracking-[-0.02em]">
                HR365 Assistant
              </p>

              <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                {voice.listening
                  ? "Listening…"
                  : "Your AI-powered HR workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download chat */}
            <button
              type="button"
              onClick={() => downloadChat(messages)}
              disabled={!canDownloadChat}
              aria-label="Download chat"
              title={
                canDownloadChat
                  ? "Download chat as text file"
                  : "No chat to download"
              }
              className="
                flex h-9 w-9 items-center justify-center rounded-xl
                border border-[var(--border)]
                bg-[var(--surface)]/50
                text-[var(--muted)]
                backdrop-blur-xl
                transition-all duration-200
                hover:border-[var(--border-strong)]
                hover:bg-[var(--surface-hover)]
                hover:text-[var(--foreground)]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <Download size={15} />
            </button>

            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase sm:inline-flex"
              style={{
                background: "var(--accent-2-soft)",
                color: "var(--accent-2)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent-2)" }}
              />
              AI
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════ Messages ═══════════ */}

      <div
        ref={scrollRef}
        data-lenis-prevent
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {messages.length === 0 ? (
            <EmptyChat
              onSelectQuestion={(q) => void submitQuestion(q)}
            />
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {pendingLeave?.payload && (
                <LeaveConfirmationCard
                  leaveType={pendingLeave.payload.leave_type}
                  startDate={pendingLeave.payload.start_date}
                  endDate={pendingLeave.payload.end_date}
                  reason={pendingLeave.payload.reason}
                  confirming={confirmingLeave}
                  onConfirm={handleConfirmLeave}
                  onCancel={handleCancelLeave}
                />
              )}

              {loading && <TypingIndicator />}

              {error && (
                <div
                  className="
                    rounded-2xl border p-4 text-[13.5px]
                    border-[var(--glass-border)]
                    bg-[var(--glass-bg)] backdrop-blur-2xl
                  "
                  style={{ color: "var(--danger)" }}
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ Composer ═══════════ */}

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-8 sm:py-5">
          <form onSubmit={handleSubmit}>
            <div
              className="
                group relative overflow-hidden rounded-2xl
                border border-[var(--glass-border)]
                bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
                shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
                transition-all duration-300 ease-[var(--ease-out-soft)]
                focus-within:border-[var(--border-strong)]
                focus-within:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]
              "
            >
              {voice.listening && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-30 blur-[60px]"
                  style={{ background: "var(--accent-1)" }}
                />
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask HR365 anything..."
                disabled={loading || confirmingLeave}
                className="
                  relative block max-h-[200px] min-h-[60px] w-full resize-none
                  bg-transparent px-5 py-4 pr-28
                  text-[15px] leading-6 text-[var(--foreground)]
                  outline-none placeholder:text-[var(--muted)]
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                {voice.supported && (
                  <button
                    type="button"
                    onClick={() => voice.toggle(input)}
                    disabled={loading || confirmingLeave}
                    aria-label={
                      voice.listening
                        ? "Stop dictation"
                        : "Dictate message"
                    }
                    title={
                      voice.listening
                        ? "Stop dictation"
                        : "Dictate message"
                    }
                    className={[
                      "relative flex h-9 w-9 items-center justify-center rounded-xl",
                      "transition-all duration-300 ease-[var(--ease-out-soft)]",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      voice.listening
                        ? "text-white"
                        : "text-[var(--muted)] hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]",
                    ].join(" ")}
                    style={
                      voice.listening
                        ? {
                            background:
                              "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                            boxShadow:
                              "0 6px 16px -6px rgba(23,22,20,0.35)",
                          }
                        : undefined
                    }
                  >
                    {voice.listening && (
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-xl opacity-40"
                        style={{ background: "var(--accent-1)" }}
                      />
                    )}

                    {voice.listening ? (
                      <MicOff size={16} className="relative" />
                    ) : (
                      <Mic size={16} />
                    )}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!canSend || confirmingLeave}
                  aria-label="Send message"
                  className="
                    flex h-9 w-9 items-center justify-center rounded-xl
                    text-[var(--background)]
                    transition-all duration-300 ease-[var(--ease-out-soft)]
                    hover:scale-[1.05] active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-30
                  "
                  style={{ background: "var(--foreground)" }}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[11px] text-[var(--muted)]">
                {voice.listening
                  ? "Listening — speak now…"
                  : "Enter to send · Shift + Enter for new line"}
              </span>

              <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
                HR365 AI can make mistakes. Always verify important information.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   LEAVE CONFIRMATION CARD
================================================================ */

function LeaveConfirmationCard({
  leaveType,
  startDate,
  endDate,
  reason,
  confirming,
  onConfirm,
  onCancel,
}: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const start = formatLeaveDate(startDate);
  const end = formatLeaveDate(endDate);

  const days = calculateLeaveDays(startDate, endDate);

  return (
    <div className="flex items-start gap-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
          boxShadow:
            "0 8px 20px -8px rgba(23,22,20,0.3), inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        <Sparkles size={15} />
      </span>

      <div
        className="
          w-full max-w-xl overflow-hidden rounded-2xl rounded-tl-md
          border border-[var(--glass-border)]
          bg-[var(--glass-bg)]
          backdrop-blur-2xl
          shadow-[var(--shadow-sm)]
        "
      >
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                Leave application
              </p>

              <h3 className="font-display mt-1.5 text-[18px] font-medium tracking-[-0.02em]">
                Confirm your leave request
              </h3>
            </div>

            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "var(--accent-2-soft)",
                color: "var(--accent-2)",
              }}
            >
              {days} {days === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <DetailRow label="Leave type" value={formatLeaveType(leaveType)} />

            <DetailRow
              label="Dates"
              value={
                startDate === endDate
                  ? start
                  : `${start} → ${end}`
              }
            />

            {reason && (
              <DetailRow
                label="Reason"
                value={reason}
              />
            )}
          </div>

          <p className="mt-5 text-[12.5px] leading-5 text-[var(--muted)]">
            Please review the details before submitting. This will create
            an official leave request in HR365.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirming}
              className="
                inline-flex h-10 flex-1 items-center justify-center gap-2
                rounded-xl px-4 text-[13px] font-semibold text-white
                transition-all duration-200
                hover:scale-[1.01] active:scale-[0.98]
                disabled:cursor-not-allowed disabled:opacity-60
              "
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                boxShadow:
                  "0 8px 18px -10px rgba(23,22,20,0.4)",
              }}
            >
              {confirming ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Check size={15} />
                  Confirm & Apply
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={confirming}
              className="
                inline-flex h-10 flex-1 items-center justify-center gap-2
                rounded-xl border border-[var(--glass-border)]
                bg-[var(--glass-bg-strong)]
                px-4 text-[13px] font-semibold
                text-[var(--foreground)]
                transition-all duration-200
                hover:bg-[var(--surface-hover)]
                active:scale-[0.98]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              <X size={15} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   DETAIL ROW
================================================================ */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="shrink-0 text-[12px] text-[var(--muted)]">
        {label}
      </span>

      <span className="text-right text-[13.5px] font-medium">
        {value}
      </span>
    </div>
  );
}

/* ================================================================
   DATE HELPERS
================================================================ */

function formatLeaveDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateLeaveDays(
  startDate: string,
  endDate: string,
) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 1;
  }

  const difference =
    end.getTime() - start.getTime();

  return Math.max(
    1,
    Math.floor(difference / 86400000) + 1,
  );
}

function formatLeaveType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ================================================================
   EMPTY CHAT
================================================================ */

function EmptyChat({
  onSelectQuestion,
}: {
  onSelectQuestion: (question: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6) 55%, var(--accent-1))",
          boxShadow:
            "0 20px 44px -20px rgba(124,108,240,0.5), inset 0 1px 0 rgba(255,255,255,0.32)",
        }}
      >
        <Sparkles size={26} />
      </span>

      <p className="mt-7 text-[11px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
        HR365 Intelligence
      </p>

      <h2 className="font-display mt-3 max-w-2xl text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] sm:text-[2.75rem]">
        How can I help you today?
      </h2>

      <p className="mt-4 max-w-lg text-[14.5px] leading-[1.7] text-[var(--muted)]">
        Ask about company policies, attendance, leave, HR requests,
        benefits, or your employee information.
      </p>

      <SuggestedQuestions onSelect={onSelectQuestion} />
    </div>
  );
}

/* ================================================================
   TYPING INDICATOR
================================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
          boxShadow:
            "0 8px 20px -8px rgba(23,22,20,0.3), inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        <Sparkles size={15} />
      </span>

      <div
        className="
          flex h-11 items-center gap-1.5 rounded-2xl rounded-tl-md
          border border-[var(--glass-border)]
          bg-[var(--glass-bg)] px-4 backdrop-blur-2xl
        "
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}