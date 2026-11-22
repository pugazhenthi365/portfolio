/**
 * End-to-end test of the public site + private CMS against the mock Supabase
 * (real Postgres + real RLS). Verifies that content changes made in /admin go
 * live WITHOUT a rebuild/redeploy, and that the admin area is protected.
 *
 *   BASE_URL=http://localhost:3100 PG*=... node tests/e2e/cms.e2e.mjs
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import pg from "pg";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const db = new pg.Pool({ max: 2 });
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(["PASS", name]);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push(["FAIL", name, e.message]);
    console.log(`  ✗ ${name}\n    ${e.message.split("\n")[0]}`);
  }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const visitor = await (await browser.newContext()).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const toast = async (text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 8000 });
const fresh = async (path) => {
  // A brand-new visitor request — proves the public page itself changed.
  const res = await visitor.goto(BASE + path, { waitUntil: "domcontentloaded" });
  return { status: res.status(), html: await visitor.content() };
};

console.log("\nPublic site & route protection");
await step("home renders database content", async () => {
  const { status, html } = await fresh("/");
  assert.equal(status, 200);
  assert.match(html, /Microsoft Power Platform Solutions/);
  assert.doesNotMatch(html, /Training Center Management System/, "draft project must not be public");
});
await step("no admin links on the public site", async () => {
  const { html } = await fresh("/");
  assert.doesNotMatch(html, /href="\/admin/);
  assert.doesNotMatch(html, />\s*(Login|Sign in|Admin)\s*</i);
});
await step("draft project page returns 404", async () => {
  assert.equal((await fresh("/projects/training-center-management-system")).status, 404);
});
await step("unauthenticated /admin/* redirects to login", async () => {
  for (const p of ["/admin", "/admin/projects", "/admin/messages", "/admin/projects/20000000-0000-4000-8000-000000000001"]) {
    const res = await fetch(BASE + p, { redirect: "manual" });
    assert.equal(res.status, 307, p);
    assert.match(res.headers.get("location") ?? "", /\/admin\/login$/, p);
  }
});
await step("robots.txt disallows /admin; sitemap lists projects", async () => {
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  assert.match(robots, /Disallow: \/admin/);
  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
  assert.match(sitemap, /\/projects\/ai-resume-optimizer/);
});

console.log("\nAuthentication");
await page.goto(BASE + "/admin/login");
await step("wrong password is rejected with a generic error", async () => {
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "wrong-password-123");
  await page.click("button[type=submit]");
  await page.getByText("Invalid email or password.").waitFor({ timeout: 8000 });
});
await step("valid non-admin account is refused", async () => {
  await page.fill("#email", "stranger@example.com");
  await page.fill("#password", "stranger-password");
  await page.click("button[type=submit]");
  await page.getByText("not authorised").waitFor({ timeout: 8000 });
  const res = await page.goto(BASE + "/admin");
  assert.match(page.url(), /\/admin\/login$/);
  assert.ok(res);
});
await step("admin can sign in", async () => {
  await page.goto(BASE + "/admin/login");
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "correct-horse-battery");
  await page.click("button[type=submit]");
  await page.waitForURL(BASE + "/admin", { timeout: 10000 });
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
});

console.log("\nProjects: create → draft → preview → publish (no redeploy)");
const slug = `e2e-project-${Date.now().toString(36)}`;
let projectId = "";
await step("create a draft project", async () => {
  await page.goto(BASE + "/admin/projects/new");
  await page.fill("#title", "E2E Test Project");
  await page.fill("#slug", slug);
  await page.fill("#category", "Testing");
  await page.fill("#short_description", "A project created by the end-to-end test.");
  await page.fill("#problem", "Verifying the CMS.");
  await page.fill("#tech_stack", "Playwright, PostgreSQL");
  await page.getByRole("button", { name: "Create project" }).click();
  await page.waitForURL(/\/admin\/projects\/[0-9a-f-]{36}$/, { timeout: 10000 });
  projectId = page.url().split("/").pop();
  const { rows } = await db.query("select publication_status, tech_stack from public.projects where id = $1", [projectId]);
  assert.equal(rows[0].publication_status, "draft");
  assert.deepEqual(rows[0].tech_stack, ["Playwright", "PostgreSQL"]);
});
await step("validation errors are shown for a bad slug", async () => {
  await page.fill("#slug", "Bad Slug!");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Use lowercase letters").waitFor({ timeout: 5000 });
  await page.fill("#slug", slug);
});
await step("draft is NOT public", async () => {
  assert.equal((await fresh(`/projects/${slug}`)).status, 404);
  assert.doesNotMatch((await fresh("/")).html, /E2E Test Project/);
});
await step("admin preview renders the draft", async () => {
  await page.goto(`${BASE}/admin/projects/${projectId}/preview`);
  await page.getByRole("heading", { name: "E2E Test Project", level: 1 }).waitFor();
  await page.getByText("not visible to the public").waitFor();
});
await step("publishing makes it live immediately", async () => {
  await page.goto(`${BASE}/admin/projects/${projectId}`);
  await page.selectOption("#publication_status", "published");
  await page.check("#is_featured");
  await page.getByRole("button", { name: "Save changes" }).click();
  await toast("live on the site");
  const p = await fresh(`/projects/${slug}`);
  assert.equal(p.status, 200);
  assert.match(p.html, /Verifying the CMS\./);
  assert.match((await fresh("/")).html, /E2E Test Project/);
  assert.match((await fresh("/sitemap.xml")).html, new RegExp(slug));
});
await step("screenshot upload appears in the case study", async () => {
  await page.goto(`${BASE}/admin/projects/${projectId}`);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  fs.writeFileSync("/tmp/e2e-shot.png", png);
  await page.locator('input[type=file][multiple]').setInputFiles("/tmp/e2e-shot.png");
  await toast("screenshot added");
  const { rows } = await db.query("select url from public.project_images where project_id = $1", [projectId]);
  assert.equal(rows.length, 1);
  assert.match((await fresh(`/projects/${slug}`)).html, /Screenshots/);
});
await step("upload validation rejects a non-image", async () => {
  fs.writeFileSync("/tmp/e2e-bad.txt", "not an image");
  await page.locator('input[type=file][multiple]').setInputFiles({ name: "evil.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await toast("Use a JPEG, PNG, WebP or AVIF image.");
});
await step("archiving hides it again", async () => {
  await page.goto(BASE + "/admin/projects");
  await page.getByLabel("Publication status for E2E Test Project").selectOption("archived");
  await toast("Moved to archived");
  assert.equal((await fresh(`/projects/${slug}`)).status, 404);
});

console.log("\nExperience, skills, profile, settings");
await step("editing an experience entry updates the public timeline", async () => {
  await page.goto(BASE + "/admin/experience");
  await page.getByRole("button", { name: "Edit Junior Software Engineer" }).click();
  await page.fill("#experiences-summary", "E2E summary line for the current role.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await toast("live on the site");
  assert.match((await fresh("/")).html, /E2E summary line for the current role\./);
});
await step("adding a new experience entry", async () => {
  await page.goto(BASE + "/admin/experience");
  await page.getByRole("button", { name: "Add experience entry" }).first().click();
  await page.fill("#experiences-company", "E2E Corp");
  await page.fill("#experiences-role", "Test Engineer");
  await page.fill("#experiences-start_date", "2024-01-01");
  await page.fill("#experiences-end_date", "2024-06-30");
  await page.getByRole("button", { name: "Create" }).click();
  await toast("Created");
  assert.match((await fresh("/")).html, /E2E Corp/);
});
await step("experience date validation (end before start)", async () => {
  await page.goto(BASE + "/admin/experience");
  await page.getByRole("button", { name: "Edit Test Engineer" }).click();
  await page.fill("#experiences-end_date", "2023-01-01");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("End date must be after the start date.").waitFor({ timeout: 5000 });
  await page.keyboard.press("Escape");
});
await step("reordering experience entries persists", async () => {
  await page.goto(BASE + "/admin/experience");
  await page.getByRole("button", { name: "Move Test Engineer up" }).click();
  await toast("Order updated");
  const { rows } = await db.query("select role from public.experiences order by sort_order");
  assert.equal(rows.at(-2).role, "Test Engineer");
});
await step("deleting an experience entry (with confirmation)", async () => {
  await page.goto(BASE + "/admin/experience");
  await page.getByRole("button", { name: "Delete Test Engineer" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await toast("deleted");
  assert.doesNotMatch((await fresh("/")).html, /E2E Corp/);
});
await step("hiding a skill removes it from the site", async () => {
  await page.goto(BASE + "/admin/skills");
  await page.locator("summary", { hasText: "Backend" }).click();
  await page.getByRole("button", { name: "Hide Flask" }).click();
  await toast("Hidden from the site");
  assert.doesNotMatch((await fresh("/")).html, />Flask</);
});
await step("availability badge is configurable", async () => {
  assert.doesNotMatch((await fresh("/")).html, /Available to join from 1 December 2026/);
  await page.goto(BASE + "/admin/profile");
  await page.check("#profiles-availability_enabled");
  await page.getByRole("button", { name: "Save changes" }).click();
  await toast("live on the site");
  assert.match((await fresh("/")).html, /Available to join from 1 December 2026/);
});
await step("profile photo can be replaced", async () => {
  await page.goto(BASE + "/admin/profile");
  await page.locator('input[type=file]').first().setInputFiles("/tmp/e2e-shot.png");
  await toast("Profile photo updated");
  const { rows } = await db.query("select photo_url from public.profiles");
  assert.match(rows[0].photo_url, /\/storage\/v1\/object\/public\/media\/profile\//);
});

console.log("\nResume");
await step("replacing the resume updates /resume without redeploy", async () => {
  await page.goto(BASE + "/admin/resume");
  await page.locator("input[type=file]").setInputFiles({ name: "New_Resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%e2e\n") });
  await toast("Resume replaced");
  const res = await fetch(BASE + "/resume", { redirect: "manual" });
  assert.match(res.headers.get("location") ?? "", /\/storage\/v1\/object\/public\/documents\/resume\//);
});
await step("resume upload rejects non-PDF files", async () => {
  await page.locator("input[type=file]").setInputFiles({ name: "resume.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("x") });
  await toast("Upload a PDF file.");
});

console.log("\nContact form & inbox");
await step("contact form validates input", async () => {
  await visitor.goto(BASE + "/#contact");
  await visitor.getByRole("button", { name: /Send message/ }).click();
  await visitor.getByText("Please enter your name.").waitFor({ timeout: 5000 });
});
await step("contact form submits to the database", async () => {
  await visitor.waitForTimeout(2600); // honeypot timing guard
  await visitor.fill("#name", "Recruiter Example");
  await visitor.fill("#email", "recruiter@example.com");
  await visitor.fill("#message", "Hello! We'd like to talk to you about a remote role.");
  await visitor.getByRole("button", { name: /Send message/ }).click();
  await visitor.getByText("your message has been sent").waitFor({ timeout: 8000 });
  const { rows } = await db.query("select status from public.contact_messages where email = 'recruiter@example.com'");
  assert.equal(rows[0].status, "new");
});
await step("message appears in the admin inbox and can be marked read", async () => {
  await page.goto(BASE + "/admin/messages");
  await page.getByText("Recruiter Example").click();
  await page.getByRole("link", { name: "Reply by email" }).waitFor();
  await page.waitForTimeout(800);
  const { rows } = await db.query("select status from public.contact_messages where email = 'recruiter@example.com'");
  assert.equal(rows[0].status, "read");
});
await step("disabling the contact form is respected", async () => {
  await page.goto(BASE + "/admin/settings");
  await page.uncheck("#site_settings-contact_form_enabled");
  await page.getByRole("button", { name: "Save changes" }).click();
  await toast("live on the site");
  assert.match((await fresh("/")).html, /contact form is currently closed/);
  await page.check("#site_settings-contact_form_enabled");
  await page.getByRole("button", { name: "Save changes" }).click();
  await toast("live on the site");
});

console.log("\nServer-side authorisation");
await step("revoking admin rights blocks actions even with a valid session", async () => {
  await db.query("delete from public.admin_profiles");
  await page.goto(BASE + "/admin/experience");
  assert.match(page.url(), /\/admin\/login$/, "layout must re-check admin status");
  await db.query("insert into public.admin_profiles (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com')");
});
await step("sign out ends the session", async () => {
  await page.goto(BASE + "/admin");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(/\/admin\/login$/);
  const res = await page.goto(BASE + "/admin/projects");
  assert.match(page.url(), /\/admin\/login$/);
  assert.ok(res);
});

await step("no uncaught browser errors", async () => {
  assert.deepEqual(errors, []);
});

await browser.close();
await db.end();
const failed = results.filter((r) => r[0] === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
