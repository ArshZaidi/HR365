"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/* ================================================================
   TONES — 1..6 map to --accent-1..--accent-6
================================================================ */

export type Tone = 1 | 2 | 3 | 4 | 5 | 6;

export function toneBg(tone: Tone, mode: "solid" | "soft" | "gradient") {
  if (mode === "solid") return `var(--accent-${tone})`;
  if (mode === "soft") return `var(--accent-${tone}-soft)`;
  return `linear-gradient(135deg, var(--accent-${tone}), color-mix(in oklab, var(--accent-${tone}) 55%, black))`;
}

/* ================================================================
   GLASS PANEL — the base card for everything
================================================================ */

export function GlassPanel({
  title,
  subtitle,
  tone,
  actionLabel,
  actionHref,
  padded = true,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  tone?: Tone;
  actionLabel?: string;
  actionHref?: string;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title);

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl",
        "border border-[var(--glass-border)]",
        "bg-[var(--glass-bg)] backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]",
        "transition-all duration-500 ease-[var(--ease-out-soft)]",
        "hover:shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-md)]",
        className,
      ].join(" ")}
    >
      {tone && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full opacity-[0.14] blur-[80px] transition-opacity duration-500 group-hover:opacity-[0.22]"
          style={{ background: `var(--accent-${tone})` }}
        />
      )}

      {hasHeader && (
        <div className="relative flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {tone && (
              <span
                className="h-6 w-1 shrink-0 rounded-full"
                style={{ background: `var(--accent-${tone})` }}
              />
            )}
            <div className="min-w-0">
              <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
                {title}
              </p>
              {subtitle && (
                <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="
                group/cta inline-flex shrink-0 items-center gap-1
                rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium
                text-[var(--muted)]
                transition-colors duration-200 ease-[var(--ease-out-soft)]
                hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]
              "
            >
              {actionLabel}
              <ChevronRight
                size={13}
                className="transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/cta:translate-x-0.5"
              />
            </Link>
          )}
        </div>
      )}

      <div className={padded ? "relative p-5 sm:p-6" : "relative"}>
        {children}
      </div>
    </div>
  );
}

/* ================================================================
   PAGE HEADER — bordered strip at top of any page
================================================================ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-10">
        <div className="min-w-0">
          {eyebrow}

          <h1 className="font-display mt-4 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em] sm:text-[2.5rem] lg:text-[3rem]">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-[var(--muted)]">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   PAGE BODY — container
================================================================ */

export function PageBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-[1600px] space-y-6 px-5 py-7 sm:px-8 lg:px-10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ================================================================
   BUTTONS
================================================================ */

export function GradientButton({
  href,
  children,
  tone = 1,
  className = "",
  onClick,
  type = "button",
}: {
  href?: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = [
    "group inline-flex h-11 items-center gap-2 rounded-xl",
    "px-5 text-[14px] font-medium text-white",
    "transition-all duration-300 ease-[var(--ease-out-soft)]",
    "hover:-translate-y-0.5",
    className,
  ].join(" ");

  const style = {
    background: `linear-gradient(135deg, var(--accent-${tone}), var(--accent-6) 60%, var(--accent-2))`,
    boxShadow:
      "0 12px 28px -10px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.25)",
  };

  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

export function GlassButton({
  href,
  children,
  className = "",
  onClick,
  type = "button",
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = [
    "inline-flex h-11 items-center gap-2 rounded-xl",
    "border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl",
    "px-4 text-[14px] font-medium",
    "transition-all duration-300 ease-[var(--ease-out-soft)]",
    "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/* ================================================================
   EYEBROW PILL — small badge at top of page header
================================================================ */

export function EyebrowPill({
  children,
  tone = 1,
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-3.5 py-1.5 backdrop-blur-xl">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `var(--accent-${tone})` }}
      />
      <span className="text-[13px] font-medium text-[var(--muted)]">
        {children}
      </span>
    </div>
  );
}

/* ================================================================
   SECTION HEADING — small label above a grid of cards
================================================================ */

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <p className="font-display text-[17px] font-medium tracking-[-0.015em]">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-[13px] text-[var(--muted)]">{subtitle}</p>
      )}
    </div>
  );
}

/* ================================================================
   STATUS BADGE — unified across requests, leave, attendance
================================================================ */

export function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "success" | "warning" | "info" | "danger" | "neutral";
}) {
  const map = {
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    warning: { bg: "var(--warning-soft)", fg: "var(--warning)" },
    info: { bg: "var(--info-soft)", fg: "var(--info)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    neutral: { bg: "var(--surface-hover)", fg: "var(--muted)" },
  } as const;

  const s = map[variant];

  return (
    <span
      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.01em]"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

/* ================================================================
   ICON CHIP — gradient square used in KPIs, quick actions, rows
================================================================ */

export function IconChip({
  tone,
  size = "md",
  interactive = false,
  children,
}: {
  tone: Tone;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  children: ReactNode;
}) {
  const dims =
    size === "sm" ? "h-9 w-9 rounded-lg" : size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";

  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center text-white",
        dims,
        interactive
          ? "transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-[1.08]"
          : "",
      ].join(" ")}
      style={{
        background: `linear-gradient(135deg, var(--accent-${tone}), color-mix(in oklab, var(--accent-${tone}) 55%, black))`,
        boxShadow:
          "0 8px 20px -8px rgba(23, 22, 20, 0.28), inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {children}
    </span>
  );
}