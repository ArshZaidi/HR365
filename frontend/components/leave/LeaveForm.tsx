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

export default function LeaveForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [leaveType, setLeaveType] = useState("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/api/leaves", {
        method: "POST",
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });

      setStartDate("");
      setEndDate("");
      setReason("");

      setMessage("Leave request submitted.");

      onCreated();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to submit leave request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassPanel tone={4} padded={false} className="self-start">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ background: "var(--accent-4)" }}
          />
          <div>
            <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
              Apply for leave
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              Submit a new leave request for HR approval.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        <div>
          <label className={labelBase}>Leave type</label>

          <select
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value)}
            className={inputBase}
          >
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Start date</label>

            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={inputBase}
            />
          </div>

          <div>
            <label className={labelBase}>End date</label>

            <input
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <label className={labelBase}>Reason</label>

          <textarea
            required
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Briefly explain your request…"
            className={`${inputBase} resize-none`}
          />
        </div>

        {message && (
          <p
            className="rounded-xl px-4 py-3 text-[12.5px] font-medium"
            style={{
              background: "var(--accent-4-soft)",
              color: "var(--accent-4)",
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
              "linear-gradient(135deg, var(--accent-4), var(--accent-3))",
            boxShadow:
              "0 12px 28px -10px rgba(47,158,107,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Send size={15} />
          {loading ? "Submitting…" : "Submit leave request"}
        </button>
      </form>
    </GlassPanel>
  );
}