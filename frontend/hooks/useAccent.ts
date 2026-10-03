"use client";

import { useCallback, useEffect, useState } from "react";

import { ACCENT_PALETTES, type AccentPalette } from "@/lib/options";

const STORAGE_KEY = "hr365-accent";
const DEFAULT_ACCENT = "terracotta";

function applyPalette(palette: AccentPalette) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  for (const key of [1, 2, 3, 4, 5, 6] as const) {
    root.style.setProperty(`--accent-${key}`, palette.ramp[key]);
    root.style.setProperty(`--accent-${key}-soft`, palette.soft[key]);
  }

  // The main `--accent` mirrors slot 1
  root.style.setProperty("--accent", palette.ramp[1]);
  root.style.setProperty("--accent-soft", palette.soft[1]);
}

export function useAccent() {
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  /* Apply saved palette on mount (every page that calls this hook). */
  useEffect(() => {
    const saved =
      (typeof localStorage !== "undefined" &&
        localStorage.getItem(STORAGE_KEY)) ||
      DEFAULT_ACCENT;

    const palette =
      ACCENT_PALETTES.find((p) => p.id === saved) || ACCENT_PALETTES[0];

    setAccentState(palette.id);
    applyPalette(palette);
  }, []);

  const setAccent = useCallback((id: string) => {
    const palette =
      ACCENT_PALETTES.find((p) => p.id === id) || ACCENT_PALETTES[0];

    setAccentState(palette.id);
    applyPalette(palette);
    localStorage.setItem(STORAGE_KEY, palette.id);
  }, []);

  return { accent, setAccent };
}