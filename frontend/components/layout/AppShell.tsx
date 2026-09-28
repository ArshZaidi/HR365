"use client";

import { ReactNode, useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { initSmoothScroll } from "@/lib/smooth-scroll";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    initSmoothScroll();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">

        {/* Desktop sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() =>
            setCollapsed((value) => !value)
          }
        />

        {/* Main application area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Topbar */}
          <Topbar
            onMenuToggle={() =>
              setMobileOpen(true)
            }
          />

          {/* Page content */}
          <main className="min-w-0 flex-1 pt-[68px]">
            {children}
          </main>

        </div>
      </div>

      {/* Mobile sidebar overlay */}
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

          {/* Drawer */}
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