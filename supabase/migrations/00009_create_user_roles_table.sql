-- Create user_role_type enum (drop first if exists, then create)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role_type') then
    create type public.user_role_type as enum ('patient', 'doctor', 'admin');
  end if;
end $$;

-- Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role public.user_role_type not null default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create index on user_id for better performance
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);

-- Drop existing policies if they exist
drop policy if exists "Admins can view user roles" on public.user_roles;
drop policy if exists "Admins can insert user roles" on public.user_roles;
drop policy if exists "Admins can update user roles" on public.user_roles;
drop policy if exists "Admins can delete user roles" on public.user_roles;

-- Create admin policies for user_roles table
create policy "Admins can view user roles"
  on public.user_roles for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can insert user roles"
  on public.user_roles for insert
  with check (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update user roles"
  on public.user_roles for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can delete user roles"
  on public.user_roles for delete
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Create trigger for updated_at
create or replace trigger handle_updated_at
  before update on public.user_roles
  for each row
  execute procedure public.handle_updated_at();

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

-- Create some sample data for testing (linking to existing users)
insert into public.user_roles (user_id, role) 
values 
  ('00000000-0000-0000-0000-000000000001', 'patient'),
  ('00000000-0000-0000-0000-000000000002', 'doctor'),
  ('00000000-0000-0000-0000-000000000003', 'admin')
on conflict (user_id) do nothing;