"use client";

import Lenis from "lenis";

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (lenis) return lenis;

  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
  });

  function raf(time: number) {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return lenis;
}