"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { pad2, projectStatusLabel } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { ProjectCover } from "./project-cover";
import { NAV_FORWARD } from "@/components/motion/page-transition";

/**
 * An editorial index of projects. On pointer devices a small cover preview
 * follows the cursor while hovering a row; touch devices get a plain list.
 */
export type IndexProject = Pick<
  Project,
  "id" | "slug" | "title" | "category" | "project_status" | "cover_image_url" | "cover_image_alt" | "tech_stack"
>;

export function ProjectIndex({ projects, startIndex = 0 }: { projects: IndexProject[]; startIndex?: number }) {
  const [active, setActive] = useState<IndexProject | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.5 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left + 24);
    y.set(e.clientY - rect.top - 90);
  };

  return (
    <div className="relative">
      <ul ref={ref} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="border-b border-line">
        {projects.map((p, i) => (
          <li key={p.id} onPointerEnter={(e) => e.pointerType === "mouse" && setActive(p)}>
            <Link
              href={`/projects/${p.slug}`}
              transitionTypes={NAV_FORWARD}
              className="group grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-4 gap-y-1 border-t border-line py-5 transition-colors md:grid-cols-[3rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] md:py-6"
            >
              <span className="font-mono text-xs text-muted transition-colors group-hover:text-accent">
                {pad2(startIndex + i + 1)}
              </span>
              <span className="text-lg font-medium tracking-[-0.02em] text-fg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-xl md:group-hover:translate-x-1.5">
                {p.title}
              </span>
              <span className="col-start-2 text-sm text-muted md:col-start-auto">{p.category}</span>
              <span className="col-start-2 hidden font-mono text-xs text-muted md:col-start-auto md:block">
                {projectStatusLabel[p.project_status]}
              </span>
              <ArrowUpRight
                aria-hidden
                className="col-start-3 row-start-1 size-4 justify-self-end text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent md:col-start-auto md:row-start-auto"
              />
            </Link>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active ? (
          <motion.div
            key="preview"
            aria-hidden
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute top-0 left-0 z-10 hidden w-[300px] lg:block"
          >
            <ProjectCover
              key={active.id}
              project={active}
              compact
              sizes="300px"
              className="aspect-[4/3] rounded-[3px] border border-line shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)]"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
