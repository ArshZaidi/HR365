"use client";

import Link from "next/link";
import { Bot, CalendarPlus, ClipboardList } from "lucide-react";

const actions = [
  {
    title: "Ask HR365",
    description: "Get an instant HR answer",
    href: "/assistant",
    icon: Bot,
  },
  {
    title: "Apply for leave",
    description: "Submit a leave request",
    href: "/leave",
    icon: CalendarPlus,
  },
  {
    title: "View requests",
    description: "Track your HR requests",
    href: "/requests",
    icon: ClipboardList,
  },
];

export default function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-xs)] transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-hover)] text-[var(--foreground)] transition-all duration-300 ease-[var(--ease-out-soft)] group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)]">
              <Icon size={19} />
            </div>

            <p className="mt-5 text-[14.5px] font-medium text-[var(--foreground)]">
              {action.title}
            </p>

            <p className="mt-1.5 text-[13px] text-[var(--muted)]">
              {action.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}