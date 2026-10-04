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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] =
    useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    initSmoothScroll();

    const onboardingComplete =
      window.localStorage.getItem(
        "hr365_onboarding_complete"
      );

    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  /*
   * Prevent hydration mismatch and avoid rendering
   * the application before the client has checked
   * localStorage.
   */
  if (!mounted) {
    return null;
  }

  /*
   * First-time authenticated experience.
   *
   * OnboardingScreen handles the Render cold-start
   * silently in the background. The user never sees
   * the old "Waking up your workspace" screen.
   */
  if (showOnboarding) {
    return (
      <OnboardingScreen />
    );
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
            setCollapsed((current) => !current)
          }
        />

        {/* =====================================================
            MAIN APPLICATION
            ===================================================== */}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onMenuToggle={() =>
              setMobileOpen(true)
            }
          />

          <main className="min-w-0 flex-1 pt-[68px]">
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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