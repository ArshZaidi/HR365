"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hr365-theme");

    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const next = !dark;

    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hr365-theme", next ? "dark" : "light");

    setDark(next);
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-all duration-300 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}