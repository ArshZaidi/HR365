"use client";

import { ReactNode, useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NoticeToast from "@/components/notices/NoticeToast";
import { initSmoothScroll } from "@/lib/smooth-scroll";
import { useAccent } from "@/hooks/useAccent";

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useAccent();

  useEffect(() => {
    initSmoothScroll();
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-48 -left-32 h-[560px] w-[560px] rounded-full bg-[var(--accent-1)] opacity-[0.13] blur-[130px]" />
        <div className="absolute top-1/4 -right-32 h-[640px] w-[640px] rounded-full bg-[var(--accent-2)] opacity-[0.11] blur-[150px]" />
        <div className="absolute -bottom-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[var(--accent-3)] opacity-[0.10] blur-[140px]" />
        <div className="absolute top-1/2 left-1/3 h-[380px] w-[380px] rounded-full bg-[var(--accent-5)] opacity-[0.07] blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuToggle={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative h-full w-[280px]">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <NoticeToast />
    </div>
  );
}