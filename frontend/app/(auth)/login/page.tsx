"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { BrandPane } from "@/components/auth/BrandPane";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputBase = [
    "w-full rounded-xl py-3 pr-4 pl-10 text-[14px]",
    "border border-[var(--border)]",
    "bg-[var(--surface)]/60 backdrop-blur-xl",
    "text-[var(--foreground)] outline-none",
    "transition-all duration-200 ease-[var(--ease-out-soft)]",
    "placeholder:text-[var(--muted)]",
    "focus:border-[var(--border-strong)]",
    "focus:bg-[var(--surface)]/80",
  ].join(" ");

  const labelBase =
    "mb-2 block text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ═══════════ Brand pane ═══════════ */}
      <BrandPane
        eyebrow="Welcome back"
        title="Sign in to your HR workspace."
        subtitle="One place for leave, attendance, HR requests, and instant AI answers."
      />

      {/* ═══════════ Form pane ═══════════ */}
      <div className="relative flex items-center justify-center bg-[var(--background)] px-5 py-12 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full opacity-[0.10] blur-[110px] lg:hidden"
          style={{ background: "var(--accent-1)" }}
        />

        <div className="relative w-full max-w-[440px]">
          {/* Mobile brand */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2.5 lg:hidden"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[15px] font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
                boxShadow:
                  "0 8px 24px -8px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              H
            </span>
            <span className="font-display text-[18px] font-medium tracking-[-0.02em]">
              HR365
            </span>
          </Link>

          <div
            className="
              rounded-3xl border border-[var(--glass-border)]
              bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
              p-7 sm:p-9
              shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-lg)]
            "
          >
            <div className="mb-8">
              <h1 className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.03em]">
                Sign in
              </h1>
              <p className="mt-2 text-[14px] text-[var(--muted)]">
                Use your HR365 credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className={labelBase}>Email</label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label className={labelBase}>Password</label>

                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="
                      absolute top-1/2 right-3 -translate-y-1/2
                      flex h-7 w-7 items-center justify-center rounded-lg
                      text-[var(--muted)]
                      transition-all duration-200 ease-[var(--ease-out-soft)]
                      hover:bg-[var(--surface-hover)]/70
                      hover:text-[var(--foreground)]
                    "
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl border px-4 py-3 text-[13.5px] font-medium"
                  style={{
                    borderColor: "var(--danger)",
                    background: "var(--danger-soft)",
                    color: "var(--danger)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  group inline-flex h-12 w-full items-center justify-center gap-2
                  rounded-xl text-[14.5px] font-medium text-white
                  transition-all duration-300 ease-[var(--ease-out-soft)]
                  hover:-translate-y-0.5
                  disabled:cursor-not-allowed disabled:opacity-60
                "
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
                  boxShadow:
                    "0 16px 36px -14px rgba(210,105,74,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <p className="text-center text-[13.5px] text-[var(--muted)]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium transition-opacity duration-200 hover:opacity-80"
                  style={{ color: "var(--accent-1)" }}
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11.5px] leading-5 text-[var(--muted)]">
            By signing in, you agree to HR365&apos;s terms of service
            and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}