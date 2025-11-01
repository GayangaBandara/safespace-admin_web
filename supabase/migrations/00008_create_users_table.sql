-- Create users table if it doesn't exist
create table if not exists public.users (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  date_of_birth date,
  phone_number text,
  status text check (status in ('active', 'inactive', 'suspended')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Admins can update users" on public.users;
drop policy if exists "Admins can insert users" on public.users;
drop policy if exists "Admins can delete users" on public.users;

-- Create comprehensive admin policies for users table
create policy "Admins can view all users"
  on public.users for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can insert users"
  on public.users for insert
  with check (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update users"
  on public.users for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can delete users"
  on public.users for delete
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Create trigger for updated_at if it doesn't exist
create or replace trigger handle_updated_at
  before update on public.users
  for each row
  execute procedure public.handle_updated_at();

-- Grant necessary permissions to authenticated users
grant all on public.users to authenticated;
grant usage on schema public to authenticated;

-- Create a function to sync users from auth.users
create or replace function public.sync_user_from_auth()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now(),
    now()
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically sync users from auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.sync_user_from_auth();

-- Create some sample data for testing
insert into public.users (id, email, full_name, status) 
values 
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com', 'John Doe', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com', 'Jane Smith', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'user3@example.com', 'Bob Johnson', 'inactive')
on conflict (id) do nothing;