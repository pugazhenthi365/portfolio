-- RLS test-suite. Run after migrations + seed:
--   psql -v ON_ERROR_STOP=1 -f tests/db/rls.test.sql
-- Each check raises an exception on failure, so the run stops at the first problem.
\set QUIET on
\pset tuples_only on
\pset format unaligned
set client_min_messages = warning;

-- Fixtures (run as owner) ------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'stranger@example.com');
insert into public.admin_profiles (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com');
insert into public.contact_messages (name, email, message) values ('Seed Person', 'seed@example.com', 'Seeded message for the admin inbox test.');

create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;

create or replace function pg_temp.expect_error(stmt text, label text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok - % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (statement succeeded)', label;
end $$;

-- Rows affected by an UPDATE/DELETE that RLS silently filters to zero rows.
create or replace function pg_temp.affected(stmt text) returns int language plpgsql as $$
declare n int;
begin
  execute stmt; get diagnostics n = row_count; return n;
end $$;

set client_min_messages = notice;

-- ═══ Anonymous visitor ═══════════════════════════════════════════════
set role anon;
select null from set_config('request.jwt.claim.sub', '', false);

select pg_temp.expect((select count(*) from public.projects) = 7, 'anon sees exactly the 7 published projects');
select pg_temp.expect((select count(*) from public.projects where publication_status <> 'published') = 0, 'anon cannot see drafts');
select pg_temp.expect((select count(*) from public.profiles) = 1, 'anon can read the profile');
select pg_temp.expect((select count(*) from public.skills) > 0, 'anon can read skills');
select pg_temp.expect_error($$update public.projects set title = 'hacked'$$, 'anon cannot update projects');
select pg_temp.expect_error($$insert into public.projects (slug, title, short_description, category) values ('x', 'x', 'x', 'x')$$, 'anon cannot insert projects');
select pg_temp.expect_error($$delete from public.experiences$$, 'anon cannot delete experiences');
select pg_temp.expect_error($$update public.profiles set full_name = 'hacked'$$, 'anon cannot update the profile');
select pg_temp.expect_error($$select * from public.contact_messages$$, 'anon cannot read contact messages');
select pg_temp.expect_error($$select * from public.admin_profiles$$, 'anon cannot read admin_profiles');
select pg_temp.expect_error($$insert into public.admin_profiles (id, email) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x@y.z')$$, 'anon cannot make itself admin');
insert into public.contact_messages (name, email, subject, message) values ('Visitor', 'visitor@example.com', 'Hello', 'I would like to talk about a role.');
select pg_temp.expect(true, 'anon can submit a contact message');
select pg_temp.expect_error($$insert into public.contact_messages (name, email, message, status) values ('Visitor', 'v2@example.com', 'I would like to talk about a role.', 'read')$$, 'anon cannot set message status');
select pg_temp.expect_error($$insert into public.contact_messages (name, email, message) values ('V', 'bad', 'short')$$, 'contact message constraints reject invalid input');
insert into public.contact_messages (name, email, message) values ('Visitor', 'visitor@example.com', 'Second message within the window.');
insert into public.contact_messages (name, email, message) values ('Visitor', 'visitor@example.com', 'Third message within the window...');
select pg_temp.expect_error($$insert into public.contact_messages (name, email, message) values ('Visitor', 'visitor@example.com', 'Fourth message should be rate limited.')$$, 'rate limit blocks a 4th message in 10 minutes');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('media', 'evil.png')$$, 'anon cannot upload to storage');
select pg_temp.expect((select count(*) from storage.objects) = 0, 'anon cannot list storage objects');

-- ═══ Authenticated but NOT an admin ══════════════════════════════════
set role authenticated;
select null from set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', false);

select pg_temp.expect(not public.is_admin(), 'stranger is not admin');
select pg_temp.expect((select count(*) from public.projects where publication_status = 'draft') = 0, 'stranger cannot see drafts');
select pg_temp.expect(pg_temp.affected($$update public.projects set title = 'hacked'$$) = 0, 'stranger update affects 0 rows');
select pg_temp.expect(pg_temp.affected($$delete from public.projects$$) = 0, 'stranger delete affects 0 rows');
select pg_temp.expect_error($$insert into public.skills (category_id, name) values ('30000000-0000-4000-8000-000000000001', 'Hacking')$$, 'stranger cannot insert skills');
select pg_temp.expect((select count(*) from public.contact_messages) = 0, 'stranger cannot read contact messages');
select pg_temp.expect((select count(*) from public.admin_profiles) = 0, 'stranger sees no admin records');
select pg_temp.expect_error($$insert into public.admin_profiles (id, email) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x@y.z')$$, 'stranger cannot make itself admin');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('media', 'evil.png')$$, 'stranger cannot upload to storage');

-- ═══ Administrator ═══════════════════════════════════════════════════
select null from set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', false);

select pg_temp.expect(public.is_admin(), 'admin is recognised');
select pg_temp.expect((select count(*) from public.projects) = 8, 'admin sees drafts too (8 projects)');
insert into public.projects (slug, title, short_description, category, publication_status)
  values ('new-project', 'New project', 'Created by the admin', 'Test', 'draft');
select pg_temp.expect((select published_at is null from public.projects where slug = 'new-project'), 'draft has no published_at');
update public.projects set publication_status = 'published' where slug = 'new-project';
select pg_temp.expect((select published_at is not null from public.projects where slug = 'new-project'), 'publishing stamps published_at');
select pg_temp.expect_error($$insert into public.projects (slug, title, short_description, category) values ('Bad Slug!', 'x', 'x', 'x')$$, 'slug format is enforced');
select pg_temp.expect_error($$insert into public.projects (slug, title, short_description, category) values ('new-project', 'x', 'x', 'x')$$, 'slugs are unique');
insert into public.project_images (project_id, url, alt) select id, 'https://example.com/a.png', 'Screenshot' from public.projects where slug = 'new-project';
select pg_temp.expect(pg_temp.affected($$update public.profiles set availability_enabled = true$$) = 1, 'admin can update the profile');
select pg_temp.expect_error($$insert into public.profiles (full_name, title, headline, email) values ('x', 'x', 'x', 'a@b.co')$$, 'profile is a singleton');
select pg_temp.expect_error($$insert into public.experiences (company, role, start_date, end_date) values ('X', 'Y', '2025-01-01', '2024-01-01')$$, 'experience end date must follow start date');
select pg_temp.expect((select count(*) from public.contact_messages) >= 4, 'admin can read contact messages');
select pg_temp.expect(pg_temp.affected($$update public.contact_messages set status = 'read'$$) >= 4, 'admin can mark messages read');
select pg_temp.expect_error($$update public.contact_messages set message = 'tampered message body here'$$, 'admin cannot rewrite message bodies');
insert into storage.objects (bucket_id, name) values ('media', 'projects/cover.png');
select pg_temp.expect((select count(*) from storage.objects) = 1, 'admin can upload and list storage objects');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('other-bucket', 'x')$$, 'admin limited to portfolio buckets');
select pg_temp.expect_error($$insert into public.admin_profiles (id, email) values ('bbbbbbbb-0000-4000-8000-000000000002', 'x@y.z')$$, 'even admins cannot add admins through the API');

-- Images of a draft project are hidden from the public
update public.projects set publication_status = 'draft' where slug = 'new-project';
set role anon;
select null from set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from public.project_images) = 0, 'images of unpublished projects are hidden');

-- Hidden category hides its skills
set role authenticated;
select null from set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', false);
update public.skill_categories set is_visible = false where name = 'Backend';
set role anon;
select null from set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from public.skills s where s.category_id = '30000000-0000-4000-8000-000000000004') = 0, 'skills in hidden categories are hidden');

-- ═══ Admin deletion cascades ═════════════════════════════════════════
set role authenticated;
select null from set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', false);
delete from public.projects where slug = 'new-project';
select pg_temp.expect((select count(*) from public.project_images) = 0, 'deleting a project deletes its images');

reset role;
\echo 'ALL RLS TESTS PASSED'
