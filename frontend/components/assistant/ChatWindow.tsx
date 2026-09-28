"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";

import ChatMessage from "@/components/ai/ChatMessage";
import SuggestedQuestions from "@/components/ai/SuggestedQuestions";
import { apiFetch } from "@/lib/api";

interface Source {
  source?: string;
  filename?: string;
  score?: number;
  chunk?: string;
  [key: string]: unknown;
}

interface Confidence {
  score: number;
  level: "high" | "medium" | "low" | string;
  top_similarity?: number;
  mean_similarity?: number;
  evidence_score?: number;
  relevant_chunk_count?: number;
}

interface AskResponse {
  answer: string;
  sources: Source[];
  confidence: Confidence;
  escalation_required: boolean;
  escalation_reason?: string | null;
  hr_ticket_id?: string | null;
}

interface ChatMessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<
    ChatMessageType[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(
    null,
  );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  /*
   * Keep the latest message visible when the assistant
   * responds or the conversation grows.
   */
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  /*
   * Automatically focus the composer when the page opens.
   */
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /*
   * Resize textarea based on its content.
   */
  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      180,
    )}px`;
  }, [input]);

  const submitQuestion = async (
    question: string,
  ) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch<AskResponse>(
        "/api/ask",
        {
          method: "POST",
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        },
      );

      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        response,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "Unable to process HR365 question:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to process your question.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I couldn't process that request.\n\n${message}`,
        },
      ]);
    } finally {
      setLoading(false);

      /*
       * Restore focus to the composer after the response.
       */
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await submitQuestion(input);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    /*
     * Enter sends.
     * Shift + Enter creates a new line.
     */
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!loading && input.trim()) {
        void submitQuestion(input);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)]">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/80 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
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
      </div>

      {/* =========================================================
          MESSAGES
      ========================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {messages.length === 0 ? (
            <EmptyChat
              onSelectQuestion={(question) => {
                void submitQuestion(question);
              }}
            />
          ) : (
            <div className="space-y-8">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {loading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          COMPOSER
      ========================================================= */}

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 sm:px-8 sm:py-5">
        <div className="mx-auto max-w-5xl">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition focus-within:border-[var(--foreground)]/30"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask HR365 anything..."
              rows={1}
              disabled={loading}
              className="block max-h-[180px] min-h-[58px] w-full resize-none bg-transparent px-5 py-4 pr-16 text-sm leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={
                loading || !input.trim()
              }
              aria-label="Send message"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ArrowUp size={17} />
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
        <Sparkles size={24} />
      </div>

      <p className="mt-7 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        HR365 Intelligence
      </p>

      <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
        How can I help?
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
        Ask about company policies, leave, attendance,
        benefits, HR requests, or your personal HR
        information.
      </p>

      <SuggestedQuestions
        onSelect={onSelectQuestion}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
        <Sparkles size={14} />
      </div>

      <div className="rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}