import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/site/section-header";
import { pad2 } from "@/lib/utils";
import type { SkillCategory } from "@/lib/types";

export function ExpertiseSection({ categories }: { categories: SkillCategory[] }) {
  const visible = categories.filter((c) => c.skills.length);
  if (!visible.length) return null;

  return (
    <section id="expertise" aria-labelledby="expertise-title" className="bg-subtle py-20 md:py-28">
      <div className="page-container">
        <SectionHeader
          id="expertise-title"
          index="04"
          label="Expertise"
          title="Technical expertise"
          description="The platforms, languages and tools I use to design, build and ship software."
        />
        <div className="border-b border-line">
          {visible.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i * 0.03, 0.15)}>
              <div className="grid gap-5 border-t border-line py-8 md:grid-cols-12 md:gap-10 md:py-10">
                <div className="md:col-span-4">
                  <p className="font-mono text-xs text-accent">{pad2(i + 1)}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-fg">{c.name}</h3>
                  {c.description ? <p className="mt-1.5 text-sm text-muted">{c.description}</p> : null}
                </div>
                <ul className="flex flex-wrap content-start gap-2 md:col-span-8" aria-label={`${c.name} skills`}>
                  {c.skills.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-[3px] border border-line bg-bg px-3 py-1.5 text-[0.9rem] text-fg transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
