-- ─────────────────────────────────────────────────────────────
-- Practical Submissions table
-- ─────────────────────────────────────────────────────────────
create table if not exists public.practical_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  user_email      text not null,
  user_name       text not null,
  course_id       text,
  module_id       text not null,
  module_title    text not null,
  practical_title text,
  submission_type text check (submission_type in ('loom','upload','both')),
  loom_url        text,
  file_url        text,
  status          text not null default 'pending'
                    check (status in ('pending','passed','failed')),
  admin_score     integer check (admin_score between 0 and 100),
  admin_feedback  text,
  reviewed_at     timestamptz,
  reviewed_by     text,
  submitted_at    timestamptz not null default now()
);

-- Row Level Security
alter table public.practical_submissions enable row level security;

create policy "students_insert_own" on public.practical_submissions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "students_read_own" on public.practical_submissions
  for select to authenticated
  using (auth.uid() = user_id);

create policy "admins_read_all" on public.practical_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admins_update_all" on public.practical_submissions
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Storage bucket: practical-uploads
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'practical-uploads',
  'practical-uploads',
  true,
  524288000,   -- 500 MB max per file
  array[
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/mpeg',
    'application/pdf',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: authenticated users upload to their own folder
create policy "students_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'practical-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users read their own files
create policy "students_read_own_files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'practical-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins read all files in the bucket
create policy "admins_read_all_files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'practical-uploads'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
