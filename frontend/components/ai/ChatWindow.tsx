"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { useChat } from "@/hooks/useChat";

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

export default function ChatWindow() {
  const {
    messages,
    loading,
    error,
    sendMessage,
  } = useChat();

  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, loading]);

  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    setInput("");

    try {
      await sendMessage(trimmed);
    } catch {
      // useChat handles the error state.
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await submitQuestion(input);
  };

  return (
    <div className="relative w-full bg-[#f8f7f3] dark:bg-[#171716]">

      {/* =========================================================
          PAGE CONTENT

          IMPORTANT:
          There is NO overflow property here.
          The browser owns scrolling.
      ========================================================= */}

      <main className="w-full">

        <div
          className="
            mx-auto
            w-full
            max-w-5xl
            px-5
            pb-44
            pt-8
            sm:px-8
            lg:px-10
          "
        >

          {messages.length === 0 ? (

            /* =====================================================
               EMPTY STATE
            ===================================================== */

            <section className="flex min-h-[calc(100vh-150px)] items-center">

              <div className="mx-auto w-full max-w-3xl">

                {/* Identity */}

                <div className="mb-5 flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#242321] text-xs font-semibold text-white dark:bg-[#f1eee7] dark:text-[#242321]">
                    H
                  </div>

                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-black/40 dark:text-white/35">
                    HR365 Assistant
                  </span>

                </div>

                {/* Heading */}

                <h1
                  className="
                    max-w-3xl
                    text-4xl
                    font-medium
                    tracking-[-0.055em]
                    text-[#242321]
                    sm:text-5xl
                    lg:text-[56px]
                    lg:leading-[1.04]
                    dark:text-[#f1eee7]
                  "
                >
                  How can I help you today?
                </h1>

                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-black/45 dark:text-white/40">
                  Ask about company policies, attendance, leave,
                  HR requests, benefits, or your employee information.
                </p>

                {/* Default questions */}

                <div className="mt-10 grid gap-3 sm:grid-cols-2">

                  {DEFAULT_QUESTIONS.map((item) => (
                    <button
                      key={item.question}
                      type="button"
                      disabled={loading}
                      onClick={() => submitQuestion(item.question)}
                      className="
                        group
                        rounded-2xl
                        border
                        border-black/[0.08]
                        bg-white
                        p-5
                        text-left
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:border-black/[0.14]
                        hover:shadow-[0_12px_35px_rgba(0,0,0,0.06)]
                        active:translate-y-0
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        dark:border-white/[0.08]
                        dark:bg-[#201f1d]
                        dark:hover:border-white/[0.14]
                        dark:hover:shadow-none
                      "
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <p className="text-sm font-semibold tracking-[-0.01em] text-[#242321] dark:text-[#f1eee7]">
                            {item.title}
                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-black/40 dark:text-white/35">
                            {item.description}
                          </p>
                        </div>

                        <span
                          className="
                            mt-0.5
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-black/[0.08]
                            text-sm
                            text-black/35
                            transition-transform
                            group-hover:translate-x-0.5
                            dark:border-white/[0.08]
                            dark:text-white/35
                          "
                        >
                          →
                        </span>

                      </div>
                    </button>
                  ))}

                </div>

                <p className="mt-6 text-center text-[11px] text-black/25 dark:text-white/20">
                  You can also type your own question below.
                </p>

              </div>

            </section>

          ) : (

            /* =====================================================
               CONVERSATION
            ===================================================== */

            <section className="mx-auto max-w-4xl space-y-8">

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {loading && (
                <div className="flex items-center gap-3 px-2 py-3">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#242321] dark:bg-[#f1eee7]">
                    <span className="text-[10px] font-semibold text-white dark:text-[#242321]">
                      H
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/35 dark:bg-white/35" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/25 dark:bg-white/25 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/15 dark:bg-white/15 [animation-delay:300ms]" />
                  </div>

                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div
                ref={messagesEndRef}
                className="h-1"
                aria-hidden="true"
              />

            </section>
          )}

        </div>

      </main>

      {/* =========================================================
          FIXED AI COMPOSER

          This is NOT a scroll container.
          It is fixed to the viewport.
      ========================================================= */}

      <div
        className="
            sticky
            bottom-0
            z-30
            border-t
            border-black/[0.06]
            bg-[#f8f7f3]/90
            px-4
            pb-4
            pt-3
            backdrop-blur-xl
            dark:border-white/[0.06]
            dark:bg-[#171716]/90
            sm:px-6
        "
    >

        <div className="mx-auto w-full max-w-4xl">

          <form onSubmit={handleSubmit}>

            <div
              className="
                relative
                overflow-hidden
                rounded-[20px]
                border
                border-black/[0.09]
                bg-white
                shadow-[0_8px_35px_rgba(0,0,0,0.07)]
                transition-all
                focus-within:border-black/[0.16]
                focus-within:shadow-[0_10px_40px_rgba(0,0,0,0.10)]
                dark:border-white/[0.09]
                dark:bg-[#22211f]
                dark:shadow-none
                dark:focus-within:border-white/[0.16]
              "
            >

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    if (!input.trim() || loading) return;

                    submitQuestion(input);
                  }
                }}
                rows={1}
                placeholder="Ask HR365 anything..."
                disabled={loading}
                className="
                  min-h-[58px]
                  w-full
                  resize-none
                  bg-transparent
                  px-5
                  pb-2
                  pt-4
                  pr-16
                  text-[14px]
                  leading-6
                  outline-none
                  placeholder:text-black/30
                  disabled:cursor-not-allowed
                  dark:placeholder:text-white/25
                "
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="
                  absolute
                  bottom-3
                  right-3
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#242321]
                  text-white
                  transition-all
                  hover:scale-[1.04]
                  active:scale-95
                  disabled:cursor-not-allowed
                  disabled:opacity-25
                  dark:bg-[#f1eee7]
                  dark:text-[#242321]
                "
              >
                ↑
              </button>

            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[10px] text-black/25 dark:text-white/20">
                HR365 AI Assistant
              </span>

              <span className="text-[10px] text-black/25 dark:text-white/20">
                Enter to send · Shift + Enter for new line
              </span>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}