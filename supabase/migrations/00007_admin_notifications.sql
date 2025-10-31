-- Create notification functions
create or replace function notify_admin_registration()
returns trigger
language plpgsql
security definer
as $$
declare
  superadmin_email text;
  template_id uuid;
  template_subject text;
  template_body text;
begin
  -- Get superadmin email
  select email into superadmin_email
  from public.admins
  where role = 'superadmin'
  limit 1;

  -- Get email template
  select id, subject, body into template_id, template_subject, template_body
  from public.email_templates
  where name = 'admin_approval_request';

  -- Send email using Supabase's built-in email function
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', current_setting('app.resend_api_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'noreply@safespace.com',
      'to', superadmin_email,
      'subject', template_subject,
      'html', replace(
        replace(
          template_body,
          '{{full_name}}',
          NEW.full_name
        ),
        '{{email}}',
        NEW.email
      )
    )
  );

  return NEW;
end;
$$;

-- Create trigger for new admin registrations
create trigger admin_registration_notification
after insert on public.admins
for each row
when (NEW.role = 'pending')
execute function notify_admin_registration();

-- Create function for approval notification
create or replace function notify_admin_approval()
returns trigger
language plpgsql
security definer
as $$
declare
  template_id uuid;
  template_subject text;
  template_body text;
begin
  -- Get email template based on approval status
  select id, subject, body into template_id, template_subject, template_body
  from public.email_templates
  where name = case
    when NEW.role = 'moderator' then 'admin_approved'
    else 'admin_rejected'
  end;

  -- Send email notification
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', current_setting('app.resend_api_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'noreply@safespace.com',
      'to', NEW.email,
      'subject', template_subject,
      'html', replace(
        template_body,
        '{{full_name}}',
        NEW.full_name
      )
    )
  );

  return NEW;
end;
$$;

-- Create trigger for admin approval status changes
create trigger admin_approval_notification
after update of role on public.admins
for each row
when (OLD.role = 'pending' and NEW.role != 'pending')
execute function notify_admin_approval();