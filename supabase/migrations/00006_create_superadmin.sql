-- Create the first superadmin
DO $$
DECLARE
    user_id uuid := gen_random_uuid();
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        user_id,
        'your-admin@email.com',
        crypt('your-password', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Insert into admins table
    INSERT INTO public.admins (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'your-admin@email.com',
        'Super Admin',
        'superadmin',
        now(),
        now()
    );
END
$$;