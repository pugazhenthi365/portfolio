import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/project/case-study";
import { PageTransition } from "@/components/motion/page-transition";
import { ReadingProgress } from "@/components/motion/reading-progress";
import { getPortfolioContent, getPublishedProject } from "@/lib/content/repository";

export const revalidate = 3600;
// Projects published after the build are rendered on first request.
export const dynamicParams = true;

export async function generateStaticParams() {
  const { projects } = await getPortfolioContent();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublishedProject(slug);
  if (!found) return { title: "Project not found", robots: { index: false } };
  const { project } = found;
  const images = project.cover_image_url ? [{ url: project.cover_image_url, alt: project.cover_image_alt ?? project.title }] : undefined;
  return {
    title: project.title,
    description: project.short_description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title: project.title, description: project.short_description, images },
    twitter: { card: "summary_large_image", title: project.title, description: project.short_description },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const found = await getPublishedProject(slug);
  if (!found) notFound();
  return (
    <>
      {/* Case-study pages only; outside the transition wrapper so it never slides. */}
      <ReadingProgress />
      {/* key: moving between two case studies is a full exit/enter, not an in-place update. */}
      <PageTransition key={found.project.slug}>
        <CaseStudy project={found.project} index={found.index} next={found.next} />
      </PageTransition>
    </>
  );
}
