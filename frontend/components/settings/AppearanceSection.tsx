"use client";

import { Check, Moon, Sun, Monitor } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { useAccent } from "@/hooks/useAccent";
import { ACCENT_PALETTES } from "@/lib/options";
import { GlassPanel } from "@/components/ui/premium";

export default function AppearanceSection() {
  const { theme, toggleTheme } = useTheme();
  const { accent, setAccent } = useAccent();

  return (
    <GlassPanel
      tone={2}
      title="Appearance"
      subtitle="Personalize how HR365 looks for you"
    >
      {/* ─── Theme mode ──────────────────── */}
      <div>
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase">
          Theme
        </p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <ThemeOption
            active={theme === "light"}
            onClick={() => {
              if (theme === "dark") toggleTheme();
            }}
            icon={<Sun size={16} />}
            label="Light"
            tone={5}
          />
          <ThemeOption
            active={theme === "dark"}
            onClick={() => {
              if (theme === "light") toggleTheme();
            }}
            icon={<Moon size={16} />}
            label="Dark"
            tone={2}
          />
          <ThemeOption
            active={false}
            onClick={() => {
              // Placeholder: system mode — toggling respects user preference
              if (typeof window !== "undefined") {
                const prefersDark = window.matchMedia(
                  "(prefers-color-scheme: dark)",
                ).matches;
                const isDark = theme === "dark";
                if (prefersDark !== isDark) toggleTheme();
              }
            }}
            icon={<Monitor size={16} />}
            label="System"
            tone={3}
            disabled
          />
        </div>
      </div>

      {/* ─── Accent palette ──────────────── */}
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase">
          Accent
        </p>

        <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">
          Changes the accent colors used across the app.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACCENT_PALETTES.map((palette) => {
            const selected = accent === palette.id;

            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => setAccent(palette.id)}
                className={[
                  "group relative overflow-hidden rounded-2xl border p-3.5 text-left",
                  "transition-all duration-300 ease-[var(--ease-out-soft)]",
                  "hover:-translate-y-0.5",
                  selected
                    ? "border-[var(--foreground)] shadow-[var(--shadow-md)]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                      <span
                        key={key}
                        className="h-5 w-5 rounded-full ring-2 ring-[var(--surface)]"
                        style={{
                          background:
                            palette.ramp[key as 1 | 2 | 3 | 4 | 5 | 6],
                        }}
                      />
                    ))}
                  </div>

                  {selected && (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ background: palette.primary }}
                    >
                      <Check size={11} />
                    </span>
                  )}
                </div>

                <p className="mt-3 text-[13px] font-medium">
                  {palette.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

/* ─── Theme option tile ─────────────────── */
function ThemeOption({
  active,
  onClick,
  icon,
  label,
  tone,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "group relative flex flex-col items-center gap-2 rounded-2xl border p-4",
        "transition-all duration-300 ease-[var(--ease-out-soft)]",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-0.5",
        active
          ? "border-[var(--foreground)] bg-[var(--surface)]/60"
          : "border-[var(--border)] hover:border-[var(--border-strong)]",
      ].join(" ")}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          background: `var(--accent-${tone}-soft)`,
          color: `var(--accent-${tone})`,
        }}
      >
        {icon}
      </span>

      <span className="text-[12.5px] font-medium">{label}</span>

      {active && (
        <span
          className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full"
          style={{ background: `var(--accent-${tone})` }}
        />
      )}
    </button>
  );
}