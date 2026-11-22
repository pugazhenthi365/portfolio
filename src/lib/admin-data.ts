import "server-only";
import type { AdminContext } from "@/lib/auth";

/** Distinct skill names, used as technology suggestions in admin forms. */
export async function getSkillSuggestions(supabase: AdminContext["supabase"]) {
  const { data } = await supabase.from("skills").select("name").order("name");
  return Array.from(new Set((data ?? []).map((s: { name: string }) => s.name)));
}
