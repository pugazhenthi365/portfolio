import "server-only";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { seedContent } from "@/content/seed";
import type { PortfolioContent, Project, ProjectImage, Skill, SkillCategory } from "@/lib/types";

/** Every public read is tagged with this; admin mutations call updateTag(CONTENT_TAG). */
export const CONTENT_TAG = "portfolio-content";

/** Safety-net revalidation window (seconds) in case an invalidation is ever missed. */
const FALLBACK_REVALIDATE = 3600;

function byOrder<T extends { sort_order: number }>(a: T, b: T) {
  return a.sort_order - b.sort_order;
}

function seedPublicContent(): PortfolioContent {
  return {
    ...seedContent,
    projects: seedContent.projects.filter((p) => p.publication_status === "published").sort(byOrder),
    experiences: seedContent.experiences.filter((e) => e.is_visible).sort(byOrder),
  };
}

async function fetchFromSupabase(): Promise<PortfolioContent> {
  const db = createPublicClient();

  // RLS only returns published/visible rows to the anon role; the filters
  // below are defence in depth and keep query plans on the right indexes.
  const [profile, settings, experiences, projects, images, categories, skills, education, certifications] =
    await Promise.all([
      db.from("profiles").select("*").limit(1).maybeSingle(),
      db.from("site_settings").select("*").limit(1).maybeSingle(),
      db.from("experiences").select("*").eq("is_visible", true).order("sort_order"),
      db.from("projects").select("*").eq("publication_status", "published").order("sort_order"),
      db.from("project_images").select("*").order("sort_order"),
      db.from("skill_categories").select("*").eq("is_visible", true).order("sort_order"),
      db.from("skills").select("*").eq("is_visible", true).order("sort_order"),
      db.from("education").select("*").eq("is_visible", true).order("sort_order"),
      db.from("certifications").select("*").eq("is_visible", true).order("sort_order"),
    ]);

  const firstError = [profile, settings, experiences, projects, images, categories, skills, education, certifications].find(
    (r) => r.error,
  )?.error;
  if (firstError) throw new Error(`Supabase content query failed: ${firstError.message}`);

  const imagesByProject = new Map<string, ProjectImage[]>();
  for (const img of (images.data ?? []) as ProjectImage[]) {
    const list = imagesByProject.get(img.project_id) ?? [];
    list.push(img);
    imagesByProject.set(img.project_id, list);
  }

  const skillsByCategory = new Map<string, Skill[]>();
  for (const s of (skills.data ?? []) as Skill[]) {
    const list = skillsByCategory.get(s.category_id) ?? [];
    list.push(s);
    skillsByCategory.set(s.category_id, list);
  }

  return {
    // An empty profile/settings table falls back to seed values so the site never renders blank.
    profile: profile.data ?? seedContent.profile,
    settings: settings.data ?? seedContent.settings,
    experiences: experiences.data ?? [],
    projects: ((projects.data ?? []) as Project[]).map((p) => ({ ...p, images: imagesByProject.get(p.id) ?? [] })),
    skillCategories: ((categories.data ?? []) as Omit<SkillCategory, "skills">[]).map((c) => ({
      ...c,
      skills: skillsByCategory.get(c.id) ?? [],
    })),
    education: education.data ?? [],
    certifications: certifications.data ?? [],
  };
}

const getCachedContent = unstable_cache(fetchFromSupabase, ["portfolio-content-v1"], {
  tags: [CONTENT_TAG],
  revalidate: FALLBACK_REVALIDATE,
});

/**
 * Returns all public portfolio content.
 * - Supabase configured: cached query, invalidated on every admin mutation.
 * - Not configured, or the database is unreachable (e.g. a paused free-tier
 *   project): typed seed content, so the public site keeps working.
 */
export async function getPortfolioContent(): Promise<PortfolioContent> {
  if (!isSupabaseConfigured) return seedPublicContent();
  try {
    return await getCachedContent();
  } catch (error) {
    console.error("[content] Falling back to seed content:", error);
    return seedPublicContent();
  }
}

export async function getPublishedProject(slug: string) {
  const { projects } = await getPortfolioContent();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  return {
    project: projects[index],
    index,
    next: projects.length > 1 ? projects[(index + 1) % projects.length] : null,
  };
}
