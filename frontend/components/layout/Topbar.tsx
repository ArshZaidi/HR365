"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export default function Topbar({
  onMenuToggle,
}: TopbarProps) {
  const { profile, loading: profileLoading } =
    useProfile();

  const { theme, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] =
    useState(false);

  const menuRef = useRef<HTMLDivElement | null>(
    null,
  );

  /*
   * Close profile dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /*
   * Close dropdown/search with Escape.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /*
   * Keyboard shortcut for search.
   */
  useEffect(() => {
    const handleShortcut = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !isTyping
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener(
      "keydown",
      handleShortcut,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleShortcut,
      );
    };
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
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  const displayName =
    profile?.full_name ||
    (profileLoading ? "Loading profile" : "User");

  const displayRole =
    profile?.designation ||
    profile?.role ||
    (profileLoading ? "Please wait..." : "Employee");

  return (
    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-40
        h-[76px]
        border-b
        border-[var(--border)]
        bg-[var(--surface)]/90
        backdrop-blur-xl
        lg:left-[260px]
      "
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu */}
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Open navigation"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-[var(--muted)]
                transition
                hover:bg-[var(--surface-hover)]
                hover:text-[var(--foreground)]
                lg:hidden
              "
            >
              <Menu size={19} />
            </button>
          )}

          {/* Desktop search */}
          <button
            type="button"
            onClick={() =>
              setSearchOpen((value) => !value)
            }
            className="
              hidden
              h-10
              w-64
              items-center
              gap-2
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface-hover)]/40
              px-3
              text-left
              transition
              hover:border-[var(--foreground)]/20
              hover:bg-[var(--surface-hover)]
              md:flex
            "
          >
            <Search
              size={16}
              className="shrink-0 text-[var(--muted)]"
            />

            <span className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">
              Search HR365
            </span>

            <span
              className="
                rounded-md
                border
                border-[var(--border)]
                px-1.5
                py-0.5
                text-[10px]
                text-[var(--muted)]
              "
            >
              /
            </span>
          </button>

          {/* Mobile brand */}
          <div className="text-base font-semibold tracking-tight text-[var(--foreground)] md:hidden">
            HR365
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Search button on mobile */}
          <button
            type="button"
            onClick={() =>
              setSearchOpen((value) => !value)
            }
            aria-label="Search HR365"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-[var(--muted)]
              transition
              hover:bg-[var(--surface-hover)]
              hover:text-[var(--foreground)]
              md:hidden
            "
          >
            <Search size={17} />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={
              theme === "dark"
                ? "Light theme"
                : "Dark theme"
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-[var(--muted)]
              transition
              hover:bg-[var(--surface-hover)]
              hover:text-[var(--foreground)]
            "
          >
            {theme === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          {/* =================================================
              PROFILE
          ================================================== */}

          <div
            ref={menuRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setMenuOpen((value) => !value)
              }
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-1.5
                py-1.5
                transition
                hover:bg-[var(--surface-hover)]
                sm:gap-3
                sm:px-2
              "
            >
              {/* Name */}
              <div className="hidden text-right sm:block">
                <div className="max-w-[160px] truncate text-sm font-medium text-[var(--foreground)]">
                  {displayName}
                </div>

                <div className="max-w-[160px] truncate text-xs text-[var(--muted)]">
                  {displayRole}
                </div>
              </div>

              {/* Avatar */}
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--accent)]
                  text-xs
                  font-semibold
                  text-white
                "
              >
                {initials}
              </div>

              <ChevronDown
                size={15}
                className={`
                  hidden
                  text-[var(--muted)]
                  transition-transform
                  sm:block
                  ${menuOpen ? "rotate-180" : ""}
                `}
              />
            </button>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================== */}

            {menuOpen && (
              <div
                role="menu"
                className="
                  absolute
                  right-0
                  top-[calc(100%+8px)]
                  w-64
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  shadow-2xl
                "
              >
                {/* User information */}
                <div className="border-b border-[var(--border)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[var(--accent)]
                        text-xs
                        font-semibold
                        text-white
                      "
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--foreground)]">
                        {displayName}
                      </div>

                      <div className="truncate text-xs text-[var(--muted)]">
                        {profile?.email || ""}
                      </div>
                    </div>
                  </div>

                  {profile?.department && (
                    <div className="mt-3 rounded-xl bg-[var(--surface-hover)] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Department
                      </div>

                      <div className="mt-0.5 text-xs font-medium text-[var(--foreground)]">
                        {profile.department}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile row */}
                <div className="p-2">
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-sm
                      text-[var(--muted)]
                    "
                  >
                    <User size={16} />

                    <div>
                      <div className="text-xs text-[var(--muted)]">
                        Account
                      </div>

                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {profile?.role || "Employee"}
                      </div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    disabled={signingOut}
                    className="
                      mt-1
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      text-[var(--muted)]
                      transition
                      hover:bg-[var(--surface-hover)]
                      hover:text-[var(--foreground)]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <LogOut size={16} />

                    <span>
                      {signingOut
                        ? "Signing out..."
                        : "Sign out"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================
          SEARCH OVERLAY
      ======================================================== */}

      {searchOpen && (
        <div className="absolute left-0 right-0 top-[76px] border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
          <div className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/50 px-3">
            <Search
              size={17}
              className="text-[var(--muted)]"
            />

            <input
              autoFocus
              type="text"
              placeholder="Search HR365..."
              className="
                min-w-0
                flex-1
                bg-transparent
                text-sm
                text-[var(--foreground)]
                outline-none
                placeholder:text-[var(--muted)]
              "
            />
          </div>
        </div>
      )}
    </header>
  );
}