import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/project/project-cover";
import { NAV_BACK, NAV_FORWARD } from "@/components/motion/page-transition";
import { hostname, pad2, paragraphs, projectStatusLabel } from "@/lib/utils";
import type { Project } from "@/lib/types";

const metaCols: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

function Block({ id, label, text }: { id: string; label: string; text: string | null }) {
  const paras = paragraphs(text);
  if (!paras.length) return null;
  return (
    <Reveal>
      <section aria-labelledby={id} className="grid gap-4 border-t border-line py-10 md:grid-cols-12 md:gap-10 md:py-14">
        <h2 id={id} className="label md:col-span-3">
          {label}
        </h2>
        <div className="prose-body max-w-2xl text-[1.05rem] leading-[1.75] text-muted md:col-span-9 [&>p:first-child]:text-fg">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export function CaseStudy({
  project,
  index,
  next,
  preview,
}: {
  project: Project;
  index: number;
  next: Project | null;
  preview?: boolean;
}) {
  const images = project.images ?? [];
  const meta = [
    { label: "Category", value: project.category },
    project.project_type ? { label: "Type", value: project.project_type } : null,
    project.year ? { label: "Year", value: project.year } : null,
    { label: "Status", value: projectStatusLabel[project.project_status] },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="pt-28 pb-10 md:pt-36">
      <div className="page-container">
        {/* Header is not animated: the <h1> is the LCP element. */}
        <div>
          <Link
            href={preview ? "/admin/projects" : "/#work"}
            transitionTypes={preview ? undefined : NAV_BACK}
            className="label inline-flex items-center gap-2 transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> {preview ? "Back to admin" : "All work"}
          </Link>
          <p className="label mt-10">
            <span className="text-accent">Case study {pad2(index + 1)}</span>
            <span className="mx-2 text-faint" aria-hidden>/</span>
            {project.category}
          </p>
          <h1 className="display mt-5 max-w-4xl text-[clamp(2.4rem,6vw,4.8rem)] text-fg">{project.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{project.short_description}</p>
        </div>

        <Reveal delay={0.05}>
          <dl className={`mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-line bg-line [&>div:last-child:nth-child(odd)]:col-span-2 md:[&>div:last-child:nth-child(odd)]:col-span-1 ${metaCols[meta.length] ?? "md:grid-cols-4"}`}>
            {meta.map((m) => (
              <div key={m.label} className="bg-bg p-4 md:p-5">
                <dt className="label">{m.label}</dt>
                <dd className="mt-2 text-[0.95rem] text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>
          {project.live_url || project.github_url ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {project.live_url ? (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-strong"
                >
                  Visit {hostname(project.live_url)} <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : null}
              {project.github_url ? (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium text-fg transition-colors hover:bg-subtle"
                >
                  Source on GitHub <ArrowUpRight className="size-4" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={0.1} className="mt-12 md:mt-16">
          <ProjectCover
            project={project}
            priority
            morph={!preview}
            sizes="(min-width: 1240px) 1144px, 94vw"
            className={`${project.cover_image_url ? "aspect-[16/9]" : "aspect-[16/9] md:aspect-[21/8]"} rounded-[3px] border border-line`}
          />
        </Reveal>

        <div className="mt-12 md:mt-20">
          <Block id="overview" label="Overview" text={project.description} />
          <Block id="problem" label="The problem" text={project.problem} />
          <Block id="solution" label="The solution" text={project.solution} />
          <Block id="contribution" label="My contribution" text={project.contribution} />

          {project.tech_stack.length ? (
            <Reveal>
              <section aria-labelledby="stack" className="grid gap-4 border-t border-line py-10 md:grid-cols-12 md:gap-10 md:py-14">
                <h2 id="stack" className="label md:col-span-3">
                  Technology
                </h2>
                <ul className="flex flex-wrap gap-2 md:col-span-9">
                  {project.tech_stack.map((t) => (
                    <li key={t} className="rounded-[3px] border border-line px-3 py-1.5 text-[0.9rem] text-fg">
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          ) : null}

          {images.length ? (
            <section aria-labelledby="gallery" className="border-t border-line py-10 md:py-14">
              <h2 id="gallery" className="label mb-8">
                Screenshots
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {images.map((img, i) => (
                  <Reveal key={img.id} delay={(i % 2) * 0.06} className={i % 3 === 0 ? "md:col-span-2" : undefined}>
                    <figure>
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] border border-line bg-subtle">
                        <Image
                          src={img.url}
                          alt={img.alt}
                          fill
                          loading="lazy"
                          sizes={i % 3 === 0 ? "(min-width: 1240px) 1144px, 94vw" : "(min-width: 768px) 560px, 94vw"}
                          className="object-cover"
                        />
                      </div>
                      {img.caption ? <figcaption className="label mt-3 normal-case tracking-normal">{img.caption}</figcaption> : null}
                    </figure>
                  </Reveal>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {next && !preview ? (
          <Reveal>
            <Link
              href={`/projects/${next.slug}`}
              transitionTypes={NAV_FORWARD}
              className="group mt-6 flex items-end justify-between gap-6 border-t border-line py-12 md:py-16"
            >
              <div>
                <p className="label">Next project</p>
                <p className="mt-3 text-[clamp(1.8rem,4vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg transition-colors group-hover:text-accent">
                  {next.title}
                </p>
              </div>
              <ArrowRight
                className="mb-2 size-7 shrink-0 text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent"
                aria-hidden
              />
            </Link>
          </Reveal>
        ) : null}
      </div>
    </article>
  );
}
