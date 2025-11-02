-- Create tables for the SafeSpace Admin Web application
-- Create admins table
create table public.admins (
  id uuid not null,
  email text not null,
  full_name text not null,
  role text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email),
  constraint admins_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint admins_role_check check (
    (
      role = any (
        array[
          'superadmin'::text,
          'admin'::text,
          'moderator'::text,
          'pending'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Enable RLS on admins
alter table public.admins enable row level security;

-- Create RLS Policies for admins
create policy "Admins can view their own profile"
  on public.admins for select
  using (auth.uid() = id);

create policy "Only superadmins can create other admins"
  on public.admins for insert
  using (exists (
    select 1 from public.admins
    where id = auth.uid() and role = 'superadmin'
  ));

create policy "Admins can update their own profile"
  on public.admins for update
  using (auth.uid() = id);

create policy "Only superadmins can delete admins"
  on public.admins for delete
  using (exists (
    select 1 from public.admins
    where id = auth.uid() and role = 'superadmin'
  ));

-- Functions and Triggers

-- Update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create updated_at triggers for all tables
create trigger handle_admins_updated_at
  before update on public.admins
  for each row
  execute procedure public.handle_updated_at();