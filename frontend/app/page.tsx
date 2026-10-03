"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function route() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }

    route();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      {/* Ambient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.14] blur-[130px]"
        style={{ background: "var(--accent-1)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full opacity-[0.12] blur-[130px]"
        style={{ background: "var(--accent-2)" }}
      />

      <div className="relative flex flex-col items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-[16px] font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
            boxShadow:
              "0 12px 32px -10px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.32)",
          }}
        >
          H
        </div>

        <div className="flex items-center gap-2 text-[var(--muted)]">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: "var(--accent-1)" }}
          />
          <span className="text-[13px] font-medium">Loading HR365…</span>
        </div>
      </div>
    </div>
  );
}