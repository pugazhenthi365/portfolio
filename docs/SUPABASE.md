# Supabase setup

Everything below runs on the **Supabase Free plan**.

## 1. Create the project

1. Go to <https://supabase.com/dashboard> and create a **New project**. Pick the region closest to your visitors (for example, Mumbai `ap-south-1`) and set a strong database password. Store the password in a password manager.
2. Open **Project Settings → API** and copy:
   - the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`
   - the **anon / publishable key** into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Do **not** copy the service-role / secret key anywhere. This app doesn't need it.

## 2. Run the migrations and seed

**Option A — SQL Editor (no tools needed).** Open **SQL Editor → New query** and run each file in this order, pasting the whole file each time:

1. `supabase/migrations/20261122000001_schema.sql`
2. `supabase/migrations/20261122000002_rls.sql`
3. `supabase/migrations/20261122000003_storage.sql`
4. `supabase/seed.sql` (initial content: profile, 7 published projects and 1 draft, experience, skills, education and certifications)

**Option B — Supabase CLI.**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push                                   # applies supabase/migrations
psql "<connection string from Project Settings → Database>" -f supabase/seed.sql
```

`seed.sql` is idempotent (`on conflict do nothing`), so running it twice is harmless.

## 3. Lock down authentication

In **Authentication → Sign In / Providers**:

- **Allow new users to sign up:** **OFF**. This is essential, because nobody should be able to create an account.
- **Email provider:** enabled. "Confirm email" can stay on.
- Leave the other providers off.

In **Authentication → URL Configuration**:

- **Site URL:** your production URL, for example `https://yourdomain.com`.
- **Redirect URLs:** `https://yourdomain.com/**` and `http://localhost:3000/**`.

Recommended:

- Turn on **leaked-password protection** if your plan offers it.
- Keep the default auth rate limits.

## 4. Create your admin account

See [`ADMIN.md`](ADMIN.md). In short: create the user in **Authentication → Users**, then insert their id into `public.admin_profiles`.

## 5. Upload your resume and photo (optional)

The seed points the profile photo and resume at files bundled with the site (`/images/profile/…`, `/documents/…`), so everything works immediately. To move them into Supabase Storage, use **Admin → Profile** and **Admin → Resume**. After that, the bundled files are only a fallback.

## 6. Verify

- Visit `/` — the content now comes from the database (edit something in `/admin` to confirm).
- Visit `/admin` — you should be redirected to `/admin/login`.
- Optionally run the RLS suite against a **local** Postgres: `npm run test:db` (see `TESTING.md`).

---

## Free-plan limitations

The figures below are the typical Supabase Free quotas as of 2026. Confirm the current numbers on <https://supabase.com/pricing>, because they change.

| Limit | Typical Free quota | What it means for this site |
|---|---|---|
| **Inactivity pausing** | Projects are paused after about **1 week without activity** | A paused project returns errors. The site then **falls back to the built-in seed content** automatically, and the CMS is unavailable until you click **Restore** in the dashboard. The included Vercel Cron job (`/api/keepalive`, daily) prevents pausing. Set `CRON_SECRET` to enable it. |
| Database size | 500 MB | Portfolio content takes a few MB. Contact messages are tiny. |
| File storage | 1 GB | About 200–400 optimised screenshots. Upload WebP or AVIF at 1600–2000 px wide. |
| Max upload size | 50 MB per file (global) | Buckets are stricter: 5 MB per image and 10 MB per PDF. |
| Egress / bandwidth | About 5 GB per month | Images are served through Vercel's image optimiser and cached, which keeps egress low. |
| Monthly active users | 50,000 | Only the admin signs in. |
| Projects | 2 active free projects per organisation | |
| Backups | No automatic point-in-time recovery | Export important data occasionally (**Database → Backups**, or `pg_dump`). |

**If you outgrow the free tier:**

- Supabase **Pro** removes pausing and raises quotas.
- Nothing in the code depends on the plan.
- Provider-specific code is isolated in `src/lib/supabase/*`, `src/lib/storage.ts` and `src/lib/content/repository.ts`, so a future provider swap stays contained.
