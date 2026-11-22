import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/project/case-study";
import { requireAdminPage } from "@/lib/auth";
import type { Project, ProjectImage } from "@/lib/types";

export const metadata = { title: "Preview" };

export default async function PreviewProjectPage({ params }: PageProps<"/admin/projects/[id]/preview">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [{ data: project }, { data: images }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_images").select("*").eq("project_id", id).order("sort_order"),
  ]);
  if (!project) notFound();
  const p = { ...(project as Project), images: (images ?? []) as ProjectImage[] };

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-10 lg:-my-10">
      <div className="sticky top-14 z-30 flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-50 px-4 py-2 text-sm text-amber-900 lg:top-0 dark:bg-amber-950/60 dark:text-amber-200">
        <span>
          Preview · <strong className="font-semibold">{p.publication_status}</strong>
          {p.publication_status !== "published" ? " — not visible to the public" : ""}
        </span>
        <a href={`/admin/projects/${p.id}`} className="font-medium underline underline-offset-2">
          Back to editor
        </a>
      </div>
      <div className="[&>article]:pt-12">
        <CaseStudy project={p} index={Math.max(0, p.sort_order - 1)} next={null} preview />
      </div>
    </div>
  );
}
