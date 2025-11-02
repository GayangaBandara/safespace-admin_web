-- Drop existing function if it exists
drop function if exists public.create_admin_account(text, text, text, text);

-- Create comprehensive admin creation function
create or replace function public.create_admin_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text default 'admin'
)
returns json
language plpgsql
security definer 
set search_path = public
as $$
declare
  v_user_id uuid;
  v_admin_id uuid;
  v_result json;
begin
  -- Input validation
  if p_email is null or p_password is null or p_full_name is null then
    return json_build_object(
      'success', false,
      'message', 'Email, password, and full name are required'
    );
  end if;

  -- Validate role
  if p_role not in ('admin', 'moderator', 'superadmin', 'pending') then
    return json_build_object(
      'success', false,
      'message', 'Invalid role. Must be admin, moderator, superadmin, or pending'
    );
  end if;

  -- Check if email already exists in any relevant table
  if exists (
    select 1 
    from (
      select email from auth.users
      union
      select email from public.admins
    ) existing_users 
    where email = p_email
  ) then
    return json_build_object(
      'success', false,
      'message', 'An account with this email already exists'
    );
  end if;

  -- Create user in auth.users with proper error handling
  begin
    v_user_id := gen_random_uuid();
    
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
      recovery_token,
      is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'full_name', p_full_name,
        'role', p_role,
        'is_admin', true
      ),
      now(),
      now(),
      encode(gen_random_bytes(32), 'base64'),
      '',
      '',
      encode(gen_random_bytes(32), 'base64'),
      p_role = 'superadmin'
    );
  exception 
    when unique_violation then
      return json_build_object(
        'success', false,
        'message', 'Email address is already registered'
      );
    when others then
      return json_build_object(
        'success', false,
        'message', 'Failed to create user account: ' || SQLERRM
      );
  end;

  -- Create admin record with proper error handling
  begin
    insert into public.admins (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at,
      status
    ) values (
      v_user_id,
      p_email,
      p_full_name,
      p_role,
      now(),
      now(),
      case 
        when p_role = 'pending' then 'pending'
        else 'active'
      end
    )
    returning id into v_admin_id;

    -- If this succeeds, immediately create the user_roles entry
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
    -- Cleanup: delete the auth user if admin creation fails
    delete from auth.users where id = v_user_id;
    return json_build_object(
      'success', false,
      'message', 'Failed to create admin record: ' || SQLERRM
    );
  end;

  -- Update user_roles table
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

  -- Update users table if it exists (optional operation)
  begin
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
      insert into public.users (
        id,
        email,
        full_name,
        status,
        created_at,
        updated_at
      ) values (
        v_user_id,
        p_email,
        p_full_name,
        'active',
        now(),
        now()
      )
      on conflict (id) do update set
        email = p_email,
        full_name = p_full_name,
        status = 'active',
        updated_at = now();
    end if;
  exception when others then
    -- Silently continue if users table operations fail
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

-- Grant execute permission to authenticated users
grant execute on function public.create_admin_account(text, text, text, text) to authenticated;

-- Also grant to service role
grant execute on function public.create_admin_account(text, text, text, text) to service_role;