-- Migration: create doctor_registration_requests table
-- Adds the table used to store doctor registration requests from the public site

-- Ensure uuid-ossp extension is available for uuid_generate_v4()
create extension if not exists "uuid-ossp";

CREATE TABLE public.doctor_registration_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  full_name text NOT NULL,
  specialization text NOT NULL,
  years_experience integer NOT NULL,
  license_number text NOT NULL UNIQUE,
  license_document_url text,
  qualification_document_url text,
  phone_number text,
  address_line_1 text,
  address_line_2 text,
  city text,
  postal_code text,
  country text NOT NULL,
  status text DEFAULT 'pending'::text,
  rejection_reason text,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT doctor_registration_requests_pkey PRIMARY KEY (id)
);
