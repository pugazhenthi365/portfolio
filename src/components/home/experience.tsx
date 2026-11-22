import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/site/section-header";
import { formatMonthYear, formatRange } from "@/lib/utils";
import type { Experience } from "@/lib/types";

interface CompanyGroup {
  company: string;
  note: string | null;
  location: string | null;
  workMode: string | null;
  roles: Experience[];
}

/** Consecutive entries for the same company become one group showing the role progression. */
function groupByCompany(items: Experience[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.company === item.company) last.roles.push(item);
    else
      groups.push({
        company: item.company,
        note: item.company_note,
        location: item.location,
        workMode: item.work_mode,
        roles: [item],
      });
  }
  return groups;
}

function groupRange(roles: Experience[]) {
  const starts = roles.map((r) => r.start_date).sort();
  const anyCurrent = roles.some((r) => r.is_current || !r.end_date);
  const ends = roles.map((r) => r.end_date).filter(Boolean).sort() as string[];
  return `${formatMonthYear(starts[0])} — ${anyCurrent ? "Present" : formatMonthYear(ends[ends.length - 1])}`;
}

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  if (!experiences.length) return null;
  const groups = groupByCompany(experiences);

  return (
    <section id="experience" aria-labelledby="experience-title" className="bg-subtle py-20 md:py-28">
      <div className="page-container">
        <SectionHeader
          id="experience-title"
          index="02"
          label="Experience"
          title="Professional experience"
          description="From internship to engineering role — building business applications, integrations and AI-assisted software."
        />

        <ol className="space-y-0">
          {groups.map((g, gi) => (
            <li key={`${g.company}-${gi}`}>
              <Reveal className="grid gap-6 border-t border-line py-10 md:grid-cols-12 md:gap-10 md:py-14">
                <div className="md:col-span-4">
                  <p className="label">{groupRange(g.roles)}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-fg md:text-[1.7rem]">{g.company}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {[g.note, g.location, g.workMode].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <ol className="relative md:col-span-8">
                  {/* Vertical progression line */}
                  {g.roles.length > 1 ? (
                    <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-px bg-line-strong" />
                  ) : null}
                  {g.roles.map((r) => (
                    <li key={r.id} className="relative pb-10 pl-8 last:pb-0">
                      <span
                        aria-hidden
                        className={
                          "absolute top-[0.45rem] left-0 size-[11px] rounded-full border-2 " +
                          (r.is_current ? "border-accent bg-accent" : "border-line-strong bg-subtle")
                        }
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h4 className="text-lg font-medium tracking-[-0.015em] text-fg">
                          {r.role}
                          {r.is_current ? (
                            <span className="ml-3 rounded-full bg-accent-soft px-2 py-0.5 align-middle font-mono text-[0.65rem] tracking-[0.06em] text-accent uppercase">
                              Current
                            </span>
                          ) : null}
                        </h4>
                        <p className="font-mono text-xs text-muted">{formatRange(r.start_date, r.end_date, r.is_current)}</p>
                      </div>
                      {r.employment_type ? <p className="mt-1 text-sm text-muted">{r.employment_type}</p> : null}
                      {r.summary ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{r.summary}</p> : null}
                      {r.highlights.length ? (
                        <ul className="mt-4 space-y-2.5">
                          {r.highlights.map((h, i) => (
                            <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-muted">
                              <span aria-hidden className="mt-[0.7rem] h-px w-3 shrink-0 bg-faint" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {r.technologies.length ? (
                        <p className="mt-4 font-mono text-xs leading-relaxed text-muted">
                          {r.technologies.join("  ·  ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
