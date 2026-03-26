-- Profiles table (one row per user, links to Supabase auth)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Progress table (lesson completions)
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- Quiz scores table
create table public.quiz_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quiz_id text not null,
  score integer not null,
  passed boolean not null,
  completed_at timestamptz default now(),
  unique(user_id, quiz_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.quiz_scores enable row level security;

-- Profiles: users see their own, admins see all
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id);

create policy "admins_all_profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Progress: users manage their own, admins see all
create policy "users_own_progress" on public.progress
  for all using (auth.uid() = user_id);

create policy "admins_all_progress" on public.progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Quiz scores: users manage their own, admins see all
create policy "users_own_scores" on public.quiz_scores
  for all using (auth.uid() = user_id);

create policy "admins_all_scores" on public.quiz_scores
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Make sales@virtuecore.co.uk an admin automatically
create or replace function public.set_admin_on_email()
returns trigger as $$
begin
  if new.email = 'sales@virtuecore.co.uk' then
    update public.profiles set is_admin = true where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_check_admin
  after insert on public.profiles
  for each row execute function public.set_admin_on_email();
