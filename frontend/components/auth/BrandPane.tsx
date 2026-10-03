import Link from "next/link";
import { Bot, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

interface BrandPaneProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

const features = [
  {
    icon: Bot,
    title: "AI-powered answers",
    description: "Ask HR365 anything — policies, leave, benefits.",
    tone: "var(--accent-2)",
    soft: "var(--accent-2-soft)",
  },
  {
    icon: CalendarDays,
    title: "Leave & attendance",
    description: "Track time-off and check-in history in one place.",
    tone: "var(--accent-4)",
    soft: "var(--accent-4-soft)",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade",
    description: "Built for teams that take privacy seriously.",
    tone: "var(--accent-1)",
    soft: "var(--accent-1-soft)",
  },
];

export function BrandPane({ eyebrow, title, subtitle }: BrandPaneProps) {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex">
      {/* Ambient mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.22] blur-[130px]"
          style={{ background: "var(--accent-1)" }}
        />
        <div
          className="absolute top-1/3 -right-32 h-[560px] w-[560px] rounded-full opacity-[0.18] blur-[140px]"
          style={{ background: "var(--accent-2)" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 h-[480px] w-[480px] rounded-full opacity-[0.16] blur-[130px]"
          style={{ background: "var(--accent-6)" }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative flex w-full flex-col justify-between p-10 lg:p-14">
        {/* Top: brand */}
        <Link href="/" className="inline-flex w-fit items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-[16px] font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
              boxShadow:
                "0 12px 32px -10px var(--accent-1), inset 0 1px 0 rgba(255,255,255,0.32)",
            }}
          >
            H
          </span>

          <div>
            <p className="font-display text-[19px] leading-none font-medium tracking-[-0.02em] text-white">
              HR365
            </p>
            <p className="mt-1 text-[11.5px] font-medium tracking-[0.02em] text-white/50">
              Intelligent HR
            </p>
          </div>
        </Link>

        {/* Middle: message */}
        <div className="max-w-lg">
          {eyebrow && (
            <p
              className="text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: "var(--accent-1)" }}
            >
              {eyebrow}
            </p>
          )}

          <h2 className="font-display mt-4 text-[2.25rem] leading-[1.1] font-medium tracking-[-0.035em] text-white lg:text-[2.75rem]">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-5 text-[15px] leading-[1.75] text-white/60">
              {subtitle}
            </p>
          )}

          <div className="mt-10 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="flex items-start gap-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: feature.soft,
                      color: feature.tone,
                    }}
                  >
                    <Icon size={16} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-5 text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: trust */}
        <div className="flex items-center gap-3 text-[12px] text-white/40">
          <Sparkles size={13} style={{ color: "var(--accent-2)" }} />
          <span>Trusted by people teams across the world.</span>
        </div>
      </div>
    </aside>
  );
}