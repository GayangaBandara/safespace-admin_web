-- Create user_role_type enum (drop first if exists, then create)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role_type') then
    create type public.user_role_type as enum ('patient', 'doctor', 'admin');
  end if;
end $$;

-- Create user_roles table
create table if not exists public.user_roles (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  role public.user_role_type not null default 'patient'::user_role_type,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_user_id_key unique (user_id),
  constraint user_roles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Disable RLS on user_roles
alter table public.user_roles disable row level security;

-- Create index on user_id for better performance
create index IF not exists idx_user_roles_user_id on public.user_roles using btree (user_id) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger handle_updated_at BEFORE
update on user_roles for EACH row
execute FUNCTION handle_updated_at ();

-- Grant necessary permissions to authenticated users
grant all on public.user_roles to authenticated;
grant usage on schema public to authenticated;

-- Create function to ensure all users have a default user_roles entry
create or replace function public.create_user_role_if_not_exists()
returns trigger as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'patient')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create user_roles entry when user signs up
create or replace trigger on_auth_user_created_roles
  after insert on auth.users
  for each row execute procedure public.create_user_role_if_not_exists();

-- Sample data will be inserted when actual users sign up