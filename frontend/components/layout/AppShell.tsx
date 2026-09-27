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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    initSmoothScroll();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-start">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}