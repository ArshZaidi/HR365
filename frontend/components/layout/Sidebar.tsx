"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: Bot,
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarDays,
  },
  {
    label: "Leave",
    href: "/leave",
    icon: ClipboardList,
  },
  {
    label: "Requests",
    href: "/requests",
    icon: ClipboardList,
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        sticky top-0 z-40
        hidden h-screen shrink-0 self-start
        flex-col
        border-r border-[var(--border)]
        bg-[var(--sidebar)]
        text-[var(--sidebar-foreground)]
        lg:flex
        transition-[width]
        duration-500
        ease-[cubic-bezier(.22,1,.36,1)]
        ${collapsed ? "w-[76px]" : "w-[250px]"}
      `}
    >
      {/* Logo */}
      <div
        className={`flex h-20 shrink-0 items-center ${
          collapsed ? "justify-center" : "px-6"
        }`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-black">
            H
          </div>

          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-[15px] font-medium tracking-[-0.01em]">
                HR365
              </div>

              <div className="mt-0.5 text-[10px] text-[var(--sidebar-muted)]">
                Intelligent HR
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pt-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
            Workspace
          </p>
        )}

        <div className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex h-10 items-center rounded-lg
                  transition-all duration-200
                  ${collapsed ? "justify-center" : "gap-3 px-3"}
                  ${
                    active
                      ? "bg-[var(--sidebar-active)] text-white"
                      : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                  }
                `}
              >
                <Icon
                  size={17}
                  strokeWidth={1.7}
                  className="shrink-0"
                />

                {!collapsed && (
                  <span className="text-[13px] tracking-[-0.01em]">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <p className="mb-3 mt-9 px-3 text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
            Management
          </p>
        )}

        <Link
          href="/hr"
          title={collapsed ? "HR Dashboard" : undefined}
          className={`
            flex h-10 items-center rounded-lg
            transition-all duration-200
            ${collapsed ? "justify-center" : "gap-3 px-3"}
            ${
              pathname.startsWith("/hr")
                ? "bg-[var(--sidebar-active)] text-white"
                : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white"
            }
          `}
        >
          <Users
            size={17}
            strokeWidth={1.7}
            className="shrink-0"
          />

          {!collapsed && (
            <span className="text-[13px] tracking-[-0.01em]">
              HR Dashboard
            </span>
          )}
        </Link>
      </nav>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`
            flex h-10 items-center rounded-lg
            text-[var(--sidebar-muted)]
            transition hover:bg-[var(--sidebar-hover)] hover:text-white
            ${collapsed ? "justify-center" : "gap-3 px-3"}
          `}
        >
          <Settings size={17} strokeWidth={1.7} />

          {!collapsed && (
            <span className="text-[13px]">
              Settings
            </span>
          )}
        </Link>

        <button
          title={collapsed ? "Sign out" : undefined}
          className={`
            mt-1 flex h-10 w-full items-center rounded-lg
            text-[var(--sidebar-muted)]
            transition hover:bg-[var(--sidebar-hover)] hover:text-white
            ${collapsed ? "justify-center" : "gap-3 px-3"}
          `}
        >
          <LogOut size={17} strokeWidth={1.7} />

          {!collapsed && (
            <span className="text-[13px]">
              Sign out
            </span>
          )}
        </button>
      </div>

      {/* Collapse control */}
      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="
          absolute -right-3 top-[72px]
          flex h-6 w-6 items-center justify-center
          rounded-full
          border border-[var(--border)]
          bg-[var(--surface)]
          text-[var(--muted)]
          shadow-sm
          transition
          hover:text-[var(--foreground)]
        "
      >
        {collapsed ? (
          <ChevronRight size={13} />
        ) : (
          <ChevronLeft size={13} />
        )}
      </button>
    </aside>
  );
}