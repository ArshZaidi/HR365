"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import Magnetic from "@/components/ui/Magnetic";

export default function ChatInput({
  onSend,
  loading,
}: {
  onSend: (message: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!value.trim() || loading) return;

    onSend(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={submit}>
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm transition focus-within:border-[var(--foreground)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              submit(event);
            }
          }}
          rows={1}
          placeholder="Ask HR365 anything..."
          className="min-h-[52px] w-full resize-none bg-transparent px-3 py-3 pr-14 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        />

        <div className="absolute bottom-2 right-2">
          <Magnetic strength={0.15}>
            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ArrowUp size={17} />
              )}
            </button>
          </Magnetic>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
        HR365 answers are grounded in trusted company information.
      </p>
    </form>
  );
}