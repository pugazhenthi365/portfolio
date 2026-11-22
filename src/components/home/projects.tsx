import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeader } from "@/components/site/section-header";
import { ProjectCover } from "@/components/project/project-cover";
import { ProjectIndex } from "@/components/project/project-index";
import { NAV_FORWARD } from "@/components/motion/page-transition";
import { cn, pad2, projectStatusLabel } from "@/lib/utils";
import type { Project } from "@/lib/types";

function FeaturedProject({ project, index, flip }: { project: Project; index: number; flip: boolean }) {
  return (
    <Reveal>
      <article className="group grid items-center gap-8 border-t border-line py-10 md:grid-cols-12 md:gap-10 md:py-14">
        <Link
          href={`/projects/${project.slug}`}
          transitionTypes={NAV_FORWARD}
          className={cn("block md:col-span-7", flip && "md:order-2")}
          aria-hidden
          tabIndex={-1}
        >
          <ProjectCover
            project={project}
            sizes="(min-width: 1240px) 660px, (min-width: 768px) 56vw, 92vw"
            morph
            parallax={14}
            className="aspect-[16/11] rounded-[3px] border border-line"
            imageClassName="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
          />
        </Link>
        <div className={cn("md:col-span-5", flip && "md:order-1")}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-accent">{pad2(index + 1)}</span>
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            <span className="label">{project.category}</span>
          </div>
          <h3 className="mt-5 text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-fg">
            <Link href={`/projects/${project.slug}`} transitionTypes={NAV_FORWARD} className="focus-visible:underline">
              {project.title}
            </Link>
          </h3>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-[1.05rem]">{project.short_description}</p>
          {project.tech_stack.length ? (
            <p className="mt-6 font-mono text-xs leading-relaxed text-muted">{project.tech_stack.join("  ·  ")}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={`/projects/${project.slug}`}
              transitionTypes={NAV_FORWARD}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-fg"
            >
              <span className="link-underline">Read case study</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
            <span className="label">{projectStatusLabel[project.project_status]}</span>
            {project.project_type ? <span className="label">{project.project_type}</span> : null}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  const featured = projects.filter((p) => p.is_featured);
  const rest = projects.filter((p) => !p.is_featured);
  const lead = featured.length ? featured : projects.slice(0, 1);
  const others = featured.length ? rest : projects.slice(1);

  return (
    <section id="work" aria-labelledby="work-title" className="py-20 md:py-28">
      <div className="page-container">
        <SectionHeader
          id="work-title"
          index="03"
          label="Selected work"
          title="Things I've designed and built"
          description="Enterprise applications, full-stack products and client websites. Each project links to a short case study."
        />
        <div>
          {lead.map((p, i) => (
            <FeaturedProject key={p.id} project={p} index={i} flip={i % 2 === 1} />
          ))}
        </div>

        {others.length ? (
          <div className="mt-16 md:mt-20">
            <Reveal className="mb-6 flex items-end justify-between gap-4">
              <h3 className="label">More projects</h3>
              <Link href="/projects" className="label inline-flex items-center gap-1 transition-colors hover:text-fg">
                All projects <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </Reveal>
            <ProjectIndex
              projects={others.map(({ id, slug, title, category, project_status, cover_image_url, cover_image_alt, tech_stack }) => ({
                id,
                slug,
                title,
                category,
                project_status,
                cover_image_url,
                cover_image_alt,
                tech_stack,
              }))}
              startIndex={lead.length}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
