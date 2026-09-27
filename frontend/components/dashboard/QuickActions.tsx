"use client";

import Link from "next/link";
import {
  Bot,
  CalendarPlus,
  ClipboardList,
} from "lucide-react";

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
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-gray-900 group-hover:text-white">
              <Icon size={19} />
            </div>

            <p className="mt-4 text-sm font-medium text-gray-900">
              {action.title}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {action.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}