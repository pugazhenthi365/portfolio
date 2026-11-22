import { z } from "zod";

/*
 * Shared validation for the admin CMS. The same schemas run in the browser
 * (React Hook Form) and again on the server inside every Server Action.
 * Form-friendly preprocessing turns "" into null, multi-line text into arrays
 * and comma-separated text into tag arrays.
 */

const emptyToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);
const trimString = (v: unknown) => (typeof v === "string" ? v.trim() : v);

export const reqText = (max: number, label = "This field") =>
  z.preprocess(trimString, z.string({ error: `${label} is required.` }).min(1, `${label} is required.`).max(max, `Keep it under ${max} characters.`));

export const optText = (max: number) =>
  z.preprocess((v) => emptyToNull(trimString(v)), z.string().max(max, `Keep it under ${max} characters.`).nullable());

export const optUrl = z.preprocess(
  (v) => emptyToNull(trimString(v)),
  z
    .string()
    .max(500)
    .regex(/^https?:\/\/[^\s]+$/i, "Enter a full URL starting with https://")
    .nullable(),
);

/** Stored file URL: absolute http(s) or a site-relative path like /images/a.jpg */
export const optAssetUrl = z.preprocess(
  (v) => emptyToNull(trimString(v)),
  z
    .string()
    .max(600)
    .regex(/^(https?:\/\/[^\s]+|\/[^\s]*)$/i, "Must be a URL or a site path")
    .nullable(),
);

const splitLines = (v: unknown) =>
  v === undefined || v === null
    ? []
    : typeof v === "string"
    ? v
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : v;

const splitTags = (v: unknown) =>
  v === undefined || v === null
    ? []
    : typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : v;

export const lines = (maxItems: number, maxLen = 400) =>
  z.preprocess(splitLines, z.array(z.string().max(maxLen)).max(maxItems, `At most ${maxItems} items.`));

export const tags = (maxItems: number) =>
  z.preprocess(
    (v) => {
      const arr = splitTags(v);
      return Array.isArray(arr) ? Array.from(new Set(arr)) : arr;
    },
    z.array(z.string().max(60)).max(maxItems, `At most ${maxItems} items.`),
  );

const optDate = z.preprocess(emptyToNull, z.iso.date("Use a valid date.").nullable());

const optYear = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().min(1950).max(2100).nullable(),
);

// ─── Entities ──────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export const projectSchema = z.object({
  title: reqText(120, "Title"),
  slug: slugSchema,
  short_description: reqText(300, "Short description"),
  description: optText(10000),
  category: reqText(80, "Category"),
  project_type: optText(60),
  year: optText(30),
  problem: optText(10000),
  solution: optText(10000),
  contribution: optText(10000),
  tech_stack: tags(40),
  cover_image_url: optAssetUrl,
  cover_image_alt: optText(300),
  github_url: optUrl,
  live_url: optUrl,
  project_status: z.enum(["live", "completed", "in_progress", "paused", "concept"]),
  publication_status: z.enum(["draft", "published", "archived"]),
  is_featured: z.boolean(),
});

export const projectImageSchema = z.object({
  project_id: z.uuid(),
  url: z.preprocess(trimString, z.string().min(1).max(600)),
  alt: reqText(300, "Alt text"),
  caption: optText(300),
});

export const experienceSchema = z
  .object({
    company: reqText(120, "Company"),
    company_note: optText(120),
    role: reqText(120, "Role"),
    employment_type: optText(60),
    location: optText(120),
    work_mode: optText(40),
    start_date: z.iso.date("Start date is required."),
    end_date: optDate,
    is_current: z.boolean(),
    summary: optText(2000),
    highlights: lines(20),
    technologies: tags(30),
    is_visible: z.boolean(),
  })
  .refine((v) => !(v.is_current && v.end_date), {
    message: "A current role can't have an end date.",
    path: ["end_date"],
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "End date must be after the start date.",
    path: ["end_date"],
  });

export const skillCategorySchema = z.object({
  name: reqText(80, "Name"),
  description: optText(300),
  is_visible: z.boolean(),
});

export const skillSchema = z.object({
  category_id: z.uuid(),
  name: reqText(80, "Skill name"),
  is_visible: z.boolean(),
});

