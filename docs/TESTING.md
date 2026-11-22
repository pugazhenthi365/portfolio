# Testing

Four layers, from fast to thorough. Latest results (22 Nov 2026) are recorded at the end.

## 1. Unit tests — `npm test`

`tests/unit/validation.test.ts` runs on Node's built-in test runner (no extra dependencies). It covers:

- Zod schemas: preprocessing, slug and URL rules, date rules, stripping of unknown keys (prevents mass assignment), and patch whitelists
- upload validation (type and size)
- contact-form validation and the honeypot
- date, paragraph and slug helpers
- seed-data integrity: unique slugs, every seed record passes its schema, availability off by default

## 2. Database / RLS — `npm run test:db`

`tests/db/run.sh` creates a throwaway database on a **local PostgreSQL**. It loads `tests/db/supabase-shim.sql` (the `anon` / `authenticated` roles, `auth.uid()`, and a minimal `storage` schema), then all migrations and the seed, then runs `tests/db/rls.test.sql`. That's 44 checks, including:

- **Anonymous:** sees exactly the published projects; no drafts; cannot insert, update or delete any content; cannot read messages or admin records; cannot escalate to admin; **can** submit a message, but cannot set its status; constraint and rate-limit enforcement; no storage uploads or listing.
- **Signed-in non-admin:** no drafts; updates and deletes affect 0 rows; cannot insert; cannot read messages; cannot upload.
- **Admin:** full CRUD; `published_at` stamping; slug format and uniqueness; profile singleton; date rules; reads and moderates messages but **cannot alter message bodies**; storage limited to the portfolio buckets; cannot create admins through the API.
- **Cascades and visibility:** images of unpublished projects are hidden; skills in a hidden category are hidden; deleting a project deletes its images.

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres npm run test:db
```

## 3. End-to-end — `npm run test:e2e`

`tests/e2e/run.sh` does the following:

1. Builds a fresh database (shim, migrations, seed, plus an admin and a non-admin test user).
2. Starts `tests/e2e/mock-supabase.mjs`, a small Supabase-compatible server (GoTrue password auth, a PostgREST subset and Storage). It runs every request **inside Postgres as `anon` / `authenticated` with the JWT subject**, so the real RLS policies make the decisions.
3. Builds and starts the production app.
4. Runs `tests/e2e/cms.e2e.mjs` with Playwright.

The 33 scenarios include:

- public rendering from the database, no admin links, draft 404, redirects for unauthenticated `/admin/*`, robots and sitemap
- login failures (wrong password, valid non-admin account), admin login
- **project lifecycle:** create a draft → validation error → not public → admin preview → **publish → live immediately, no rebuild** → screenshot upload → reject an SVG upload → archive → 404
- experience edit, add, date validation, reorder and delete; hiding a skill; the availability toggle; replacing the profile photo
- resume replacement updates `/resume`; non-PDF files are rejected
- contact form: client validation, honeypot timing, database insert, appears in the inbox, marked read; form disabled via settings
- **server-side authorisation:** revoking `admin_profiles` blocks a still-valid session; sign-out
- no uncaught browser errors

Requirements: a local PostgreSQL (`PGHOST`, `PGPORT`, `PGUSER`) and Playwright Chromium (`npx playwright install chromium`).

## 4. Accessibility and responsive — `npm run test:a11y`

With the e2e stack running (`BASE_URL`), `tests/e2e/a11y.mjs` does two things:

- Injects **axe-core** (WCAG 2.0/2.1 A + AA + best-practice) on 5 public pages, the login page and 10 admin pages, in **light and dark** themes.
- Checks for horizontal overflow at **360, 390, 768, 1024, 1280 and 1920 px** on public and admin pages.

## Lighthouse (manual)

```bash
npx lighthouse http://localhost:3000 --preset=desktop
npx lighthouse http://localhost:3000            # mobile, simulated slow 4G
```

## Latest results — 22 Nov 2026

| Suite | Result |
|---|---|
| TypeScript (`tsc --noEmit`) and `next build` | ✅ no errors |
| Unit | ✅ 11/11 |
| Database / RLS | ✅ 44/44 |
| End-to-end CMS | ✅ 33/33 |
| axe-core (32 page × theme combinations) | ✅ 0 moderate, serious or critical violations |
| Overflow (6 widths) | ✅ none |
| Lighthouse desktop, home | Performance 99 · Accessibility 100 · Best Practices 100 · SEO 100 |
| Lighthouse desktop, case study | 100 · 100 · 100 · 100 |
| Lighthouse mobile, home (simulated slow 4G) | Performance ≈ 90 · Accessibility 100 · Best Practices 100 · SEO 100 · CLS 0 |

These were measured with a local `next start` against the mock backend. Real Vercel and Supabase numbers will vary.

## What was *not* tested here

The cloud sandbox couldn't reach a hosted Supabase project, so these run against the mock and need a one-time manual check after you connect your real project (they're in the post-deployment checklist in `DEPLOYMENT.md`):

- the real GoTrue (Supabase Auth) login
- the real Storage API, including bucket MIME and size limits
- Supabase's own PostgREST

The SQL (schema, RLS, storage policies) is identical to what Supabase runs.

## Motion refinement — 23 Nov 2026

The four micro-interactions were each tested in Chromium (Playwright) before moving to the next:

| Check | Result |
|---|---|
| Hero reveal | 7 words, animations end at 300–570ms; minimum opacity 0.35 at first paint (readable); CLS 0; reduced motion → no animation |
| Page transitions | Cover morph 420ms, old page 140ms, new page 280ms; case-study `<h1>` visible about 85ms after click; browser back/forward and in-page "All work" / "Next project" all work; no duplicate-name or console errors; reduced motion → all durations 0 |
| Parallax | Hero 0→16px, featured covers −14→+14px; no transform on mobile (touch, 390px) or with reduced motion; CLS 0 |
| Reading progress | 0 at top, 0.5 at mid-page, 1.0 at bottom; accent `#2563EB`; 2px; `pointer-events: none`; header links still clickable; absent on non-case-study pages |
| Regression | `tsc` and `next build` clean; unit 11/11; RLS 44/44; e2e CMS 33/33 (auth, publish without redeploy, uploads, resume, contact, admin revocation); axe light + dark and overflow at 6 widths clean |

**Lighthouse before and after.** Seed-mode production build, local `next start`, median of 3 runs each:

| Page | Before (perf / LCP / TBT / CLS) | After |
|---|---|---|
| Mobile `/` | 85 / 3.74s / 222ms / 0 | 89 / 3.73s / 97ms / 0 |
| Mobile case study | 93 / 3.21s / 88ms / 0 | 93 / 3.24s / 82ms / 0 |
| Desktop `/` | 100 / 0.75s / 0ms / 0 | 100 / 0.75s / 0ms / 0 |
| Desktop case study | 100 / 0.67s / 0ms / 0 | 100 / 0.65s / 0ms / 0 |

Accessibility, Best Practices and SEO stayed at 100. The differences are within run-to-run noise (a single earlier baseline run of mobile `/` scored 88), so the result is **no measurable regression**. It is not an improvement.
