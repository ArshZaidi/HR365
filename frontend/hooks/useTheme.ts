"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "hr365-theme";

export function useTheme() {
  const [theme, setTheme] =
    useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(
      STORAGE_KEY,
    ) as Theme | null;

    const initialTheme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches
          ? "dark"
          : "light";

    setTheme(initialTheme);

    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark",
    );
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next =
        current === "light" ? "dark" : "light";

      localStorage.setItem(
        STORAGE_KEY,
        next,
      );

      document.documentElement.classList.toggle(
        "dark",
        next === "dark",
      );

      return next;
    });
  };

  return {
    theme,
    toggleTheme,
  };
}