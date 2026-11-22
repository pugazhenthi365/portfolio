-- ════════════════════════════════════════════════════════════════════════
-- Row Level Security & privileges
--
-- Visitors (anon):        read published / visible content; insert contact messages.
-- Signed-in non-admins:   same as visitors (no extra rights).
-- Administrators:         full CRUD on content, read/manage contact messages.
-- Nobody via the API:     write to admin_profiles.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Enable RLS everywhere ─────────────────────────────────────────────
alter table public.admin_profiles   enable row level security;
alter table public.profiles         enable row level security;
alter table public.site_settings    enable row level security;
alter table public.projects         enable row level security;
alter table public.project_images   enable row level security;
alter table public.experiences      enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills           enable row level security;
alter table public.education        enable row level security;
alter table public.certifications   enable row level security;
alter table public.contact_messages enable row level security;

-- ─── Explicit privileges (defence in depth on top of RLS) ──────────────
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles, public.site_settings, public.projects, public.project_images,
  public.experiences, public.skill_categories, public.skills, public.education, public.certifications
  to anon, authenticated;

grant insert, update, delete on public.profiles, public.site_settings, public.projects, public.project_images,
  public.experiences, public.skill_categories, public.skills, public.education, public.certifications
  to authenticated;

grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;
grant select, update (status), delete on public.contact_messages to authenticated;

grant select on public.admin_profiles to authenticated;

-- ─── admin_profiles ────────────────────────────────────────────────────
create policy "Admins can read their own admin record"
  on public.admin_profiles for select to authenticated
  using (id = (select auth.uid()));
-- No insert/update/delete policies: admin accounts are managed only via SQL.

-- ─── Singletons: profile & settings ────────────────────────────────────
create policy "Public can read the profile"
  on public.profiles for select to anon, authenticated using (true);
create policy "Admins can insert the profile"
  on public.profiles for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update the profile"
  on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Admins can insert site settings"
  on public.site_settings for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ─── Projects ──────────────────────────────────────────────────────────
create policy "Public can read published projects; admins can read all"
  on public.projects for select to anon, authenticated
  using (publication_status = 'published' or (select public.is_admin()));
create policy "Admins can insert projects"
  on public.projects for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update projects"
  on public.projects for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete projects"
  on public.projects for delete to authenticated using ((select public.is_admin()));

create policy "Public reads images of published projects; admins read all"
  on public.project_images for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.projects p
      where p.id = project_images.project_id and p.publication_status = 'published'
    )
  );
create policy "Admins can insert project images"
  on public.project_images for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update project images"
  on public.project_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete project images"
  on public.project_images for delete to authenticated using ((select public.is_admin()));

-- ─── Visible-flag content (experience, skills, education, certifications) ─
do $$
declare t text;
begin
  foreach t in array array['experiences','skill_categories','skills','education','certifications'] loop
    execute format(
      'create policy "Public can read visible rows; admins can read all" on public.%I
         for select to anon, authenticated using (is_visible or (select public.is_admin()))', t);
    execute format(
      'create policy "Admins can insert" on public.%I
         for insert to authenticated with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can update" on public.%I
         for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can delete" on public.%I
         for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- Skills inside a hidden category are hidden too.
drop policy "Public can read visible rows; admins can read all" on public.skills;
create policy "Public can read visible rows; admins can read all"
  on public.skills for select to anon, authenticated
  using (
    (select public.is_admin())
    or (
      is_visible and exists (
        select 1 from public.skill_categories c where c.id = skills.category_id and c.is_visible
      )
    )
  );

-- ─── Contact messages ──────────────────────────────────────────────────
create policy "Anyone can send a contact message"
  on public.contact_messages for insert to anon, authenticated
  with check (true); -- column checks + rate-limit trigger enforce validity
create policy "Admins can read contact messages"
  on public.contact_messages for select to authenticated using ((select public.is_admin()));
create policy "Admins can update contact messages"
  on public.contact_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete contact messages"
  on public.contact_messages for delete to authenticated using ((select public.is_admin()));
