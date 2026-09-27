"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

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
          : "Unable to submit leave request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <p className="text-sm font-medium">
          Apply for leave
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Submit a new leave request for HR approval.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-6 space-y-5"
      >
        <div>
          <label className="mb-2 block text-xs font-medium">
            Leave type
          </label>

          <select
            value={leaveType}
            onChange={(event) =>
              setLeaveType(event.target.value)
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
          >
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium">
              Start date
            </label>

            <input
              type="date"
              required
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium">
              End date
            </label>

            <input
              type="date"
              required
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">
            Reason
          </label>

          <textarea
            required
            rows={4}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Briefly explain your request..."
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
          />
        </div>

        {message && (
          <p className="rounded-xl bg-[var(--surface-hover)] px-4 py-3 text-xs text-[var(--muted)]">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit leave request"}
        </button>
      </form>
    </div>
  );
}