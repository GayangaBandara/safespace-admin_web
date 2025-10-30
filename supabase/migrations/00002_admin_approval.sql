-- Function to approve or reject admin accounts
create or replace function approve_admin(
  admin_id uuid,
  approve boolean,
  approver_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  approver_role text;
begin
  -- Check if approver is a superadmin
  select role into approver_role
  from public.admins
  where id = approver_id;
  
  if approver_role != 'superadmin' then
    return json_build_object(
      'success', false,
      'message', 'Only superadmins can approve or reject admin accounts'
    );
  end if;
  
  -- Update the admin status
  if approve then
    update public.admins
    set role = 'moderator'
    where id = admin_id
    and role = 'pending';
  else
    delete from public.admins
    where id = admin_id
    and role = 'pending';
    
    -- Also delete the auth user
    delete from auth.users
    where id = admin_id;
  end if;
  
  return json_build_object(
    'success', true,
    'message', case when approve then 'Admin approved' else 'Admin rejected' end
  );
end;
$$;