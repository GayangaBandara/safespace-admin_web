-- Enable RLS
alter table public.admins enable row level security;

-- Create policies
create policy "Admins can view other admins"
  on public.admins
  for select
  using (auth.uid() in (select id from public.admins));

create policy "Superadmins can insert new admins"
  on public.admins
  for insert
  with check (
    auth.uid() in (
      select id from public.admins 
      where role = 'superadmin'
    )
  );

create policy "Admins can update their own profile"
  on public.admins
  for update
  using (auth.uid() = id)
  with check (
    (auth.uid() = id and role = OLD.role) or
    (auth.uid() in (
      select id from public.admins 
      where role = 'superadmin'
    ))
  );

-- Default admin signup policy
create policy "Allow self-registration with pending status"
  on public.admins
  for insert
  with check (
    role IN ('pending', 'admin', 'moderator', 'superadmin', 'rejected')
  );