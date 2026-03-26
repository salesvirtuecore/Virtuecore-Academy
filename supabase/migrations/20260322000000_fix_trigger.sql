-- Drop existing trigger and function to recreate cleanly
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_created_check_admin on public.profiles;
drop function if exists public.handle_new_user();
drop function if exists public.set_admin_on_email();

-- Recreate the user creation function with proper security
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when new.email = 'sales@virtuecore.co.uk' then true else false end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
