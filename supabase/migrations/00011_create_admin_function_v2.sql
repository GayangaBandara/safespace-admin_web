-- Drop the old function if it exists
drop function if exists public.create_admin_account(text, text, text, text);

-- Create simplified admin creation function
create or replace function public.create_admin_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text default 'admin'
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_admin_id uuid;
  v_result json;
begin
  -- Validate role
  if p_role not in ('admin', 'moderator', 'superadmin') then
    return json_build_object(
      'success', false,
      'message', 'Invalid role. Must be admin, moderator, or superadmin'
    );
  end if;

  -- Check if email already exists in auth.users
  if exists (select 1 from auth.users where email = p_email) then
    return json_build_object(
      'success', false,
      'message', 'An account with this email already exists'
    );
  end if;

  -- Check if email already exists in admins table
  if exists (select 1 from public.admins where email = p_email) then
    return json_build_object(
      'success', false,
      'message', 'An admin with this email already exists'
    );
  end if;

  -- Create user in auth.users using Supabase Auth admin API compatible format
  begin
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      json_build_object('full_name', p_full_name, 'role', p_role),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    returning id into v_user_id;
  exception when others then
    return json_build_object(
      'success', false,
      'message', 'Failed to create user account: ' || SQLERRM
    );
  end;

  -- Create admin record
  begin
    insert into public.admins (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    ) values (
      v_user_id,
      p_email,
      p_full_name,
      p_role,
      now(),
      now()
    )
    returning id into v_admin_id;
  exception when others then
    -- Cleanup: delete the auth user if admin creation fails
    delete from auth.users where id = v_user_id;
    return json_build_object(
      'success', false,
      'message', 'Failed to create admin record: ' || SQLERRM
    );
  end;

  -- Create user_roles entry
  begin
    insert into public.user_roles (
      user_id,
      role,
      created_at,
      updated_at
    ) values (
      v_user_id,
      'admin',
      now(),
      now()
    )
    on conflict (user_id) do update set
      role = 'admin',
      updated_at = now();
  exception when others then
    -- Don't fail the entire operation for user_roles issues
    null;
  end;

  return json_build_object(
    'success', true,
    'message', 'Admin account created successfully',
    'admin_id', v_admin_id,
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role
  );

exception when others then
  -- Cleanup on any other error
  if v_user_id is not null then
    delete from auth.users where id = v_user_id;
  end if;
  
  return json_build_object(
    'success', false,
    'message', 'Unexpected error creating admin account: ' || SQLERRM
  );
end;
$$;

-- Grant execute permission to authenticated users and service role
grant execute on function public.create_admin_account(text, text, text, text) to authenticated;
grant execute on function public.create_admin_account(text, text, text, text) to service_role;