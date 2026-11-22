import { ErrorState, PageHeader } from "@/components/admin/ui";
import { SkillsManager } from "@/components/admin/skills-manager";
import { requireAdminPage } from "@/lib/auth";
import type { Skill, SkillCategory } from "@/lib/types";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const { supabase } = await requireAdminPage();
  const [cats, skills] = await Promise.all([
    supabase.from("skill_categories").select("*").order("sort_order"),
    supabase.from("skills").select("*").order("sort_order"),
  ]);
  const error = cats.error ?? skills.error;
  const categories = ((cats.data ?? []) as Omit<SkillCategory, "skills">[]).map((c) => ({
    ...c,
    skills: ((skills.data ?? []) as Skill[]).filter((s) => s.category_id === c.id),
  }));
  return (
    <>
      <PageHeader title="Skills" description="Organise technologies into categories. No percentages — just what you use." />
      {error ? <ErrorState message={error.message} /> : <SkillsManager categories={categories} />}
    </>
  );
}
