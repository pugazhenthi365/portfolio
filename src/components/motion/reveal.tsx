"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number };

/**
 * Fades and lifts content into view once.
 * Users who prefer reduced motion get static content with no animation at all.
 */
export function Reveal({ delay = 0, y = 18, children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <motion.div {...props}>{children}</motion.div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
