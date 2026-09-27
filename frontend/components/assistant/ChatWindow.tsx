"use client";

import { useMemo } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

const suggestions = [
  "What is the leave policy?",
  "How does attendance work?",
  "What are my leave details?",
  "How do I raise an HR request?",
];

export default function ChatWindow() {
  const {
    messages,
    loading,
    error,
    sendMessage,
  } = useChat();

  const lastUserQuestion = useMemo(() => {
    const userMessages = messages.filter(
      (message) => message.role === "user"
    );

    return userMessages.at(-1)?.content;
  }, [messages]);

  return (
    <div className="flex min-h-[calc(100vh-68px)] flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-10 sm:px-8 lg:py-14">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
            <Sparkles size={21} />
          </div>

          <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            HR365 Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
            How can I help?
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[var(--muted)]">
            Ask about company policies, attendance, leave,
            benefits, or your personal HR information.
          </p>
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="mx-auto mt-10 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--foreground)]"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle
                    size={15}
                    className="text-[var(--muted)]"
                  />

                  <span className="text-xs text-[var(--foreground)]">
                    {suggestion}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="mt-12 flex-1 space-y-9">
            {messages.map((message, index) => {
              const question =
                message.role === "assistant"
                  ? messages[index - 1]?.role === "user"
                    ? messages[index - 1].content
                    : lastUserQuestion
                  : undefined;

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  question={question}
                />
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Input */}
        <div
          className={`mt-auto ${
            messages.length > 0 ? "pt-10" : "mt-10"
          }`}
        >
          <ChatInput
            onSend={sendMessage}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}