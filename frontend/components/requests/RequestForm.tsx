"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

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
        err instanceof Error
          ? err.message
          : "Unable to create request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <p className="text-sm font-medium">
        New HR request
      </p>

      <p className="mt-1 text-xs text-[var(--muted)]">
        Ask HR for help with a specific issue.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 space-y-5"
      >
        <div>
          <label className="mb-2 block text-xs font-medium">
            Subject
          </label>

          <input
            required
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
            placeholder="What do you need help with?"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">
            Category
          </label>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
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
          <label className="mb-2 block text-xs font-medium">
            Priority
          </label>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">
            Description
          </label>

          <textarea
            required
            rows={5}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe your request..."
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
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}