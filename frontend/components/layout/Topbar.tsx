"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { useNotices } from "@/hooks/useNotices";
import NoticeBell from "@/components/notices/NoticeBell";
import { supabase } from "@/lib/supabase";

interface TopbarProps {
  onMenuToggle?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assistant": "AI Assistant",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/requests": "Requests",
  "/hr": "HR Dashboard",
  "/settings": "Settings",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((k) =>
    pathname.startsWith(`${k}/`),
  );
  return match ? PAGE_TITLES[match] : "HR365";
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const { profile, loading: profileLoading } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { notices, unreadCount, markRead } = useNotices();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U";

  const displayName =
    profile?.full_name || (profileLoading ? "Loading profile" : "User");

  const displayRole =
    profile?.designation ||
    profile?.role ||
    (profileLoading ? "Please wait..." : "Employee");

  const iconButton = [
    "relative flex h-10 w-10 items-center justify-center rounded-xl",
    "text-[var(--muted)]",
    "transition-all duration-300 ease-[var(--ease-out-soft)]",
    "hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]",
  ].join(" ");

  return (
    <header
      className="
        sticky top-0 z-30 h-[72px] shrink-0
        border-b border-[var(--border)]
        bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150
        shadow-[inset_0_-1px_0_var(--glass-ring)]
      "
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Open navigation"
              className={`${iconButton} shrink-0 lg:hidden`}
            >
              <Menu size={19} />
            </button>
          )}

          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 items-center gap-2 md:flex"
          >
            <span className="text-[14px] font-medium text-[var(--muted)]">
              HR365
            </span>
            <ChevronRight size={14} className="text-[var(--muted)]/60" />
            <span className="font-display truncate text-[16px] font-medium text-[var(--foreground)]">
              {getPageTitle(pathname)}
            </span>
          </nav>

          <div className="font-display text-[18px] font-medium tracking-[-0.02em] text-[var(--foreground)] md:hidden">
            HR365
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Notices bell */}
          <NoticeBell
            notices={notices}
            unreadCount={unreadCount}
            onMarkRead={markRead}
          />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            className={iconButton}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="mx-1 hidden h-6 w-px bg-[var(--border)] sm:block" />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="
                flex items-center gap-2.5 rounded-xl px-1.5 py-1.5
                transition-colors duration-200 ease-[var(--ease-out-soft)]
                hover:bg-[var(--surface-hover)]/70
                sm:px-2
              "
            >
              <div className="hidden text-right sm:block">
                <div className="max-w-[170px] truncate text-[13.5px] font-medium text-[var(--foreground)]">
                  {displayName}
                </div>
                <div className="max-w-[170px] truncate text-[12px] text-[var(--muted)]">
                  {displayRole}
                </div>
              </div>

              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                  boxShadow:
                    "0 6px 16px -6px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                {initials}
              </div>

              <ChevronDown
                size={15}
                className={`
                  hidden text-[var(--muted)]
                  transition-transform duration-300 ease-[var(--ease-out-soft)]
                  sm:block
                  ${menuOpen ? "rotate-180" : ""}
                `}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="
                  absolute right-0 top-[calc(100%+10px)]
                  w-72 overflow-hidden rounded-2xl
                  border border-[var(--glass-border)]
                  bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
                  shadow-[var(--shadow-lg)]
                "
              >
                <div className="border-b border-[var(--border)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-medium text-[var(--foreground)]">
                        {displayName}
                      </div>
                      <div className="truncate text-[12.5px] text-[var(--muted)]">
                        {profile?.email || ""}
                      </div>
                    </div>
                  </div>

                  {profile?.department && (
                    <div className="mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 px-3.5 py-2.5 backdrop-blur-xl">
                      <div className="text-[10.5px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                        Department
                      </div>
                      <div className="mt-1 text-[13.5px] font-medium text-[var(--foreground)]">
                        {profile.department}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5">
                    <User size={17} className="text-[var(--muted)]" />
                    <div>
                      <div className="text-[12px] text-[var(--muted)]">
                        Account
                      </div>
                      <div className="text-[13.5px] font-medium text-[var(--foreground)]">
                        {profile?.role || "Employee"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    disabled={signingOut}
                    className="
                      mt-0.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5
                      text-left text-[13.5px] font-medium text-[var(--muted)]
                      transition-colors duration-200 ease-[var(--ease-out-soft)]
                      hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <LogOut size={17} />
                    <span>{signingOut ? "Signing out..." : "Sign out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}