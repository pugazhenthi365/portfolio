import { ViewTransition } from "react";

/**
 * Wraps a public page so route changes animate with the browser's View
 * Transitions API (React <ViewTransition>, no extra library):
 *
 * - links tagged `nav-forward` (into a case study) → old page lifts out,
 *   new page rises in by a few pixels;
 * - links tagged `nav-back` → the same, reversed;
 * - untagged navigations (browser back/forward) → a short crossfade.
 *
 * Unsupported browsers simply navigate instantly. Durations are zeroed for
 * prefers-reduced-motion in globals.css. Must be used in page.tsx files
 * (layouts persist, so enter/exit would never fire there).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const classes = { "nav-forward": "page-forward", "nav-back": "page-back", default: "page-fade" };
  return (
    <ViewTransition enter={classes} exit={classes} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

/** Shared-element name for a project's cover, used on listings and the case study. */
export const coverTransitionName = (slug: string) => `project-cover-${slug}`;
