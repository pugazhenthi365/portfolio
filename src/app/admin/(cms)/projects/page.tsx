import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, ErrorState } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { ProjectsTable } from "@/components/admin/projects-table";
import { requireAdminPage } from "@/lib/auth";
import type { Project } from "@/lib/types";

export const metadata = { title: "Projects" };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const { supabase } = await requireAdminPage();
  const { status } = await searchParams;
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, category, project_status, publication_status, is_featured, sort_order, cover_image_url, updated_at")
    .order("sort_order");

  return (
    <>
      <PageHeader
        title="Projects"
        description="Create, edit, publish and order the projects shown on your site. Drafts are only visible here."
        actions={
          <Link href="/admin/projects/new" className={buttonClasses({ size: "sm" })}>
            <Plus className="size-4" aria-hidden /> New project
          </Link>
        }
      />
      {error ? (
        <ErrorState message={`Couldn't load projects: ${error.message}`} />
      ) : (
        <ProjectsTable projects={(data ?? []) as Project[]} initialStatus={typeof status === "string" ? status : "all"} />
      )}
    </>
  );
}
