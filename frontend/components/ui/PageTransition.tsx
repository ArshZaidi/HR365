"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}