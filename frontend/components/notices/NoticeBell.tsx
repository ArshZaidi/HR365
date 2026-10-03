"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Flame,
  Info,
} from "lucide-react";

import type { Notice, NoticePriority } from "@/types/notices";

interface NoticeBellProps {
  notices: Notice[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
}

function priorityStyle(p: NoticePriority) {
  if (p === "urgent")
    return {
      fg: "var(--danger)",
      bg: "var(--danger-soft)",
      icon: <Flame size={12} />,
    };
  if (p === "high")
    return {
      fg: "var(--warning)",
      bg: "var(--warning-soft)",
      icon: <AlertTriangle size={12} />,
    };
  if (p === "low")
    return {
      fg: "var(--muted)",
      bg: "var(--surface-hover)",
      icon: <Info size={12} />,
    };
  return {
    fg: "var(--accent-3)",
    bg: "var(--accent-3-soft)",
    icon: <Info size={12} />,
  };
}

export default function NoticeBell({
  notices,
  unreadCount,
  onMarkRead,
}: NoticeBellProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* Close on outside click / Esc */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleExpand = (notice: Notice) => {
    const next = expanded === notice.id ? null : notice.id;
    setExpanded(next);
    if (next && !notice.is_read) onMarkRead(notice.id);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="
          relative flex h-10 w-10 items-center justify-center rounded-xl
          text-[var(--muted)]
          transition-all duration-300 ease-[var(--ease-out-soft)]
          hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]
        "
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span
            className="
              absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center
              rounded-full px-1 text-[10px] font-bold text-white
              ring-2 ring-[var(--surface)]
            "
            style={{
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
              boxShadow: "0 4px 10px -3px var(--accent-1)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute right-0 top-[calc(100%+10px)]
            w-[380px] max-w-[calc(100vw-2rem)]
            overflow-hidden rounded-2xl
            border border-[var(--glass-border)]
            bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
            shadow-[var(--shadow-lg)]
          "
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.005em]">
                Notices
              </p>
              <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </p>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell
                size={18}
                className="mx-auto text-[var(--muted)]"
              />
              <p className="mt-3 text-[13px] font-medium">
                No notices yet
              </p>
              <p className="mt-1 text-[11.5px] text-[var(--muted)]">
                Company announcements will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto">
              {notices.map((notice) => {
                const style = priorityStyle(notice.priority);
                const isOpen = expanded === notice.id;

                return (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => toggleExpand(notice)}
                    className="
                      group flex w-full items-start gap-3 border-b border-[var(--border)] px-4 py-3.5 text-left
                      transition-colors duration-200 ease-[var(--ease-out-soft)]
                      hover:bg-[var(--surface-hover)]/50
                      last:border-b-0
                    "
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {style.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={[
                            "text-[13.5px] leading-5",
                            notice.is_read
                              ? "font-medium text-[var(--muted)]"
                              : "font-semibold text-[var(--foreground)]",
                          ].join(" ")}
                        >
                          {notice.title}
                        </p>

                        {!notice.is_read && (
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "var(--accent-1)" }}
                          />
                        )}
                      </div>

                      <p
                        className={[
                          "mt-1 text-[12px] leading-5 text-[var(--muted)]",
                          isOpen ? "" : "line-clamp-2",
                        ].join(" ")}
                      >
                        {notice.body}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[10.5px] text-[var(--muted)]">
                        <span className="capitalize">{notice.category}</span>
                        <span className="text-[var(--border-strong)]">·</span>
                        <span className="tabular-nums">
                          {new Date(notice.published_at).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                        {notice.author_name && (
                          <>
                            <span className="text-[var(--border-strong)]">
                              ·
                            </span>
                            <span className="truncate">
                              {notice.author_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      className={[
                        "mt-1 shrink-0 text-[var(--muted)] transition-transform duration-200",
                        isOpen ? "rotate-90" : "",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}