import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/project/project-cover";
import { NAV_BACK, NAV_FORWARD, PageTransition } from "@/components/motion/page-transition";
import { getPortfolioContent } from "@/lib/content/repository";
import { pad2, projectStatusLabel } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Projects and case studies: enterprise Power Platform solutions, full-stack applications, AI products and client websites.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const { projects } = await getPortfolioContent();

  return (
    <PageTransition>
      <div className="pt-28 pb-24 md:pt-36">
        <div className="page-container">
          <div>
            <Link
              href="/"
              transitionTypes={NAV_BACK}
              className="label inline-flex items-center gap-2 transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> Home
            </Link>
            <h1 className="display mt-10 text-[clamp(2.4rem,6vw,4.6rem)] text-fg">All projects</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              {projects.length} {projects.length === 1 ? "project" : "projects"} — professional, client and independent
              work.
            </p>
          </div>

          <ul className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {projects.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={(i % 2) * 0.06}>
                  <Link href={`/projects/${p.slug}`} transitionTypes={NAV_FORWARD} className="group block">
                    <ProjectCover
                      project={p}
                      compact
                      morph
                      sizes="(min-width: 1240px) 560px, (min-width: 768px) 46vw, 92vw"
                      className="aspect-[16/11] rounded-[3px] border border-line"
                      imageClassName="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                    />
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="label">
                          <span className="text-accent">{pad2(i + 1)}</span>{" "}
                          <span className="mx-1.5 text-faint" aria-hidden>
                            /
                          </span>
                          {p.category}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-fg">{p.title}</h2>
                        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.short_description}</p>
                        <p className="label mt-4">{projectStatusLabel[p.project_status]}</p>
                      </div>
                      <ArrowUpRight
                        className="mt-6 size-5 shrink-0 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageTransition>
  );
}
