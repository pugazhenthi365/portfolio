-- ════════════════════════════════════════════════════════════════════════
-- Portfolio CMS — core schema
-- Tables, constraints, indexes and updated_at triggers.
-- Row Level Security policies live in 20261122000002_rls.sql.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Helpers ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Administrators ─────────────────────────────────────────────────────
-- Only users listed here may manage content. Rows are created manually
-- (SQL editor) — there is no API path that can insert into this table.
create table public.admin_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- SECURITY DEFINER so policies can call it without exposing admin_profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles a where a.id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── Profile (singleton) ───────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  singleton             boolean not null default true unique check (singleton),
  full_name             text not null check (char_length(full_name) between 1 and 120),
  title                 text not null check (char_length(title) <= 120),
  positioning           text not null default '' check (char_length(positioning) <= 300),
  headline              text not null check (char_length(headline) <= 200),
  hero_intro            text not null default '' check (char_length(hero_intro) <= 500),
  short_intro           text not null default '' check (char_length(short_intro) <= 1000),
  about                 text not null default '' check (char_length(about) <= 8000),
  location              text not null default '' check (char_length(location) <= 120),
  experience_summary    text check (char_length(experience_summary) <= 60),
  email                 text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  linkedin_url          text check (linkedin_url ~* '^https://'),
  github_url            text check (github_url ~* '^https://'),
  photo_url             text,
  photo_alt             text check (char_length(photo_alt) <= 300),
  resume_url            text,
  resume_file_name      text,
  availability_enabled  boolean not null default false,
  availability_text     text check (char_length(availability_text) <= 120),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Site settings (singleton) ─────────────────────────────────────────
create table public.site_settings (
  id                    uuid primary key default gen_random_uuid(),
  singleton             boolean not null default true unique check (singleton),
  site_title            text not null check (char_length(site_title) <= 120),
  site_description      text not null check (char_length(site_description) <= 300),
  contact_form_enabled  boolean not null default true,
  contact_heading       text not null default 'Let''s build something useful.' check (char_length(contact_heading) <= 120),
  contact_text          text not null default '' check (char_length(contact_text) <= 600),
  footer_note           text check (char_length(footer_note) <= 300),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Projects ──────────────────────────────────────────────────────────
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.project_status as enum ('live', 'completed', 'in_progress', 'paused', 'concept');

create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title               text not null check (char_length(title) between 1 and 120),
  short_description   text not null check (char_length(short_description) between 1 and 300),
  description         text check (char_length(description) <= 10000),
  category            text not null check (char_length(category) <= 80),
  project_type        text check (char_length(project_type) <= 60),
  year                text check (char_length(year) <= 30),
  problem             text check (char_length(problem) <= 10000),
  solution            text check (char_length(solution) <= 10000),
  contribution        text check (char_length(contribution) <= 10000),
  tech_stack          text[] not null default '{}' check (cardinality(tech_stack) <= 40),
  cover_image_url     text,
  cover_image_alt     text check (char_length(cover_image_alt) <= 300),
  github_url          text check (github_url ~* '^https?://'),
  live_url            text check (live_url ~* '^https?://'),
  project_status      public.project_status not null default 'completed',
  publication_status  public.publication_status not null default 'draft',
  is_featured         boolean not null default false,
  sort_order          integer not null default 0,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index projects_public_idx on public.projects (publication_status, sort_order);
create index projects_featured_idx on public.projects (is_featured) where publication_status = 'published';

-- Stamp published_at the first time a project is published.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.publication_status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create table public.project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  url         text not null,
  alt         text not null check (char_length(alt) between 1 and 300),
  caption     text check (char_length(caption) <= 300),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index project_images_project_idx on public.project_images (project_id, sort_order);

-- ─── Experience ────────────────────────────────────────────────────────
create table public.experiences (
  id               uuid primary key default gen_random_uuid(),
  company          text not null check (char_length(company) between 1 and 120),
  company_note     text check (char_length(company_note) <= 120),
  role             text not null check (char_length(role) between 1 and 120),
  employment_type  text check (char_length(employment_type) <= 60),
  location         text check (char_length(location) <= 120),
  work_mode        text check (char_length(work_mode) <= 40),
  start_date       date not null,
  end_date         date,
  is_current       boolean not null default false,
  summary          text check (char_length(summary) <= 2000),
  highlights       text[] not null default '{}' check (cardinality(highlights) <= 20),
  technologies     text[] not null default '{}' check (cardinality(technologies) <= 30),
  sort_order       integer not null default 0,
  is_visible       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint experiences_dates_chk check (end_date is null or end_date >= start_date),
  constraint experiences_current_chk check (not (is_current and end_date is not null))
);

create index experiences_order_idx on public.experiences (sort_order);

-- ─── Skills ────────────────────────────────────────────────────────────
create table public.skill_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique check (char_length(name) between 1 and 80),
  description  text check (char_length(description) <= 300),
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.skills (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.skill_categories (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (category_id, name)
);

create index skills_category_idx on public.skills (category_id, sort_order);

-- ─── Education & certifications ────────────────────────────────────────
create table public.education (
  id           uuid primary key default gen_random_uuid(),
  institution  text not null check (char_length(institution) between 1 and 160),
  degree       text not null check (char_length(degree) between 1 and 160),
  field        text check (char_length(field) <= 160),
  location     text check (char_length(location) <= 120),
  start_year   integer check (start_year between 1950 and 2100),
  end_year     integer check (end_year between 1950 and 2100),
  grade        text check (char_length(grade) <= 40),
  description  text check (char_length(description) <= 2000),
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint education_years_chk check (end_year is null or start_year is null or end_year >= start_year)
);

create type public.certification_kind as enum ('certification', 'achievement');

create table public.certifications (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 1 and 200),
  issuer          text check (char_length(issuer) <= 160),
  kind            public.certification_kind not null default 'certification',
  issued_on       text check (char_length(issued_on) <= 40),
  credential_url  text check (credential_url ~* '^https?://'),
  description     text check (char_length(description) <= 2000),
  sort_order      integer not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Contact messages ──────────────────────────────────────────────────
create type public.message_status as enum ('new', 'read', 'archived');

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 100),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject     text check (char_length(subject) <= 150),
  message     text not null check (char_length(message) between 20 and 5000),
  status      public.message_status not null default 'new',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index contact_messages_inbox_idx on public.contact_messages (status, created_at desc);
create index contact_messages_email_recent_idx on public.contact_messages (email, created_at desc);

-- Database-level rate limit: max 3 messages per email address per 10 minutes,
-- and 30 messages per 10 minutes overall. Applies even if someone calls the
-- REST API directly with the public anon key.
create or replace function public.contact_messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Visitors may never set moderation fields themselves.
  new.status := 'new';
  new.created_at := now();

  if (select count(*) from public.contact_messages
       where email = new.email and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.contact_messages
       where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ─── Triggers ──────────────────────────────────────────────────────────
create trigger contact_messages_rate_limit
  before insert on public.contact_messages
  for each row execute function public.contact_messages_rate_limit();

create trigger projects_published_at
  before insert or update of publication_status on public.projects
  for each row execute function public.stamp_published_at();

do $$
declare t text;
begin
  foreach t in array array[
    'admin_profiles','profiles','site_settings','projects','project_images','experiences',
    'skill_categories','skills','education','certifications','contact_messages'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t
    );
  end loop;
end $$;
