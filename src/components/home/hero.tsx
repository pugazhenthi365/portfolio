import { Fragment } from "react";
import Image from "next/image";
import { ArrowDownToLine, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Parallax } from "@/components/motion/parallax";
import type { Profile } from "@/lib/types";

/*
 * The hero entrance uses CSS keyframes (see globals.css) rather than JS so it
 * starts on first paint — the headline is the LCP element and must not wait
 * for hydration. Motion for React drives the rest of the site's animation.
 */
const rise = (delay: number) => ({ style: { animationDelay: `${delay}s` } as React.CSSProperties });

/** Splits the headline into words; the final two (of 4+) get the accent colour. */
function headlineWords(headline: string) {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const accentFrom = words.length >= 4 ? words.length - 2 : words.length;
  return words.map((word, i) => ({ word, accent: i >= accentFrom }));
}

/*
 * Word-by-word reveal: ~45ms stagger + 300ms per word, so the whole headline
 * settles in about 600ms. Words start at 35% opacity (never invisible), so the
 * headline is readable — and counts as painted for LCP — from the first frame.
 * Only transform/opacity animate (no layout shift). The text stays one plain
 * <h1> string for search engines and screen readers.
 */
const WORD_STAGGER_MS = 45;
const MAX_STAGGER_MS = 300;

export type HeroProfile = Pick<
  Profile,
  "full_name" | "title" | "location" | "headline" | "hero_intro" | "positioning" | "photo_url" | "photo_alt" | "availability_enabled" | "availability_text"
>;

export function Hero({
  profile,
  currentRole,
  hasResume,
}: {
  profile: HeroProfile;
  currentRole: string | null;
  hasResume: boolean;
}) {
  const words = headlineWords(profile.headline);
  // "Versatile Software Engineer | Full-Stack Development | ..." -> focus areas after the first segment.
  const focus = profile.positioning
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(1, 4);

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="page-container grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p style={rise(0.05).style} className="hero-rise label flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-block size-1.5 bg-accent" aria-hidden />
            <span>{profile.title}</span>
            <span className="text-faint" aria-hidden>
              —
            </span>
            <span>{profile.location}</span>
            {profile.availability_enabled && profile.availability_text ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-subtle px-2.5 py-1 normal-case tracking-normal text-fg">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                {profile.availability_text}
              </span>
            ) : null}
          </p>

          <h1 id="hero-title" className="display mt-7 text-[clamp(2.6rem,6.2vw,5rem)] text-fg">
            {words.map(({ word, accent }, i) => (
              <Fragment key={i}>
                <span
                  className={accent ? "hero-word text-accent" : "hero-word"}
                  style={{ animationDelay: `${Math.min(i * WORD_STAGGER_MS, MAX_STAGGER_MS)}ms` }}
                >
                  {word}
                </span>
                {i < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>

          <p style={rise(0.22).style} className="hero-rise mt-7 max-w-xl text-lg leading-relaxed text-muted md:text-xl">
            {profile.hero_intro}
          </p>

          <div style={rise(0.3).style} className="hero-rise mt-9 flex flex-wrap items-center gap-3">
            <LinkButton href="#work" size="lg">
              Explore My Work
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" aria-hidden />
            </LinkButton>
            {hasResume ? (
              <LinkButton href="/resume" variant="secondary" size="lg" target="_blank" rel="noopener noreferrer">
                Download Resume
                <ArrowDownToLine
                  className="size-4 transition-transform duration-300 group-hover/btn:translate-y-0.5"
                  aria-hidden
                />
              </LinkButton>
            ) : null}
          </div>

          {focus.length ? (
            <ul style={rise(0.4).style}
              aria-label="Focus areas"
              className="hero-rise mt-14 grid grid-cols-1 border-t border-line sm:grid-cols-3"
            >
              {focus.map((f, i) => (
                <li
                  key={f}
                  className="flex items-baseline gap-3 border-b border-line py-4 sm:border-b-0 sm:py-5 sm:pr-4 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:pl-4"
                >
                  <span className="font-mono text-[0.7rem] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[0.95rem] font-medium text-fg">{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {profile.photo_url ? (
          <figure
            className="hero-reveal mx-auto w-full max-w-sm sm:max-w-md lg:col-span-5 lg:mr-0 lg:max-w-none"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] border border-line bg-subtle">
              <Parallax range={16} anchor="top">
                <Image
                  src={profile.photo_url}
                  alt={profile.photo_alt || `Portrait of ${profile.full_name}`}
                  fill
                  priority
                  sizes="(min-width: 1240px) 470px, (min-width: 1024px) 38vw, (min-width: 640px) 448px, 90vw"
                  className="object-cover object-[50%_22%]"
                />
              </Parallax>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-accent" />
            </div>
            <figcaption className="mt-4 flex items-start justify-between gap-4">
              <span className="label shrink-0">Fig. 01</span>
              {currentRole ? <span className="label text-right normal-case tracking-normal">{currentRole}</span> : null}
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
