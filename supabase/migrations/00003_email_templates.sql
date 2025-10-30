-- Create email templates table
create table public.email_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  subject text not null,
  body text not null,
  variables jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on email_templates
alter table public.email_templates enable row level security;

-- Create policy for email templates
create policy "Only admins can view email templates"
  on public.email_templates for select
  using (exists (
    select 1 from public.admins where id = auth.uid()
  ));

-- Insert default email templates
insert into public.email_templates (name, subject, body, variables) values
(
  'admin_approval_request',
  'New Admin Registration Request',
  'A new admin has registered and requires approval:

Full Name: {{full_name}}
Email: {{email}}

Please review this request in the admin dashboard.',
  '{"full_name": "string", "email": "string"}'::jsonb
),
(
  'admin_approved',
  'Your Admin Account has been Approved',
  'Dear {{full_name}},

Your admin account request has been approved. You can now log in to the SafeSpace admin dashboard with your credentials.

Best regards,
SafeSpace Team',
  '{"full_name": "string"}'::jsonb
),
(
  'admin_rejected',
  'Admin Account Request Status',
  'Dear {{full_name}},

We regret to inform you that your admin account request has been rejected.

Best regards,
SafeSpace Team',
  '{"full_name": "string"}'::jsonb
);