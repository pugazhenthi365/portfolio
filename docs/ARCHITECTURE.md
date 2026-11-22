# Architecture

## Overview

```
Visitor ──► Vercel (Next.js 16)
              ├─ Public pages: statically rendered and cached under the "portfolio-content" tag
              │     └─ lib/content/repository.ts ──(anon key, RLS)──► Supabase Postgres
              ├─ /resume ──► 307 redirect to the active PDF (Supabase Storage)
              ├─ Contact form (server action) ──(anon insert only)──► contact_messages
              └─ /admin/*
                    1. proxy.ts           refreshes the session; no valid JWT → /admin/login
                    2. (cms)/layout.tsx   getUser() + is_admin() on the server, every request
                    3. Server actions     requireAdminAction() + Zod validation
                    4. Postgres RLS       is_admin() on every write (the final authority)
                    Uploads: browser ──(user session, Storage RLS)──► Supabase Storage
```

## Content flow and cache invalidation (no redeploys)

1. Public pages call `getPortfolioContent()`. It wraps every query in a single `unstable_cache` entry tagged `portfolio-content`, with a 1-hour safety-net revalidation.
2. Every admin mutation (save, patch, delete, reorder, or a file removal that affects content) calls `updateTag("portfolio-content")` and `revalidatePath("/", "layout")`.
3. The next request re-renders from fresh data. New project slugs render on demand (`dynamicParams = true`), and the sitemap updates too.

The e2e suite proves this. It publishes, edits, hides and archives content in `/admin`, then fetches the public pages as a new visitor and checks the change, **with no rebuild in between**.

**Resilience:**

- If Supabase isn't configured, or the database is unreachable (for example, a paused free project), the repository falls back to the seed content instead of showing an error page.
- Failed queries throw inside the cache function, so errors are never cached.

## Security model

| Layer | Enforces |
|---|---|
| Public UI | No admin links, buttons or references. `/admin` is excluded by `robots.txt` and sent with `X-Robots-Tag: noindex` |
| `proxy.ts` | Valid JWT (`getClaims`) required for any `/admin` route except `/admin/login`. Admin responses get `Cache-Control: private, no-store` |
| CMS layout and pages | `requireAdminPage()`: `auth.getUser()` (validated by the Auth server) **and** `rpc('is_admin')` |
| Server actions | `requireAdminAction()`, then the Zod schema strips unknown keys (no mass assignment). Entity and patch whitelists. UUID validation |
| Postgres | RLS on every table, explicit `GRANT`s, column-level grants on `contact_messages`, a rate-limit trigger, `CHECK` constraints |
| Storage | Admin-only insert/update/delete/list policies. Buckets restrict MIME types and size (images 5 MB, PDF 10 MB) |
| Auth | Public sign-up disabled in Supabase. Login errors don't reveal whether an account exists. Non-admin accounts are signed out immediately |
| Headers | `nosniff`, `X-Frame-Options: DENY`, HSTS, strict referrer policy, restrictive permissions policy |

The app uses only the **anon key** plus the signed-in user's session. No code path uses the service-role key.

## Database schema

All tables use UUID primary keys and `created_at` / `updated_at` columns, with `updated_at` maintained by a trigger.

| Table | Purpose | Notable constraints |
|---|---|---|
| `admin_profiles` | Users allowed to manage content | FK → `auth.users`. No API write policies |
| `profiles` | Singleton profile (name, intro, about, links, photo, resume, availability) | `singleton` unique check, email format, `https://` links |
| `site_settings` | Singleton (SEO title/description, contact copy, form on/off) | |
| `projects` | Projects and case studies | Unique slug (regex), enums `publication_status` (draft/published/archived) and `project_status` (live/completed/in_progress/paused/concept), `is_featured`, `sort_order`, `published_at` stamped by trigger |
| `project_images` | Screenshots | FK cascade to project; required alt text |
| `experiences` | Roles (consecutive roles at the same company are grouped on the site) | `end_date >= start_date`, current roles have no end date |
| `skill_categories`, `skills` | Grouped skills, no percentages | Unique names; skills cascade with their category |
| `education`, `certifications` | Credentials | Year checks; `certification_kind` enum |
| `contact_messages` | Inbox | Length and email checks; `message_status` enum; rate limit of 3 per email and 30 overall per 10 minutes |

Indexes: `projects(publication_status, sort_order)`, partial `projects(is_featured)`, `project_images(project_id, sort_order)`, `skills(category_id, sort_order)`, `experiences(sort_order)`, `contact_messages(status, created_at)` and `(email, created_at)`.

**RLS summary:**

- `anon` / `authenticated`: read published projects (and their images) plus rows with `is_visible`. Skills in a hidden category are hidden too.
- Visitors can only **insert** contact messages, limited to the name, email, subject and message columns.
- Admins (via `public.is_admin()`, `SECURITY DEFINER`) get full CRUD on content. For messages they can read, update `status` only, and delete.
- No API role can write to `admin_profiles`.

## Design system

- **Tokens** live in `globals.css` as CSS variables, mapped to Tailwind via `@theme inline`. Light theme: white, `#F6F8FC` surfaces, `#111827` text, `#2563EB` / `#60A5FA` blues and `#E5EAF2` lines. Dark theme: deep navy with a lighter blue accent.
- **Secondary text** is `#5B6B82`, a slightly deeper version of `#64748B`, so body copy meets WCAG AA on the `#F6F8FC` sections.
- **Type:** Geist Sans with Geist Mono for indices, labels and metadata (the "engineering notebook" layer). Large, tight display headings.
- **Layout language:** numbered section headers (`01 / About`), hairline rules, 3px radii for images and panels, and pill buttons. There are no gradients, glass effects, stock illustrations, fake stats or skill bars.
- **Projects:** featured projects are alternating editorial rows. The rest form an index table with a cursor-following preview on desktop. Projects without a screenshot get a deliberate typographic cover generated from their data.
- **Theme:** `next-themes` (class strategy, light by default, persisted, with a no-flash inline script).
- **Motion:** restrained and performance-first. Every effect uses only `transform`/`opacity`, never shifts layout, and switches off under `prefers-reduced-motion`.
  - *Hero headline reveal* — CSS only (`.hero-word` in `globals.css`): words rise 0.28em from 35% opacity with a 45ms stagger, so the headline settles in about 570ms. It is readable from the first frame and stays a single plain `<h1>` for SEO and screen readers.
  - *Page transitions* — React's built-in `<ViewTransition>` (View Transitions API; no extra library), set up in `components/motion/page-transition.tsx`. Links into a case study carry `nav-forward`: the old page lifts out in 140ms and the new one rises in over about 280ms. "Back" links carry `nav-back`. Browser back/forward gets a 120–200ms crossfade. The project cover morphs between the listing and the case study (`project-cover-<slug>`, 420ms). The header is anchored, and the overlay never blocks clicks. Unsupported browsers navigate instantly.
  - *Parallax* — `components/motion/parallax.tsx` (Motion `useScroll` + `useTransform`). It applies to the hero photo (0→16px, anchored at the page top so nothing moves on load) and the featured project covers on the home page (±14px). It runs only at desktop widths with a mouse or trackpad (≥1024px).
  - *Reading progress* — `components/motion/reading-progress.tsx`: a 2px accent bar on case-study pages only, driven by `scaleX` from `useScroll`, smoothed with a spring (raw value under reduced motion). It ignores pointer events and is hidden from assistive technology because it is decorative.
  - *Elsewhere* — Motion handles the scroll reveals, mobile menu, theme icon and project-index hover preview. `MotionConfig reducedMotion="user"` is set globally.
