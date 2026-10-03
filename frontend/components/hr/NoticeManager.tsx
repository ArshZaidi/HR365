"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Flame,
  Info,
  Loader2,
  Megaphone,
  Send,
  Trash2,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { GlassPanel } from "@/components/ui/premium";
import type { Notice, NoticePriority, NoticesResponse } from "@/types/notices";

const PRIORITIES: { id: NoticePriority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

const CATEGORIES = [
  "general",
  "policy",
  "holiday",
  "payroll",
  "event",
  "urgent",
  "other",
];

function priorityIcon(p: NoticePriority) {
  if (p === "urgent") return <Flame size={12} />;
  if (p === "high") return <AlertTriangle size={12} />;
  return <Info size={12} />;
}

function priorityStyle(p: NoticePriority) {
  if (p === "urgent")
    return { fg: "var(--danger)", bg: "var(--danger-soft)" };
  if (p === "high")
    return { fg: "var(--warning)", bg: "var(--warning-soft)" };
  if (p === "low")
    return { fg: "var(--muted)", bg: "var(--surface-hover)" };
  return { fg: "var(--accent-3)", bg: "var(--accent-3-soft)" };
}

const inputBase = [
  "w-full rounded-xl px-4 py-3 text-[14px]",
  "border border-[var(--border)]",
  "bg-[var(--surface)]/60 backdrop-blur-xl",
  "text-[var(--foreground)] outline-none",
  "transition-all duration-200 ease-[var(--ease-out-soft)]",
  "placeholder:text-[var(--muted)]",
  "focus:border-[var(--border-strong)]",
  "focus:bg-[var(--surface)]/80",
].join(" ");

const labelBase =
  "mb-2 block text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase";

export default function NoticeManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [category, setCategory] = useState("general");

  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<NoticesResponse>("/api/notices");
      setNotices(data.notices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || posting) return;

    setPosting(true);
    setError(null);

    try {
      await apiFetch("/api/notices", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          priority,
          category,
        }),
      });

      setTitle("");
      setBody("");
      setPriority("normal");
      setCategory("general");

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish notice.");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);

    try {
      await apiFetch(`/api/notices/${id}`, { method: "DELETE" });
      setNotices((current) => current.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete notice.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <GlassPanel
      tone={5}
      title="Notices"
      subtitle="Publish announcements to the whole company"
      padded={false}
    >
      {/* Composer */}
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        <div>
          <label className={labelBase}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Office closed on Friday"
            className={inputBase}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelBase}>Priority</label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as NoticePriority)
              }
              className={inputBase}
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelBase}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputBase}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelBase}>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the announcement…"
            rows={4}
            className={`${inputBase} resize-none`}
            required
          />
        </div>

        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-[13px] font-medium"
            style={{
              borderColor: "var(--danger)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={posting || !title.trim() || !body.trim()}
          className="
            inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5
            text-[14px] font-medium text-white
            transition-all duration-300 ease-[var(--ease-out-soft)]
            hover:-translate-y-0.5
            disabled:cursor-not-allowed disabled:opacity-60
          "
          style={{
            background:
              "linear-gradient(135deg, var(--accent-5), var(--accent-1))",
            boxShadow:
              "0 16px 36px -14px rgba(224,169,59,0.5), inset 0 1px 0 rgba(255,255,255,0.28)",
          }}
        >
          {posting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {posting ? "Publishing…" : "Publish notice"}
        </button>
      </form>

      {/* List */}
      <div className="border-t border-[var(--border)]">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 sm:px-6">
          <Megaphone size={13} className="text-[var(--muted)]" />
          <p className="text-[11.5px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
            Published notices
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 px-5 pb-5 sm:px-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-[var(--surface-hover)]/50"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <p className="px-5 pb-6 text-[13px] text-[var(--muted)] sm:px-6">
            No notices published yet.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notices.map((notice) => {
              const style = priorityStyle(notice.priority);
              const isDeleting = deletingId === notice.id;

              return (
                <div
                  key={notice.id}
                  className="flex items-start gap-3 px-5 py-4 sm:px-6"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {priorityIcon(notice.priority)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold tracking-[-0.005em]">
                      {notice.title}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--muted)]">
                      {notice.body}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px] text-[var(--muted)]">
                      <span
                        className="rounded-full px-2 py-0.5 font-semibold capitalize"
                        style={{ background: style.bg, color: style.fg }}
                      >
                        {notice.priority}
                      </span>
                      <span className="capitalize">{notice.category}</span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span className="tabular-nums">
                        {new Date(notice.published_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(notice.id)}
                    disabled={isDeleting}
                    aria-label="Delete notice"
                    className="
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                      transition-colors duration-200
                      hover:bg-[var(--danger-soft)]
                      disabled:cursor-not-allowed disabled:opacity-40
                    "
                    style={{ color: "var(--danger)" }}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}