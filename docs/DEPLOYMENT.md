# Deploying to Vercel

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Portfolio and CMS"
git branch -M main
git remote add origin https://github.com/pugazhenthi365/portfolio.git
git push -u origin main
```

`.env.local` is git-ignored. Never commit real keys.

## 2. Import into Vercel

1. <https://vercel.com/new> → **Import** the repository. The framework preset is detected as **Next.js**.
2. Build settings: keep the defaults (`npm install`, `next build`). Node.js 20 or newer is required, and 22 LTS is recommended (Project Settings → General → Node.js Version).
3. **Environment variables** (Production + Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` (no trailing slash) |
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `CRON_SECRET` | long random string (enables the daily Supabase keep-alive) |

4. Click **Deploy**.

> You can deploy **before** Supabase exists. With the Supabase variables empty, the site runs in seed mode. Add the variables later and redeploy once — `NEXT_PUBLIC_*` values are baked in at build time.

## 3. Custom domain

1. Vercel → Project → **Domains** → add `yourdomain.com` and `www.yourdomain.com`, then follow the DNS instructions.
2. Update `NEXT_PUBLIC_SITE_URL` and redeploy.
3. In Supabase → Authentication → URL Configuration, set the Site URL and Redirect URLs to the new domain.

## 4. Post-deployment checklist

- [ ] `/` loads, and both themes work and persist.
- [ ] **Download Resume** opens the PDF.
- [ ] `/admin` redirects to `/admin/login`. Signing in works. Signing in with a non-admin account is refused.
- [ ] Edit a project in the CMS → the change is visible on the live site after a reload (no redeploy).
- [ ] Submit the contact form → the message appears in **Admin → Messages**.
- [ ] `/robots.txt` disallows `/admin`, and `/sitemap.xml` lists the projects.
- [ ] Share the URL in a LinkedIn post preview to check the Open Graph image.
- [ ] Vercel → Settings → **Cron Jobs** shows `/api/keepalive` (only if `CRON_SECRET` is set).
- [ ] Optionally submit the sitemap in Google Search Console.

## Notes on the Vercel Hobby (free) plan

- **Cron:** Hobby cron jobs run at most once a day, which is all the keep-alive needs.
- **Image optimisation:** Hobby includes a limited monthly quota of image transformations (check Vercel's current limits). The site uses a small set of `sizes`, AVIF/WebP output and long cache lifetimes, and the CMS previews images unoptimised, to stay well within it.
- **Hobby plan terms:** Hobby is for personal, non-commercial projects. That's fine for a personal portfolio.

## Updating the site

- **Content** (projects, experience, photo, resume…): use `/admin`. No deploy is needed.
- **Code or design:** push to `main`. Vercel builds and deploys automatically, and pull requests get preview URLs.
- **Database changes:** add a new migration file under `supabase/migrations/` and apply it (SQL Editor or `supabase db push`) before deploying code that depends on it.
