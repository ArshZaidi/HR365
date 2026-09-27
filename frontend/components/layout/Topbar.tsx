"use client";

import { Bell, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface TopbarProps {
  onMobileMenu?: () => void;
}

export default function Topbar({
  onMobileMenu,
}: TopbarProps) {
  return (
    <header
  className="
    sticky top-0 z-30
    flex h-[68px]
    items-center
    border-b border-[var(--border)]
    bg-[var(--background)]/90
    px-5
    backdrop-blur-xl
    sm:px-8
  "
>
      <button
        onClick={onMobileMenu}
        className="mr-4 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] lg:hidden"
      >
        <span className="text-lg">☰</span>
      </button>

      <div className="hidden w-full max-w-sm sm:block">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />

          <input
            placeholder="Search HR365..."
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]">
          <Bell size={17} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        </button>

        <div className="ml-2 flex items-center gap-2 border-l border-[var(--border)] pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-[11px] font-medium text-[var(--background)]">
            A
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-medium text-[var(--foreground)]">
              Arsh Raza Zaidi
            </p>

            <p className="text-[10px] text-[var(--muted)]">
              Software Engineer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}