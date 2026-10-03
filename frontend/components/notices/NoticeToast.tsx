"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, X } from "lucide-react";

import { useNotices } from "@/hooks/useNotices";
import type { Notice } from "@/types/notices";

const SEEN_KEY = "hr365-seen-notices";

function readSeen(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)));
}

export default function NoticeToast() {
  const { notices } = useNotices();
  const [active, setActive] = useState<Notice | null>(null);

  /* Pick the newest unread urgent/high notice that hasn't been toasted yet */
  useEffect(() => {
    if (active) return;

    const seen = new Set(readSeen());

    const candidate = notices.find(
      (n) =>
        !n.is_read &&
        !seen.has(n.id) &&
        (n.priority === "urgent" || n.priority === "high"),
    );

    if (candidate) {
      setActive(candidate);
      writeSeen([...seen, candidate.id]);
    }
  }, [notices, active]);

  /* Auto-dismiss */
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), 10_000);
    return () => clearTimeout(t);
  }, [active]);

  const isUrgent = active?.priority === "urgent";

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          role="alert"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="
            fixed right-5 bottom-5 z-[60] w-[360px] max-w-[calc(100vw-2rem)]
            overflow-hidden rounded-2xl
            border border-[var(--glass-border)]
            bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
            shadow-[var(--shadow-lg)]
          "
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-[0.22] blur-[80px]"
            style={{
              background: isUrgent ? "var(--danger)" : "var(--warning)",
            }}
          />

          <div className="relative p-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background: isUrgent
                    ? "linear-gradient(135deg, var(--danger), color-mix(in oklab, var(--danger) 60%, black))"
                    : "linear-gradient(135deg, var(--warning), color-mix(in oklab, var(--warning) 60%, black))",
                  boxShadow: isUrgent
                    ? "0 10px 24px -10px var(--danger)"
                    : "0 10px 24px -10px var(--warning)",
                }}
              >
                <Flame size={17} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase"
                    style={{
                      background: isUrgent
                        ? "var(--danger-soft)"
                        : "var(--warning-soft)",
                      color: isUrgent ? "var(--danger)" : "var(--warning)",
                    }}
                  >
                    {isUrgent ? "Urgent" : "High priority"}
                  </span>

                  <span className="text-[10.5px] text-[var(--muted)] capitalize">
                    {active.category}
                  </span>
                </div>

                <p className="mt-2 text-[14px] font-semibold tracking-[-0.005em]">
                  {active.title}
                </p>

                <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-6 text-[var(--muted)]">
                  {active.body}
                </p>

                {active.author_name && (
                  <p className="mt-2 text-[11px] text-[var(--muted)]">
                    From {active.author_name}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Dismiss"
                className="
                  flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                  text-[var(--muted)]
                  transition-colors duration-200
                  hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]
                "
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}