"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { BrandPane } from "@/components/auth/BrandPane";
import { DEPARTMENTS, DESIGNATIONS } from "@/lib/options";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          department: department || null,
          designation: designation || null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
      <BrandPane
        eyebrow="Get started"
        title="Create your HR365 account."
        subtitle="Join your workspace to manage leave, attendance, and HR requests in one place."
      />

      <div className="relative flex items-center justify-center bg-[var(--background)] px-5 py-12 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full opacity-[0.10] blur-[110px] lg:hidden"
          style={{ background: "var(--accent-4)" }}
        />

        <div className="relative w-full max-w-[480px]">
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
                Create account
              </h1>
              <p className="mt-2 text-[14px] text-[var(--muted)]">
                Set up your HR365 workspace in under a minute.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className={labelBase}>Full name</label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className={inputBase}
                  />
                </div>
              </div>

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
                    onChange={(e) => setEmail(e.target.value)}
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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputBase} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                <p className="mt-2 text-[11.5px] text-[var(--muted)]">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Optional: work info */}
              <div className="border-t border-[var(--border)] pt-5">
                <p className="mb-3 text-[11.5px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Work info (optional)
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Designation</label>
                    <div className="relative">
                      <Briefcase
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        list="signup-designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Software Engineer"
                        className={inputBase}
                      />
                      <datalist id="signup-designation">
                        {DESIGNATIONS.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Department</label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
                      />
                      <input
                        list="signup-department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Engineering"
                        className={inputBase}
                      />
                      <datalist id="signup-department">
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11.5px] text-[var(--muted)]">
                  You can update these anytime from Settings.
                </p>
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
                    Create account
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
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium transition-opacity duration-200 hover:opacity-80"
                  style={{ color: "var(--accent-1)" }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11.5px] leading-5 text-[var(--muted)]">
            By creating an account, you agree to HR365&apos;s terms of
            service and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}