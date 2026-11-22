import { ErrorState, PageHeader } from "@/components/admin/ui";
import { ExperienceManager } from "@/components/admin/managers";
import { requireAdminPage } from "@/lib/auth";
import { getSkillSuggestions } from "@/lib/admin-data";
import type { Experience } from "@/lib/types";

export const metadata = { title: "Experience" };

export default async function ExperiencePage() {
  const { supabase } = await requireAdminPage();
  const [{ data, error }, suggestions] = await Promise.all([
    supabase.from("experiences").select("*").order("sort_order"),
    getSkillSuggestions(supabase),
  ]);
  return (
    <>
      <PageHeader
        title="Experience"
        description="Roles at the same company that sit next to each other are grouped into one career-progression block on the site."
      />
      {error ? <ErrorState message={error.message} /> : <ExperienceManager items={(data ?? []) as Experience[]} suggestions={suggestions} />}
    </>
  );
}
