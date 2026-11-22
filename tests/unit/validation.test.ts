import { test } from "node:test";
import assert from "node:assert/strict";
import {
  certificationSchema,
  experienceSchema,
  patchSchemas,
  profileSchema,
  projectSchema,
  validateUpload,
} from "../../src/lib/validation/admin.ts";
import { contactSchema } from "../../src/lib/validation/contact.ts";
import { formatMonthYear, formatRange, paragraphs, slugify } from "../../src/lib/utils.ts";
import { seedContent } from "../../src/content/seed.ts";

const baseProject = {
  title: "Demo",
  slug: "demo-project",
  short_description: "Short",
  category: "Web",
  tech_stack: "React, Node.js, React",
  project_status: "completed",
  publication_status: "draft",
  is_featured: false,
};

test("project: form strings become DB values", () => {
  const r = projectSchema.parse({ ...baseProject, description: "  ", live_url: "", github_url: "https://github.com/x/y" });
  assert.deepEqual(r.tech_stack, ["React", "Node.js"]); // de-duplicated
  assert.equal(r.description, null);
  assert.equal(r.live_url, null);
  assert.equal(r.github_url, "https://github.com/x/y");
});

test("project: rejects bad slugs, urls and statuses", () => {
  assert.equal(projectSchema.safeParse({ ...baseProject, slug: "Bad Slug" }).success, false);
  assert.equal(projectSchema.safeParse({ ...baseProject, slug: "double--dash" }).success, false);
  assert.equal(projectSchema.safeParse({ ...baseProject, live_url: "javascript:alert(1)" }).success, false);
  assert.equal(projectSchema.safeParse({ ...baseProject, publication_status: "public" }).success, false);
});

test("project: unknown keys are stripped (no mass assignment)", () => {
  const r = projectSchema.parse({ ...baseProject, id: "x", sort_order: 99, created_at: "2020" }) as Record<string, unknown>;
  assert.equal("id" in r, false);
  assert.equal("sort_order" in r, false);
  assert.equal("created_at" in r, false);
});

test("experience: date rules", () => {
  const base = { company: "A", role: "B", start_date: "2025-01-01", is_current: false, is_visible: true, highlights: "One\n\n Two ", technologies: "" };
  const ok = experienceSchema.parse({ ...base, end_date: "" });
  assert.equal(ok.end_date, null);
  assert.deepEqual(ok.highlights, ["One", "Two"]);
  assert.deepEqual(ok.technologies, []);
  assert.equal(experienceSchema.safeParse({ ...base, end_date: "2024-01-01" }).success, false);
  assert.equal(experienceSchema.safeParse({ ...base, is_current: true, end_date: "2026-01-01" }).success, false);
});

test("certification: credential URL must be http(s)", () => {
  const c = { title: "T", kind: "certification", is_visible: true };
  assert.equal(certificationSchema.safeParse({ ...c, credential_url: "ftp://x" }).success, false);
  assert.equal(certificationSchema.safeParse({ ...c, credential_url: "https://x.y" }).success, true);
});

test("profile: email validated, availability boolean", () => {
  const p = { full_name: "A", title: "B", headline: "C", location: "D", email: "not-an-email", availability_enabled: false };
  assert.equal(profileSchema.safeParse(p).success, false);
  assert.equal(profileSchema.safeParse({ ...p, email: "a@b.co" }).success, true);
});

test("patch schemas only allow whitelisted fields", () => {
  const r = patchSchemas.projects.parse({ is_featured: true, title: "hijack" }) as Record<string, unknown>;
  assert.deepEqual(r, { is_featured: true });
  assert.equal(patchSchemas.contact_messages.safeParse({ status: "deleted" }).success, false);
});

test("upload validation", () => {
  const f = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });
  assert.equal(validateUpload(f("a.png", "image/png", 1000), "image"), null);
  assert.match(validateUpload(f("a.svg", "image/svg+xml", 1000), "image")!, /JPEG/);
  assert.match(validateUpload(f("a.png", "image/png", 6 * 1024 * 1024), "image")!, /5 MB/);
  assert.equal(validateUpload(f("cv.pdf", "application/pdf", 1000), "pdf"), null);
  assert.match(validateUpload(f("cv.exe", "application/pdf", 1000), "pdf")!, /PDF/);
});

test("contact form validation", () => {
  const ok = { name: "Jo Doe", email: " jo@example.com ", message: "x".repeat(25), startedAt: 1 };
  assert.equal(contactSchema.parse(ok).email, "jo@example.com");
  assert.equal(contactSchema.safeParse({ ...ok, message: "short" }).success, false);
  assert.equal(contactSchema.safeParse({ ...ok, website: "spam" }).success, false);
});

test("utils", () => {
  assert.equal(formatMonthYear("2025-02-01"), "Feb 2025");
  assert.equal(formatRange("2025-02-01", null, true), "Feb 2025 — Present");
  assert.deepEqual(paragraphs("a\n\n\nb\n"), ["a", "b"]);
  assert.equal(slugify("Mr. Prathas Website!"), "mr-prathas-website");
});

test("seed content is consistent", () => {
  const slugs = seedContent.projects.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "slugs unique");
  for (const p of seedContent.projects) assert.equal(projectSchema.safeParse({ ...p, tech_stack: p.tech_stack }).success, true, p.slug);
  for (const e of seedContent.experiences) assert.equal(experienceSchema.safeParse(e).success, true, e.role);
  assert.equal(seedContent.profile.availability_enabled, false, "availability off by default");
  assert.equal(seedContent.projects.filter((p) => p.publication_status === "published").length, 7);
});
