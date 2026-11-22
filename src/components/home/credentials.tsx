import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/site/section-header";
import type { Certification, Education } from "@/lib/types";

export function EducationSection({ education }: { education: Education[] }) {
  if (!education.length) return null;
  return (
    <section id="education" aria-labelledby="education-title" className="py-20 md:py-28">
      <div className="page-container">
        <SectionHeader id="education-title" index="05" label="Education" title="Education" />
        <div className="border-b border-line">
          {education.map((e) => (
            <Reveal key={e.id}>
              <article className="grid gap-4 border-t border-line py-8 md:grid-cols-12 md:gap-10 md:py-10">
                <p className="label md:col-span-3">
                  {[e.start_year, e.end_year].filter(Boolean).join(" — ")}
                </p>
                <div className="md:col-span-6">
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-fg md:text-2xl">{e.degree}</h3>
                  {e.field ? <p className="mt-1 text-lg text-fg/80">{e.field}</p> : null}
                  <p className="mt-3 text-muted">{e.institution}</p>
                  {e.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{e.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 md:col-span-3 md:flex-col md:items-end md:text-right">
                  {e.location ? <p className="text-sm text-muted">{e.location}</p> : null}
                  {e.grade ? <p className="font-mono text-sm text-fg">{e.grade}</p> : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CertificationsSection({ items }: { items: Certification[] }) {
  if (!items.length) return null;
  return (
    <section id="certifications" aria-labelledby="certifications-title" className="pb-20 md:pb-28">
      <div className="page-container">
        <SectionHeader
          id="certifications-title"
          index="06"
          label="Recognition"
          title="Certifications and achievements"
        />
        <ul className="grid gap-px overflow-hidden rounded-[3px] border border-line bg-line md:grid-cols-2">
          {items.map((c, i) => (
            <li key={c.id} className="bg-bg">
              <Reveal delay={i * 0.04} className="flex h-full flex-col justify-between gap-8 p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="label">{c.kind === "achievement" ? "Achievement" : "Certification"}</span>
                  {c.issued_on ? <span className="font-mono text-xs text-muted">{c.issued_on}</span> : null}
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-fg md:text-xl">{c.title}</h3>
                  {c.issuer ? <p className="mt-1.5 text-sm text-muted">{c.issuer}</p> : null}
                  {c.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{c.description}</p> : null}
                  {c.credential_url ? (
                    <a
                      href={c.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
                    >
                      <span className="link-underline">View credential</span>
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
