import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/project-form";
import { ScreenshotsManager } from "@/components/admin/screenshots-manager";
import { requireAdminPage } from "@/lib/auth";
import { getSkillSuggestions } from "@/lib/admin-data";
import type { Project, ProjectImage } from "@/lib/types";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [{ data: project }, { data: images }, suggestions] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_images").select("*").eq("project_id", id).order("sort_order"),
    getSkillSuggestions(supabase),
  ]);
  if (!project) notFound();

  return (
    <>
      <PageHeader title={(project as Project).title} description="Edit the case study. Saved changes to a published project go live immediately." />
      <ProjectForm project={project as Project} suggestions={suggestions} />
      <div className="mt-10">
        <ScreenshotsManager projectId={id} images={(images ?? []) as ProjectImage[]} />
      </div>
    </>
  );
}
