# Admin account and CMS guide

## Create the administrator (one time)

Because public sign-up is disabled, accounts are created from the Supabase dashboard.

1. **Authentication → Users → Add user → Create new user**
   - Email: the address you will sign in with.
   - Password: a long, unique password (16+ characters, from a password manager).
   - Tick **Auto Confirm User**.
2. Copy the new user's **UID**.
3. **SQL Editor:**

   ```sql
   insert into public.admin_profiles (id, email)
   values ('<paste-the-uid>', 'you@example.com');
   ```

4. Visit `https://yourdomain.com/admin` and sign in.

This SQL is the **only** way to grant admin access. The API can't write to `admin_profiles`, even for an existing admin.

**To revoke access:** `delete from public.admin_profiles where email = 'you@example.com';`. The next page load or action is refused, even if the person still has a valid session.

**To change your password:** Authentication → Users → … → Send password recovery, or reset it from the dashboard.

## Using the CMS

`/admin` is never linked from the public site, so bookmark it.

| Section | What you can do |
|---|---|
| **Dashboard** | Counts, site-health checks (resume, photo, projects without screenshots), recent messages and recently edited projects |
| **Projects** | Search and filter by status or category. Reorder with the arrows. Feature with ★. Change Published / Draft / Archived inline. Preview. Delete with confirmation |
| **Project editor** | Basics, the case-study sections (blank-line paragraphs), technology picker (from your skills or free text), links, cover image upload with alt text, publishing. **Save & preview** shows drafts exactly as they will appear |
| **Screenshots** | Multi-upload, alt text and caption (saved on blur), reorder, remove |
| **Experience** | Add, edit, delete and reorder roles. Neighbouring roles at the same company appear as one career-progression block |
| **Skills** | Categories (reorder, hide) and the skills inside each one. No percentages |
| **Education / Certifications** | Add, edit, delete, reorder and hide |
| **Profile** | Name, title, positioning line, hero headline and text, About (blank-line paragraphs), location, links, photo and alt text, **availability badge** (off by default) |
| **Media library** | Browse, search, upload, copy URLs and delete files in Storage |
| **Resume** | Upload a new PDF, switch between earlier versions, delete old ones. `/resume` always serves the active file |
| **Messages** | Contact-form inbox: read, reply by email, archive, mark unread, delete |
| **Contact & site** | Turn the contact form on or off, edit the contact copy, SEO title and description, footer note |

Every save shows a toast. Changes are live on the public site on the next page load, with **no redeploy**.

**Good practice:**

- Never upload confidential employer screenshots or data. The *Microsoft Power Platform Solutions* project is written to describe the kind of work without exposing internals.
- Write meaningful alt text for every image. It's required for screenshots.
- Prefer **Archive** to Delete: it hides a project but keeps it.
