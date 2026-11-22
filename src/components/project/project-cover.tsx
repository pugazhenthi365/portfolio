import { ViewTransition } from "react";
import Image from "next/image";
import { Parallax } from "@/components/motion/parallax";
import { coverTransitionName } from "@/components/motion/page-transition";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

type CoverProject = Pick<Project, "title" | "slug" | "category" | "cover_image_url" | "cover_image_alt" | "tech_stack">;

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const patterns = [
  // fine grid
  "bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:28px_28px]",
  // dots
  "bg-[radial-gradient(var(--line-strong)_1px,transparent_1.2px)] bg-[size:16px_16px]",
  // horizontal rules
  "bg-[linear-gradient(var(--line)_1px,transparent_1px)] bg-[size:100%_22px]",
];

/**
 * Renders the project cover image, or — when no image has been uploaded yet —
 * a deliberate typographic cover generated from the project's own data.
 * (Missing images are flagged in the admin dashboard and docs/ASSETS.md.)
 */
export function ProjectCover({
  project,
  sizes,
  priority,
  className,
  imageClassName,
  compact,
  morph,
  parallax,
}: {
  project: CoverProject;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
  /** Give the cover a shared-element view-transition name (listing ↔ case study). */
  morph?: boolean;
  /** Gentle scroll parallax range in px (desktop only). */
  parallax?: number;
}) {
  const withMorph = (node: React.ReactElement) =>
    morph ? (
      <ViewTransition name={coverTransitionName(project.slug)} share="project-morph" default="none">
        {node}
      </ViewTransition>
    ) : (
      node
    );
  const withParallax = (node: React.ReactNode) => (parallax ? <Parallax range={parallax}>{node}</Parallax> : node);

  if (project.cover_image_url) {
    return withMorph(
      <div className={cn("relative overflow-hidden bg-subtle", className)}>
        {withParallax(
          <Image
            src={project.cover_image_url}
            alt={project.cover_image_alt || `${project.title} — project cover`}
            fill
            sizes={sizes}
            priority={priority}
            className={cn("object-cover", imageClassName)}
          />,
        )}
      </div>,
    );
  }

  const h = hash(project.slug);
  const pattern = patterns[h % patterns.length];
  const words = project.title.split(/\s+/);

  return withMorph(
    <div
      role="img"
      aria-label={`${project.title} — typographic cover`}
      data-placeholder-cover="true"
      className={cn("relative overflow-hidden bg-subtle", className)}
    >
      {withParallax(<div aria-hidden className={cn("absolute inset-0 opacity-70", pattern, imageClassName)} />)}
      <div aria-hidden className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-accent-soft to-transparent" />
      <div aria-hidden className="relative flex h-full flex-col justify-between p-[6%]">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[0.65rem] tracking-[0.1em] text-muted uppercase">{project.category}</span>
          <span className="size-2 bg-accent" />
        </div>
        <div>
          <p
            className={cn(
              "font-semibold tracking-[-0.04em] text-fg",
              compact ? "text-[clamp(1.2rem,3.2vw,1.8rem)] leading-[1.02]" : "text-[clamp(1.6rem,4.4vw,3.4rem)] leading-[0.98]",
            )}
          >
            {words.map((w, i) => (
              <span key={i} className={i === words.length - 1 ? "text-accent" : undefined}>
                {w}{" "}
              </span>
            ))}
          </p>
          {project.tech_stack.length && !compact ? (
            <p className="mt-4 hidden font-mono text-[0.68rem] text-muted sm:block">
              {project.tech_stack.slice(0, 5).join(" / ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
  );
}
