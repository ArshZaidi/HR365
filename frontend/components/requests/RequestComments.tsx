"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, MessageSquareText, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { apiFetch } from "@/lib/api";
import type { TicketComment } from "@/types/requests";

interface RequestCommentsProps {
  requestId: string;
}

const MAX_LEN = 1000;

const SPRING_SOFT = { type: "spring" as const, stiffness: 300, damping: 28 };
const SPRING_TAP = { type: "spring" as const, stiffness: 520, damping: 30 };
const EASE_OUT_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function initials(name?: string | null, role?: string) {
  if (!name) return role === "hr" ? "HR" : "You";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateKey(iso) === dateKey(today.toISOString())) return "Today";
  if (dateKey(iso) === dateKey(yesterday.toISOString())) return "Yesterday";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RequestComments({ requestId }: RequestCommentsProps) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<{ comments: TicketComment[] }>(
        `/api/hr-requests/${requestId}/comments`,
      );
      setComments(data.comments || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load comments.",
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [comments.length, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const body = value.trim();
    if (!body || posting) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimistic: TicketComment = {
      id: optimisticId,
      request_id: requestId,
      author_id: "self",
      author_name: "You",
      author_role: "employee",
      body,
      created_at: new Date().toISOString(),
    };

    setComments((c) => [...c, optimistic]);
    setValue("");
    setPosting(true);
    setError(null);

    try {
      const data = await apiFetch<{ comment: TicketComment }>(
        `/api/hr-requests/${requestId}/comments`,
        { method: "POST", body: JSON.stringify({ body }) },
      );

      setComments((c) =>
        c.map((item) => (item.id === optimisticId ? data.comment : item)),
      );
    } catch (err) {
      setComments((c) => c.filter((item) => item.id !== optimisticId));
      setValue(body);
      setError(
        err instanceof Error ? err.message : "Unable to post comment.",
      );
    } finally {
      setPosting(false);
      textareaRef.current?.focus();
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, TicketComment[]>();
    for (const c of comments) {
      const key = dateKey(c.created_at);
      const list = map.get(key) || [];
      list.push(c);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [comments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_SOFT }}
      className="
        mt-5 overflow-hidden rounded-2xl
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
        shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
      "
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
              boxShadow:
                "0 8px 20px -8px var(--accent-2), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            <MessageSquareText size={15} />
          </span>

          <div>
            <p className="text-[14px] font-semibold tracking-[-0.005em]">
              Conversation with HR
            </p>
            <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
              {comments.length === 0
                ? "No messages yet"
                : `${comments.length} message${
                    comments.length !== 1 ? "s" : ""
                  }`}
            </p>
          </div>
        </div>

        {comments.length > 0 && (
          <span
            className="
              hidden shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase
              sm:inline-flex
            "
            style={{
              background: "var(--accent-2-soft)",
              color: "var(--accent-2)",
            }}
          >
            With HR
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        data-lenis-prevent
        className="max-h-[520px] min-h-[180px] overflow-y-auto overscroll-contain px-6 py-6"
      >
        {loading ? (
          <LoadingThread />
        ) : comments.length === 0 ? (
          <EmptyThread />
        ) : (
          <div className="space-y-8">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="mb-6 flex items-center gap-3.5">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span
                    className="
                      rounded-full border border-[var(--border)]
                      bg-[var(--surface)]/60 backdrop-blur-xl
                      px-3 py-1 text-[10.5px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase
                    "
                  >
                    {formatDateHeader(items[0].created_at)}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>

                <div className="space-y-5">
                  <AnimatePresence initial={false}>
                    {items.map((c) => (
                      <CommentBubble key={c.id} comment={c} side="employee" />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {posting && <TypingRow />}
      </div>

      <form
        onSubmit={submit}
        className="border-t border-[var(--border)] bg-[var(--surface)]/30 px-6 py-5 backdrop-blur-xl"
      >
        <div
          className="
            relative rounded-2xl border
            bg-[var(--surface)]/60 backdrop-blur-xl
            transition-all duration-300 ease-[var(--ease-out-soft)]
          "
          style={{
            borderColor: focused ? "var(--accent-2)" : "var(--border)",
            boxShadow: focused ? "0 0 0 3px var(--accent-2-soft)" : "none",
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit(e as unknown as FormEvent);
              }
            }}
            rows={2}
            placeholder="Reply to HR…"
            disabled={posting}
            className="
              w-full resize-none rounded-2xl bg-transparent
              px-4 py-3.5 pr-16 text-[14px] leading-6
              outline-none
              placeholder:text-[var(--muted)]
              disabled:opacity-60
            "
          />

          <motion.button
            type="submit"
            disabled={posting || !value.trim()}
            aria-label="Send reply"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING_TAP}
            className="
              absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center
              rounded-xl text-white
              disabled:cursor-not-allowed disabled:opacity-40
              disabled:hover:scale-100
            "
            style={{
              background:
                "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
              boxShadow:
                "0 10px 24px -10px var(--accent-2), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            {posting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </motion.button>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3 px-1 text-[11px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <kbd
              className="
                rounded border border-[var(--border)]
                bg-[var(--surface)]/70 px-1.5 py-0.5
                font-mono text-[10px]
              "
            >
              ⌘
            </kbd>
            <span>+</span>
            <kbd
              className="
                rounded border border-[var(--border)]
                bg-[var(--surface)]/70 px-1.5 py-0.5
                font-mono text-[10px]
              "
            >
              ⏎
            </kbd>
            <span className="ml-1">to send</span>
          </span>

          <span
            className="tabular-nums"
            style={{
              color:
                value.length > MAX_LEN * 0.9
                  ? "var(--warning)"
                  : "var(--muted)",
            }}
          >
            {value.length}/{MAX_LEN}
          </span>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-lg px-3 py-2 text-[12px] font-medium"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BUBBLE / STATES
   ═══════════════════════════════════════════════════════════ */

function CommentBubble({
  comment,
  side,
}: {
  comment: TicketComment;
  side: "hr" | "employee";
}) {
  const isHR = comment.author_role === "hr";
  const isMine = (side === "hr" && isHR) || (side === "employee" && !isHR);
  const isOptimistic = comment.id.startsWith("temp-");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: isOptimistic ? 0.55 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={SPRING_SOFT}
      className={[
        "group flex gap-3.5",
        isMine ? "flex-row-reverse" : "flex-row",
      ].join(" ")}
    >
      <motion.span
        whileHover={{ scale: 1.06 }}
        transition={SPRING_TAP}
        className="
          flex h-9 w-9 shrink-0 items-center justify-center rounded-full
          text-[11.5px] font-semibold text-white
        "
        style={{
          background: isHR
            ? "linear-gradient(135deg, var(--accent-2), var(--accent-6))"
            : "linear-gradient(135deg, var(--accent-3), var(--accent-4))",
          boxShadow: isHR
            ? "0 6px 16px -6px var(--accent-2)"
            : "0 6px 16px -6px var(--accent-3)",
        }}
      >
        {initials(comment.author_name, comment.author_role)}
      </motion.span>

      <div
        className={[
          "flex min-w-0 max-w-[78%] flex-col",
          isMine ? "items-end" : "items-start",
        ].join(" ")}
      >
        <div
          className={[
            "mb-1.5 inline-flex items-center gap-2 px-1",
            isMine ? "flex-row-reverse" : "",
          ].join(" ")}
        >
          <span className="text-[12.5px] font-semibold text-[var(--foreground)]">
            {comment.author_name || (isHR ? "HR" : "You")}
          </span>

          {isHR && (
            <span
              className="
                rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.06em] uppercase
              "
              style={{
                background: "var(--accent-2-soft)",
                color: "var(--accent-2)",
              }}
            >
              HR
            </span>
          )}

          <span className="text-[11.5px] text-[var(--muted)] tabular-nums">
            {formatTime(comment.created_at)}
          </span>
        </div>

        <div
          className={[
            "relative whitespace-pre-wrap break-words px-4 py-3",
            "text-[14px] leading-[1.65]",
            isMine ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md",
          ].join(" ")}
          style={
            isMine
              ? {
                  background:
                    "linear-gradient(135deg, var(--accent-2), var(--accent-6))",
                  color: "white",
                  boxShadow:
                    "0 10px 28px -14px var(--accent-2), inset 0 1px 0 rgba(255,255,255,0.22)",
                }
              : {
                  background:
                    "color-mix(in oklab, var(--surface) 70%, transparent)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 0 var(--glass-hi) inset",
                }
          }
        >
          {comment.body}
        </div>

        {isOptimistic && (
          <span className="mt-1.5 px-1 text-[10.5px] text-[var(--muted)]">
            Sending…
          </span>
        )}
      </div>
    </motion.div>
  );
}

function LoadingThread() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={["flex gap-3.5", i % 2 ? "" : "flex-row-reverse"].join(" ")}
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--surface-hover)]/60" />
          <div
            className={[
              "flex-1 space-y-2.5",
              i % 2 ? "items-start" : "items-end",
            ].join(" ")}
          >
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-hover)]/60" />
            <div
              className={[
                "h-16 animate-pulse rounded-2xl bg-[var(--surface-hover)]/60",
                i % 2 ? "w-3/4" : "ml-auto w-2/3",
              ].join(" ")}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyThread() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_SOFT }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING_SOFT, delay: 0.1 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "var(--accent-2-soft)",
          color: "var(--accent-2)",
        }}
      >
        <MessageSquareText size={22} />
      </motion.div>

      <p className="mt-4 text-[14.5px] font-semibold tracking-[-0.005em]">
        No messages from HR yet
      </p>

      <p className="mt-2 max-w-xs text-[12.5px] leading-6 text-[var(--muted)]">
        HR will reply here once they start working on your ticket. You can
        also add details they might need.
      </p>
    </motion.div>
  );
}

function TypingRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="mt-5 flex items-center gap-2.5 pl-12"
    >
      <span className="text-[11.5px] text-[var(--muted)]">Sending</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-2)] [animation-delay:300ms]" />
      </span>
    </motion.div>
  );
}