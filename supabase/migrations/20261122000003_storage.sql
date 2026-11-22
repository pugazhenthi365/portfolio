-- ════════════════════════════════════════════════════════════════════════
-- Supabase Storage: buckets and policies
--
-- media      public read, images only, 5 MB max   (profile photos, covers, screenshots)
-- documents  public read, PDF only,   10 MB max   (resume)
--
-- Public buckets serve files through their public URL without RLS, so no
-- public SELECT policy is required (and none is granted: anonymous users
-- cannot list bucket contents). Only administrators can upload, replace,
-- delete or list objects.
-- ════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('documents', 'documents', true, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can list portfolio files"
  on storage.objects for select to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can upload portfolio files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can update portfolio files"
  on storage.objects for update to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()))
  with check (bucket_id in ('media', 'documents') and (select public.is_admin()));

create policy "Admins can delete portfolio files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'documents') and (select public.is_admin()));
