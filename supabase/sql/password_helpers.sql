-- Helper SQL for password hashing and verification in Postgres
-- Assumes you have extensions or functions to hash/verify (e.g., pgcrypto or custom functions)

-- Example using pgcrypto for hashing
-- Enable extension (run once as superuser):
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Hash password
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT crypt(password, gen_salt('bf'));
$$;

-- 2) Verify password
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT crypt(password, hash) = hash;
$$;

-- 3) Optional: Update a user's password_hash in users table (custom use; not for Supabase Auth)
-- WARNING: For Supabase authentication, use supabase.auth.updateUser instead of storing custom hashes.
CREATE OR REPLACE FUNCTION public.set_user_password_hash(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
     SET password_hash = public.hash_password(p_password),
         updated_at = NOW()
   WHERE id = p_user_id;
END;
$$;
