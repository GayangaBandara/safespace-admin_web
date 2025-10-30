-- Add admin management functions
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
  admin_exists boolean;
  result json;
begin
  -- Check if approver is a superadmin
  select role into approver_role
  from public.admins
  where id = approver_id;

  if approver_role != 'superadmin' then
    return json_build_object(
      'success', false,
      'message', 'Only superadmins can approve other admins'
    );
  end if;

  -- Check if admin exists
  select exists(
    select 1
    from public.admins
    where id = admin_id
  ) into admin_exists;

  if not admin_exists then
    return json_build_object(
      'success', false,
      'message', 'Admin not found'
    );
  end if;

  -- Update admin status
  if approve then
    update public.admins
    set role = 'moderator',
        updated_at = now()
    where id = admin_id
    and role = 'pending';
  else
    delete from auth.users
    where id = admin_id;

    delete from public.admins
    where id = admin_id;
  end if;

  return json_build_object(
    'success', true,
    'message', case when approve then 'Admin approved' else 'Admin rejected' end
  );
end;
$$;