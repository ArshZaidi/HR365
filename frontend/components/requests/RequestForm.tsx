"use client";

import { FormEvent, useState } from "react";

import { Send } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { GlassPanel } from "@/components/ui/premium";

const inputBase = [
  "w-full rounded-xl px-4 py-3 text-[14px]",
  "border border-[var(--border)]",
  "bg-[var(--surface)]/60 backdrop-blur-xl",
  "text-[var(--foreground)]",
  "outline-none",
  "transition-all duration-200 ease-[var(--ease-out-soft)]",
  "placeholder:text-[var(--muted)]",
  "focus:border-[var(--border-strong)]",
  "focus:bg-[var(--surface)]/80",
].join(" ");

const labelBase =
  "mb-2 block text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase";

export default function RequestForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/api/hr-requests", {
        method: "POST",
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
        }),
      });

      setSubject("");
      setDescription("");
      setCategory("general");
      setPriority("normal");

      setMessage("HR request submitted.");

      onCreated();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to create request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel tone={5} padded={false} className="self-start">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ background: "var(--accent-5)" }}
          />
          <div>
            <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
              New HR request
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              Ask HR for help with a specific issue.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        <div>
          <label className={labelBase}>Subject</label>

          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="What do you need help with?"
            className={inputBase}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Category</label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputBase}
            >
              <option value="general">General</option>
              <option value="payroll">Payroll</option>
              <option value="leave">Leave</option>
              <option value="attendance">Attendance</option>
              <option value="IT">IT</option>
              <option value="policy">Policy</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelBase}>Priority</label>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className={inputBase}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelBase}>Description</label>

          <textarea
            required
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your request…"
            className={`${inputBase} resize-none`}
          />
        </div>

        {message && (
          <p
            className="
              rounded-xl px-4 py-3 text-[12.5px] font-medium
            "
            style={{
              background: "var(--accent-5-soft)",
              color: "var(--accent-5)",
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            inline-flex h-11 w-full items-center justify-center gap-2
            rounded-xl px-5 text-[14px] font-medium text-white
            transition-all duration-300 ease-[var(--ease-out-soft)]
            hover:-translate-y-0.5
            disabled:cursor-not-allowed disabled:opacity-50
          "
          style={{
            background:
              "linear-gradient(135deg, var(--accent-5), var(--accent-1))",
            boxShadow:
              "0 12px 28px -10px rgba(224,169,59,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Send size={15} />
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </GlassPanel>
  );
}