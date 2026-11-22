import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/site/section-header";
import { paragraphs } from "@/lib/utils";
import type { Education, Experience, Profile } from "@/lib/types";

export function About({
  profile,
  current,
  education,
}: {
  profile: Profile;
  current: Experience | null;
  education: Education | null;
}) {
  const [lead, ...rest] = paragraphs(profile.about);

  const facts = [
    { term: "Based in", value: profile.location },
    profile.experience_summary ? { term: "Experience", value: profile.experience_summary } : null,
    current ? { term: "Currently", value: `${current.role}, ${current.company.replace(/\s*\(P\)\s*Ltd\.?$/i, "")}` } : null,
    education
      ? {
          term: "Education",
          value: `${education.degree.replace(/\s*\(.*\)$/, "")}${education.field ? `, ${education.field}` : ""}${education.end_year ? ` · ${education.end_year}` : ""}`,
        }
      : null,
  ].filter(Boolean) as { term: string; value: string }[];

  return (
    <section id="about" aria-labelledby="about-title" className="py-20 md:py-28">
      <div className="page-container">
        <SectionHeader id="about-title" index="01" label="About" title="An engineer who builds for how work actually gets done." />
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-1">
              {facts.map((f) => (
                <div key={f.term}>
                  <dt className="label">{f.term}</dt>
                  <dd className="mt-1.5 text-[0.95rem] leading-snug text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={0.08} className="md:col-span-9 lg:col-span-8">
            {lead ? (
              <p className="text-[clamp(1.25rem,2.1vw,1.6rem)] leading-[1.45] tracking-[-0.015em] text-fg">{lead}</p>
            ) : null}
            {rest.length ? (
              <div className="prose-body mt-8 max-w-2xl text-base leading-[1.75] text-muted md:text-[1.05rem]">
                {rest.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
