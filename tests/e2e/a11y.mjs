/**
 * Accessibility + responsive audit: runs axe-core (WCAG 2.1 AA rules) on the
 * public pages and admin pages in light and dark themes, and checks for
 * horizontal overflow at common breakpoints.
 *   BASE_URL=http://localhost:3100 node tests/e2e/a11y.mjs
 */
import { chromium } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const publicPages = ["/", "/projects", "/projects/ai-resume-optimizer", "/projects/microsoft-power-platform-solutions", "/does-not-exist"];
const adminPages = ["/admin", "/admin/projects", "/admin/projects/20000000-0000-4000-8000-000000000003", "/admin/experience", "/admin/skills", "/admin/profile", "/admin/media", "/admin/resume", "/admin/messages", "/admin/settings"];
const widths = [360, 390, 768, 1024, 1280, 1920];

const browser = await chromium.launch();
let problems = 0;

async function audit(page, label) {
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () =>
    // eslint-disable-next-line no-undef
    axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }),
  );
  const serious = res.violations.filter((v) => ["serious", "critical", "moderate"].includes(v.impact));
  if (serious.length) {
    problems += serious.length;
    console.log(`✗ ${label}`);
    for (const v of serious) console.log(`   [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  } else console.log(`✓ ${label} (axe: 0 moderate+ violations)`);
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(900);
}

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await ctx.newPage();
  for (const p of publicPages) {
    await page.goto(BASE + p, { waitUntil: "load" });
    await scrollThrough(page);
    await audit(page, `${theme} ${p}`);
  }
  // Admin
  await page.goto(BASE + "/admin/login");
  await audit(page, `${theme} /admin/login`);
  await page.fill("#email", "admin@example.com");
  await page.fill("#password", "correct-horse-battery");
  await page.click("button[type=submit]");
  await page.waitForURL(BASE + "/admin");
  for (const p of adminPages) {
    await page.goto(BASE + p, { waitUntil: "load" });
    await page.locator("main h1").first().waitFor();
    await audit(page, `${theme} ${p}`);
  }
  await ctx.close();
}

console.log("\nHorizontal overflow check");
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE + "/admin/login");
await page.fill("#email", "admin@example.com");
await page.fill("#password", "correct-horse-battery");
await page.click("button[type=submit]");
await page.waitForURL(BASE + "/admin");
for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const p of [...publicPages, "/admin", "/admin/projects", "/admin/messages", "/admin/projects/20000000-0000-4000-8000-000000000003"]) {
    await page.goto(BASE + p, { waitUntil: "load" });
    await page.locator("h1").first().waitFor();
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) {
      problems++;
      console.log(`✗ ${w}px ${p}: horizontal overflow ${overflow}px`);
    }
  }
  console.log(`✓ ${w}px checked`);
}
await browser.close();
console.log(problems ? `\n${problems} problem(s) found` : "\nNo accessibility or overflow problems found");
process.exit(problems ? 1 : 0);
