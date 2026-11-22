import { ArrowUp } from "lucide-react";
import type { Profile } from "@/lib/types";

export function SiteFooter({ profile, note }: { profile: Profile; note?: string | null }) {
  const year = new Date().getFullYear();
  const links = [
    { href: `mailto:${profile.email}`, label: "Email" },
    profile.linkedin_url ? { href: profile.linkedin_url, label: "LinkedIn" } : null,
    profile.github_url ? { href: profile.github_url, label: "GitHub" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="border-t border-line">
      <div className="page-container grid gap-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-6">
          <p className="text-lg font-semibold tracking-[-0.02em]">
            {profile.full_name}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {profile.title} · {profile.location}
          </p>
          {note ? <p className="mt-4 max-w-sm text-sm text-muted">{note}</p> : null}
        </div>
        <nav aria-label="Footer" className="md:col-span-4">
          <p className="label mb-4">Elsewhere</p>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="link-underline text-sm text-fg"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-start md:col-span-2 md:justify-end">
          <a href="#top" className="label inline-flex items-center gap-2 transition-colors hover:text-fg">
            Back to top <ArrowUp className="size-3.5" aria-hidden />
          </a>
        </div>
        <p className="label border-t border-line pt-6 md:col-span-12">
          © {year} {profile.full_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
