-- Core schema for Home & Own
-- Safe to re-run; uses IF NOT EXISTS where possible

-- Extensions
-- Ensure pgcrypto is installed with objects in the standard 'extensions' schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS agent_license_seq
  INCREMENT BY 1
  MINVALUE 100
  START WITH 100
  OWNED BY NONE;

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  city text,
  state text,
  user_type text NOT NULL CHECK (user_type IN ('buyer','seller','agent')),
  status text NOT NULL DEFAULT 'pending',
  verification_status text NOT NULL DEFAULT 'pending',
  email_verified boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,
  agent_license_number text UNIQUE,
  custom_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  property_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  inquiry_type text DEFAULT 'general',
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled', 'completed')),
  user_id uuid,
  agent_id uuid,
  agent_notes text,
  contacted_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  property_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  user_id uuid,
  agent_id uuid,
  agent_notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  specialization text,
  bio text,
  experience_years int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  business_name text,
  business_type text,
  status text DEFAULT 'pending',
  verification_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_approvals (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  uploaded_by uuid,
  document_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz NOT NULL
);

-- Basic RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY users_read ON public.users FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY users_update_self ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY agent_profiles_read ON public.agent_profiles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY seller_profiles_read ON public.seller_profiles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY documents_read ON public.documents FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY inquiries_insert ON public.inquiries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY inquiries_select ON public.inquiries FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY bookings_insert ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY bookings_select ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Functions
CREATE OR REPLACE FUNCTION public.generate_agent_license()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
  formatted text;
BEGIN
  n := nextval('agent_license_seq');
  formatted := 'H0' || lpad(n::text, 3, '0');
  RETURN formatted;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_verification_token(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok text;
  exp_at timestamptz := now() + interval '30 minutes';
BEGIN
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.email_verification_tokens(user_id, token, expires_at)
  VALUES (user_id_param, tok, exp_at);
  RETURN tok;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_email_token(token_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  already boolean := false;
BEGIN
  SELECT evt.*, u.email_verified
  INTO rec
  FROM public.email_verification_tokens evt
  JOIN public.users u ON u.id = evt.user_id
  WHERE evt.token = token_param;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  IF rec.used_at IS NOT NULL THEN
    already := true;
  END IF;
  IF rec.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Token expired');
  END IF;

  UPDATE public.users
  SET email_verified = true,
      email_verified_at = now()
  WHERE id = rec.user_id;

  UPDATE public.email_verification_tokens
  SET used_at = now()
  WHERE id = rec.id;

  RETURN json_build_object('success', true, 'already_verified', already, 'message', 'Email verified successfully');
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_user(user_id_param uuid, approved_by_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_license text;
BEGIN
  SELECT user_type INTO v_user_type FROM public.users WHERE id = user_id_param FOR UPDATE;
  IF v_user_type IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  IF v_user_type = 'agent' THEN
    SELECT agent_license_number INTO v_license FROM public.users WHERE id = user_id_param FOR UPDATE;
    IF v_license IS NULL OR length(trim(v_license)) = 0 THEN
      v_license := public.generate_agent_license();
      UPDATE public.users SET agent_license_number = v_license WHERE id = user_id_param;
    END IF;
  END IF;

  UPDATE public.users
  SET verification_status = 'verified', status = 'active', updated_at = now()
  WHERE id = user_id_param;

  UPDATE public.user_approvals
  SET status = 'approved', reviewed_by = approved_by_param, reviewed_at = now()
  WHERE user_id = user_id_param;

  RETURN json_build_object('success', true, 'license_number', v_license);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(user_id_param uuid, rejected_by_param uuid, reason_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET verification_status = 'rejected', status = 'inactive', updated_at = now()
  WHERE id = user_id_param;

  INSERT INTO public.user_approvals (user_id, status, rejection_reason, reviewed_by, reviewed_at)
  VALUES (user_id_param, 'rejected', reason_param, rejected_by_param, now())
  ON CONFLICT (user_id) DO UPDATE
  SET status = 'rejected', rejection_reason = reason_param, reviewed_by = rejected_by_param, reviewed_at = now();

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_exists(email_param text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.users WHERE lower(email) = lower(email_param);
  IF cnt > 0 THEN
    RETURN json_build_object('exists', true, 'message', 'Email exists in database');
  END IF;
  RETURN json_build_object('exists', false, 'message', 'Email not found in database');
END;
$$;

-- Grants so client (anon/authenticated) can call these RPCs safely
DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.generate_verification_token(uuid) TO anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.verify_email_token(text) TO anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid) TO authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.reject_user(uuid, uuid, text) TO authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.generate_agent_license() TO authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

-- Optional: sequence alignment with existing data
DO $$
DECLARE
  max_num int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(agent_license_number, '^H0', ''))::int), 99)
    INTO max_num
    FROM public.users
    WHERE agent_license_number ~ '^H0[0-9]+$';
  PERFORM setval('agent_license_seq', GREATEST(100, max_num));
END $$;
