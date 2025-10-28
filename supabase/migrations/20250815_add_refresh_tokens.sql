-- Migration: add refresh_tokens table for session refresh support
create table if not exists refresh_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  token_hash text not null,
  user_agent text,
  ip_address text,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  revoked boolean default false
);
create index if not exists refresh_tokens_user_idx on refresh_tokens(user_id);
