-- Create tables for the SafeSpace Admin Web application
-- Enable RLS
alter table auth.users enable row level security;

-- Create admins table
create table public.admins (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('superadmin', 'moderator')) not null default 'moderator',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on admins
alter table public.admins enable row level security;

-- Create users table
create table public.users (
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

-- Create doctors table
create table public.doctors (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text not null,
  specialization text,
  license_number text,
  years_of_experience integer,
  status text check (status in ('pending', 'approved', 'suspended', 'rejected')) default 'pending',
  verification_documents jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on doctors
alter table public.doctors enable row level security;

-- Create appointments table
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  doctor_id uuid references public.doctors not null,
  status text check (status in ('scheduled', 'completed', 'cancelled', 'no-show')) default 'scheduled',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  meeting_link text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on appointments
alter table public.appointments enable row level security;

-- Create reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  type text check (type in ('user_feedback', 'session_report', 'incident_report')) not null,
  content jsonb not null,
  submitted_by uuid references auth.users not null,
  status text check (status in ('pending', 'reviewed', 'archived')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Create RLS Policies

-- Admins policies
create policy "Admins can view their own profile"
  on public.admins for select
  using (auth.uid() = id);

create policy "Only superadmins can create other admins"
  on public.admins for insert
  using (exists (
    select 1 from public.admins 
    where id = auth.uid() and role = 'superadmin'
  ));

-- Users policies
create policy "Admins can view all users"
  on public.users for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update users"
  on public.users for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Doctors policies
create policy "Admins can view all doctors"
  on public.doctors for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update doctors"
  on public.doctors for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Appointments policies
create policy "Admins can view all appointments"
  on public.appointments for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update appointments"
  on public.appointments for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Reports policies
create policy "Admins can view all reports"
  on public.reports for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

create policy "Admins can update reports"
  on public.reports for update
  using (exists (
    select 1 from public.admins where id = auth.uid()
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
create trigger handle_updated_at
  before update on public.admins
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.users
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.doctors
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.appointments
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.reports
  for each row
  execute procedure public.handle_updated_at();