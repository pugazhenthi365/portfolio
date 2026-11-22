import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CopyEmail } from "@/components/home/copy-email";
import { ContactForm } from "@/components/home/contact-form";
import { hostname } from "@/lib/utils";
import type { Profile, SiteSettings } from "@/lib/types";

export function ContactSection({ profile, settings }: { profile: Profile; settings: SiteSettings }) {
  const channels = [
    profile.linkedin_url ? { label: "LinkedIn", href: profile.linkedin_url } : null,
    profile.github_url ? { label: "GitHub", href: profile.github_url } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-subtle py-20 md:py-28">
      <div className="page-container">
        <Reveal className="mb-12 grid gap-6 border-t border-line pt-6 md:grid-cols-12">
          <p className="label md:col-span-3">
            <span className="text-accent">07</span>
            <span className="mx-2 text-faint" aria-hidden>/</span>Contact
          </p>
        </Reveal>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <h2 id="contact-title" className="display text-[clamp(2.2rem,4.6vw,3.8rem)] text-fg">
              {settings.contact_heading}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">{settings.contact_text}</p>

            <dl className="mt-10 border-t border-line">
              <div className="flex items-center justify-between gap-4 border-b border-line py-4">
                <dt className="label">Email</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  <a href={`mailto:${profile.email}`} className="link-underline truncate text-[0.95rem] text-fg">
                    {profile.email}
                  </a>
                  <CopyEmail email={profile.email} />
                </dd>
              </div>
              {channels.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-4 border-b border-line py-4">
                  <dt className="label">{c.label}</dt>
                  <dd>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 text-[0.95rem] text-fg"
                    >
                      <span className="link-underline">{hostname(c.href)}{new URL(c.href).pathname.replace(/\/$/, "")}</span>
                      <ArrowUpRight className="size-3.5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-b border-line py-4">
                <dt className="label">Location</dt>
                <dd className="text-[0.95rem] text-fg">{profile.location}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
            <div className="relative rounded-[3px] border border-line bg-bg p-6 sm:p-8">
              {settings.contact_form_enabled ? (
                <>
                  <h3 className="mb-6 text-lg font-semibold tracking-[-0.02em] text-fg">Send a message</h3>
                  <ContactForm email={profile.email} />
                </>
              ) : (
                <p className="text-muted">
                  The contact form is currently closed. Please reach me at{" "}
                  <a className="text-accent underline underline-offset-2" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                  .
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