export const educationSchema = z
  .object({
    institution: reqText(160, "Institution"),
    degree: reqText(160, "Degree"),
    field: optText(160),
    location: optText(120),
    start_year: optYear,
    end_year: optYear,
    grade: optText(40),
    description: optText(2000),
    is_visible: z.boolean(),
  })
  .refine((v) => !v.start_year || !v.end_year || v.end_year >= v.start_year, {
    message: "End year must be after the start year.",
    path: ["end_year"],
  });

export const certificationSchema = z.object({
  title: reqText(200, "Title"),
  issuer: optText(160),
  kind: z.enum(["certification", "achievement"]),
  issued_on: optText(40),
  credential_url: optUrl,
  description: optText(2000),
  is_visible: z.boolean(),
});

export const profileSchema = z.object({
  full_name: reqText(120, "Name"),
  title: reqText(120, "Title"),
  positioning: optText(300).transform((v) => v ?? ""),
  headline: reqText(200, "Headline"),
  hero_intro: optText(500).transform((v) => v ?? ""),
  short_intro: optText(1000).transform((v) => v ?? ""),
  about: optText(8000).transform((v) => v ?? ""),
  location: reqText(120, "Location"),
  experience_summary: optText(60),
  email: z.preprocess(trimString, z.email("Enter a valid email address.")),
  linkedin_url: optUrl,
  github_url: optUrl,
  availability_enabled: z.boolean(),
  availability_text: optText(120),
});

export const settingsSchema = z.object({
  site_title: reqText(120, "Site title"),
  site_description: reqText(300, "Site description"),
  contact_form_enabled: z.boolean(),
  contact_heading: reqText(120, "Contact heading"),
  contact_text: optText(600).transform((v) => v ?? ""),
  footer_note: optText(300),
});

/** Fields that can be changed individually (toggles, media replacement). */
export const patchSchemas = {
  projects: z
    .object({
      is_featured: z.boolean(),
      publication_status: z.enum(["draft", "published", "archived"]),
      cover_image_url: optAssetUrl,
    })
    .partial(),
  experiences: z.object({ is_visible: z.boolean() }).partial(),
  skill_categories: z.object({ is_visible: z.boolean() }).partial(),
  skills: z.object({ is_visible: z.boolean() }).partial(),
  education: z.object({ is_visible: z.boolean() }).partial(),
  certifications: z.object({ is_visible: z.boolean() }).partial(),
  project_images: z.object({ alt: reqText(300, "Alt text"), caption: optText(300) }).partial(),
  contact_messages: z.object({ status: z.enum(["new", "read", "archived"]) }).partial(),
  profiles: z
    .object({
      photo_url: optAssetUrl,
      photo_alt: optText(300),
      resume_url: optAssetUrl,
      resume_file_name: optText(200),
    })
    .partial(),
} as const;

export const entitySchemas = {
  projects: projectSchema,
  project_images: projectImageSchema,
  experiences: experienceSchema,
  skill_categories: skillCategorySchema,
  skills: skillSchema,
  education: educationSchema,
  certifications: certificationSchema,
  profiles: profileSchema,
  site_settings: settingsSchema,
} as const;

export type EntityName = keyof typeof entitySchemas;
export type PatchableEntity = keyof typeof patchSchemas;

/** Entities that have a sort_order column and can be reordered. */
export const sortableEntities = [
  "projects",
  "project_images",
  "experiences",
  "skill_categories",
  "skills",
  "education",
  "certifications",
] as const;
export type SortableEntity = (typeof sortableEntities)[number];

/** Entities that may be deleted from the CMS. */
export const deletableEntities = [...sortableEntities, "contact_messages"] as const;
export type DeletableEntity = (typeof deletableEntities)[number];

// ─── Upload validation ────────────────────────────────────────────────
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function validateUpload(file: File, kind: "image" | "pdf"): string | null {
  if (kind === "image") {
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Use a JPEG, PNG, WebP or AVIF image.";
    if (file.size > MAX_IMAGE_BYTES) return "Images must be 5 MB or smaller.";
  } else {
    if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) return "Upload a PDF file.";
    if (file.size > MAX_PDF_BYTES) return "PDFs must be 10 MB or smaller.";
  }
  if (file.size === 0) return "The file is empty.";
  return null;
}
