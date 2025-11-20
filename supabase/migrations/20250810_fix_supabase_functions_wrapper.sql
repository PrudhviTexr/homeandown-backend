-- Create schema supabase_functions if missing, and proxy http_request using pg_net
create schema if not exists supabase_functions;

-- Ensure pg_net is available (in Supabase, available via 'extensions')
create extension if not exists pg_net with schema extensions;

-- Create a function compatible with legacy triggers that call supabase_functions.http_request
create or replace function supabase_functions.http_request(
    url text,
    method text default 'POST',
    headers jsonb default '{}'::jsonb,
    body text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    res jsonb;
begin
    -- Use pg_net to perform the HTTP request. Convert the record result to jsonb.
    if upper(coalesce(method, 'POST')) = 'POST' then
        select to_jsonb(r) into res
        from extensions.net.http_post(
            url := url,
            headers := headers,
            body := body
        ) as r;
    else
        select to_jsonb(r) into res
        from extensions.net.http_get(
            url := url,
            headers := headers
        ) as r;
    end if;

    return coalesce(res, jsonb_build_object());
end;
$$;

comment on function supabase_functions.http_request(text, text, jsonb, text) is 'Compatibility wrapper for legacy triggers; uses extensions.pg_net';
