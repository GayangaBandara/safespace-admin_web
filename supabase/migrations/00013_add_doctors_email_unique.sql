-- Migration: add unique index on doctors.email to support ON CONFLICT (email) upserts
-- This migration will create a case-insensitive unique index on email if the doctors table exists.

DO $$
BEGIN
  -- Only proceed if doctors table exists
  IF to_regclass('public.doctors') IS NOT NULL THEN
    -- Check if the index already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'doctors' AND indexname = 'idx_doctors_email_unique'
    ) THEN
      -- Create a unique index on lower(email) to make uniqueness case-insensitive
      EXECUTE 'CREATE UNIQUE INDEX idx_doctors_email_unique ON public.doctors ((lower(email)));';
    END IF;
  ELSE
    RAISE NOTICE 'Table public.doctors does not exist; skipping unique index creation.';
  END IF;
END
$$;