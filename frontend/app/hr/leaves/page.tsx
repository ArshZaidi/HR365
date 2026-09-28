"use client";

import { FileText } from "lucide-react";

export default function HRLeavesPage() {
  return (
    <div className="min-h-full p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-hover)]">
              <FileText
                size={18}
                className="text-[var(--muted)]"
              />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Leave Management
              </h1>

              <p className="text-sm text-[var(--muted)]">
                Manage employee leave requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}