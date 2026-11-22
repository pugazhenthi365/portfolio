"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownToLine, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#work", label: "Work" },
  { href: "#expertise", label: "Expertise" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader({ name, resumeUrl }: { name: string; resumeUrl: string | null }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation and lock body scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const href = (h: string) => (onHome ? h : `/${h}`);

  return (
    <header
      // Keeps the header fixed (not sliding/fading) during page view transitions.
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled || open
          ? "border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="page-container flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-[1.05rem] font-semibold tracking-[-0.02em] text-fg">
            {name}
            <span className="text-accent">.</span>
          </span>
          <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted sm:inline">
            Software Engineer
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={href(item.href)}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-fg/40 hover:bg-subtle sm:inline-flex"
            >
              Resume
              <ArrowDownToLine className="size-3.5" aria-hidden />
            </a>
          ) : null}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-fg hover:bg-subtle lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-bg lg:hidden"
          >
            <nav aria-label="Mobile" className="page-container flex flex-col pt-6 pb-10">
              {NAV.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={href(item.href)}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i + 0.05, duration: 0.4 }}
                  className="flex items-baseline gap-4 border-b border-line py-5 text-3xl font-medium tracking-[-0.03em] text-fg"
                >
                  <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </motion.a>
              ))}
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-medium text-accent-fg"
                >
                  Download Resume <ArrowDownToLine className="size-4" aria-hidden />
                </a>
              ) : null}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
