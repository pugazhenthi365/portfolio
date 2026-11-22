import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center">
      <div className="page-container">
        <p className="label">
          <span className="text-accent">Error 404</span>
          <span className="mx-2 text-faint" aria-hidden>/</span>Not found
        </p>
        <h1 className="display mt-6 max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)] text-fg">
          This page doesn&apos;t exist<span className="text-accent">.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted">
          The link may be outdated, or the project may have been unpublished.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-medium text-accent-fg transition-colors hover:bg-accent-strong"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
          <Link
            href="/projects"
            className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 font-medium text-fg transition-colors hover:bg-subtle"
          >
            View projects
          </Link>
        </div>
      </div>
    </main>
  );
}
