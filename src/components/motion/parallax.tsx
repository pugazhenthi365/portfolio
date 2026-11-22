"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Gentle scroll parallax for media inside an `overflow-hidden` frame.
 *
 * - Scroll-linked via Motion's useScroll (ScrollTimeline where supported,
 *   otherwise a single rAF-batched listener) and applied as a transform only,
 *   so it never triggers layout or blocks scrolling.
 * - The moving layer is `range` px taller than the frame on each side, so no
 *   edge is ever exposed.
 * - Enabled only on wide screens with a fine pointer (desktop/laptop) and
 *   never when the visitor prefers reduced motion.
 * - `anchor="top"` keeps the offset at 0 when the page is at the very top
 *   (used for the hero, so nothing shifts on hydration).
 */
export function Parallax({
  children,
  range = 12,
  anchor = "center",
  className,
}: {
  children: React.ReactNode;
  range?: number;
  anchor?: "center" | "top";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: anchor === "top" ? ["start start", "end start"] : ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], anchor === "top" ? [0, range] : [-range, range]);
  const active = enabled && !reduce;

  return (
    <div ref={ref} className={cn("absolute inset-0", className)}>
      <motion.div className="absolute inset-x-0" style={{ top: -range, bottom: -range, y: active ? y : 0 }}>
        {children}
      </motion.div>
    </div>
  );
}
