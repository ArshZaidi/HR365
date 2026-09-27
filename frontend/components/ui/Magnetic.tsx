"use client";

import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ReactNode,
  useRef,
} from "react";

export default function Magnetic({
  children,
  strength = 0.2,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, {
    stiffness: 300,
    damping: 20,
  });

  const springY = useSpring(y, {
    stiffness: 300,
    damping: 20,
  });

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const mouseX =
      event.clientX - rect.left - rect.width / 2;

    const mouseY =
      event.clientY - rect.top - rect.height / 2;

    x.set(mouseX * strength);
    y.set(mouseY * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{
        x: springX,
        y: springY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}