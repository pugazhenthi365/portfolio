import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdminPage } from "@/lib/auth";
import { getSkillSuggestions } from "@/lib/admin-data";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { supabase } = await requireAdminPage();
  const suggestions = await getSkillSuggestions(supabase);
  return (
    <>
      <PageHeader title="New project" description="Projects start as drafts. Preview, then publish when you're ready." />
      <ProjectForm project={null} suggestions={suggestions} />
    </>
  );
}
