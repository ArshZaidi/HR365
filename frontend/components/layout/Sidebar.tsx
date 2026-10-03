"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const workspaceLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, tone: 1 },
  { label: "AI Assistant", href: "/assistant", icon: Bot, tone: 2 },
];

const personalLinks = [
  { label: "Attendance", href: "/attendance", icon: CalendarDays, tone: 3 },
  { label: "Leave", href: "/leave", icon: ClipboardList, tone: 4 },
  { label: "Requests", href: "/requests", icon: ClipboardList, tone: 5 },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useProfile();

  const [signingOut, setSigningOut] = useState(false);

  const normalizedRole = profile?.role?.trim().toLowerCase();
  const isHR = normalizedRole === "hr" || normalizedRole === "admin";

  const initials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  /* ─── Sign out ─────────────────────────────── */
  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  };

  const NavRow = ({
    href,
    label,
    icon: Icon,
    tone,
  }: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    tone: number;
  }) => {
    const active = isActive(href);

    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={[
          "group relative flex h-11 items-center rounded-xl",
          "transition-all duration-300 ease-[var(--ease-out-soft)]",
          collapsed ? "justify-center" : "gap-3 px-3",
          active
            ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_6px_20px_-8px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]"
            : "text-[var(--sidebar-muted)] hover:bg-white/[0.055] hover:text-white",
        ].join(" ")}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
            style={{ background: `var(--accent-${tone})` }}
          />
        )}

        <span
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ease-[var(--ease-out-soft)]",
            active
              ? "text-white"
              : "text-[var(--sidebar-muted)] group-hover:text-white",
          ].join(" ")}
          style={
            active
              ? {
                  background: `linear-gradient(135deg, var(--accent-${tone}), color-mix(in oklab, var(--accent-${tone}) 60%, black))`,
                  boxShadow: "0 4px 12px -3px var(--accent-${tone})",
                }
              : undefined
          }
        >
          <Icon size={16} strokeWidth={1.9} />
        </span>

        {!collapsed && (
          <span className="text-[14.5px] font-medium tracking-[-0.005em]">
            {label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`
        sticky top-0 z-40
        hidden h-screen shrink-0 self-start
        flex-col
        border-r border-white/[0.07]
        bg-[var(--sidebar)]/72
        backdrop-blur-2xl backdrop-saturate-[180%]
        text-[var(--sidebar-foreground)]
        shadow-[inset_-1px_0_0_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]
        lg:flex
        transition-[width] duration-500 ease-[var(--ease-out-soft)]
        ${collapsed ? "w-[88px]" : "w-[276px]"}
      `}
    >
      {/* Brand */}
      <div
        className={`flex h-[76px] shrink-0 items-center border-b border-white/[0.06] ${
          collapsed ? "justify-center" : "px-5"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[16px] font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
              boxShadow:
                "0 8px 24px -8px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            H
          </div>

          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="font-display text-[18px] font-medium tracking-[-0.02em]">
                HR365
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-[0.02em] text-[var(--sidebar-muted)]">
                Intelligent HR
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="shrink-0 border-b border-white/[0.06] px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.045] px-3 py-2.5 backdrop-blur-xl">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-2), var(--accent-3))",
                boxShadow: "0 4px 12px -4px var(--accent-2)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-medium text-white">
                {profile?.full_name || "User"}
              </div>
              <div className="truncate text-[11.5px] text-[var(--sidebar-muted)]">
                {profile?.designation || profile?.role || "Employee"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2.5 px-3 text-[10.5px] font-semibold tracking-[0.2em] text-[var(--sidebar-muted)] uppercase">
            Workspace
          </p>
        )}
        <div className="space-y-1.5">
          {workspaceLinks.map((item) => (
            <NavRow key={item.href} {...item} />
          ))}
        </div>

        {!collapsed && (
          <p className="mt-7 mb-2.5 px-3 text-[10.5px] font-semibold tracking-[0.2em] text-[var(--sidebar-muted)] uppercase">
            My work
          </p>
        )}
        {collapsed && <div className="my-3 border-t border-white/[0.06]" />}
        <div className="space-y-1.5">
          {personalLinks.map((item) => (
            <NavRow key={item.href} {...item} />
          ))}
        </div>

        {isHR && (
          <>
            {!collapsed && (
              <p className="mt-7 mb-2.5 px-3 text-[10.5px] font-semibold tracking-[0.2em] text-[var(--sidebar-muted)] uppercase">
                Management
              </p>
            )}
            {collapsed && <div className="my-3 border-t border-white/[0.06]" />}
            <div className="space-y-1.5">
              <NavRow href="/hr" label="HR Dashboard" icon={Users} tone={6} />
            </div>
          </>
        )}
      </nav>

      {/* AI CTA */}
      {!collapsed && (
        <div className="shrink-0 px-3 pb-2">
          <Link
            href="/assistant"
            className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.05] px-3.5 py-3 backdrop-blur-xl transition-all duration-300 ease-[var(--ease-out-soft)] hover:border-white/[0.18] hover:bg-white/[0.09]"
          >
            <span
              aria-hidden
              className="absolute -top-8 -right-4 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: "var(--accent-2)" }}
            />
            <Sparkles
              size={16}
              className="relative shrink-0 text-white"
              style={{ filter: "drop-shadow(0 0 8px var(--accent-2))" }}
            />
            <div className="relative min-w-0 flex-1">
              <div className="text-[13px] font-medium text-white">
                Ask HR365
              </div>
              <div className="text-[11px] text-[var(--sidebar-muted)]">
                Instant HR answers
              </div>
            </div>
            <ChevronRight size={14} className="relative shrink-0 text-white/60" />
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={[
            "flex h-10 items-center rounded-xl",
            "text-[var(--sidebar-muted)]",
            "transition-colors duration-200 ease-[var(--ease-out-soft)]",
            "hover:bg-white/[0.055] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-3",
          ].join(" ")}
        >
          <Settings size={17} strokeWidth={1.9} />
          {!collapsed && (
            <span className="text-[14px] font-medium">Settings</span>
          )}
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? "Sign out" : undefined}
          className={[
            "mt-0.5 flex h-10 w-full items-center rounded-xl",
            "text-[var(--sidebar-muted)]",
            "transition-colors duration-200 ease-[var(--ease-out-soft)]",
            "hover:bg-white/[0.055] hover:text-white",
            "disabled:cursor-not-allowed disabled:opacity-60",
            collapsed ? "justify-center" : "gap-3 px-3",
          ].join(" ")}
        >
          {signingOut ? (
            <Loader2 size={17} strokeWidth={1.9} className="animate-spin" />
          ) : (
            <LogOut size={17} strokeWidth={1.9} />
          )}
          {!collapsed && (
            <span className="text-[14px] font-medium">
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          )}
        </button>
      </div>

      {/* Collapse handle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="
          absolute -right-3 top-[90px]
          flex h-7 w-7 items-center justify-center
          rounded-full border border-white/[0.14]
          bg-[#171614]/85 text-white/70
          shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)]
          backdrop-blur-xl
          transition-all duration-300 ease-[var(--ease-out-soft)]
          hover:scale-110 hover:text-white
        "
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}