"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import { initSmoothScroll } from "@/lib/smooth-scroll";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    initSmoothScroll();

    const onboardingComplete =
      window.localStorage.getItem(
        "hr365_onboarding_complete",
      );

    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  /*
   * Prevent hydration mismatch while checking
   * the onboarding state in localStorage.
   */
  if (!mounted) {
    return null;
  }

  /*
   * First-time onboarding / startup experience.
   *
   * This replaces the old Render waiting screen.
   */
  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <Sidebar
          collapsed={collapsed}
          onToggle={() =>
            setCollapsed(
              (current) => !current,
            )
          }
        />

        {/* =====================================================
            MAIN APPLICATION
        ===================================================== */}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar
            onMenuToggle={() =>
              setMobileOpen(true)
            }
          />

          {/*
           * IMPORTANT:
           *
           * Topbar is sticky and already occupies its
           * 72px height in the layout.
           *
           * Do NOT add pt-[68px] here.
           *
           * That was causing the entire assistant content
           * to be pushed down.
           */}
          <main className="min-h-0 min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* =======================================================
          MOBILE NAVIGATION
      ======================================================= */}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
            className="
              absolute inset-0
              bg-black/50
              backdrop-blur-sm
            "
          />

          {/* Mobile sidebar */}

          <div className="relative h-full w-[260px]">
            <Sidebar
              collapsed={false}
              onToggle={() =>
                setMobileOpen(false)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}