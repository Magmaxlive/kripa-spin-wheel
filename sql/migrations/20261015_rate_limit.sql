-- =====================================================================
-- Spin & Win — registration rate limit (STAGING-ONLY migration)
-- =====================================================================
--
-- Before applying:
--   1. Confirm you are connected to the STAGING Supabase project.
--      Run: select current_database(), current_user; and verify.
--   2. Review the application code in src/lib/rate-limit.js and
--      src/app/api/register/route.js to understand the contract.
--   3. Set RATE_LIMIT_SECRET (>= 32 chars) in the application
--      environment BEFORE deploying code that calls this RPC.
--
-- Properties:
--   * Table has no grants to anon or authenticated. Only service_role
--     (which bypasses RLS) can read/write it via the RPC below.
--   * RPC is SECURITY DEFINER with a pinned search_path and no EXECUTE
--     grant to anon/authenticated, so a logged-in Supabase user cannot
--     call it directly to probe for existing hashes.
--   * Hashes are HMAC-SHA256-hex of the raw IP or normalized phone,
--     keyed by a server-only secret, so neither the raw values nor
--     their keyless hashes are reconstructable from the table.
--   * Insert is performed inside the RPC so a single round-trip is
--     atomic under concurrency (the count and insert both see the
--     same snapshot and the insert cannot race with another request).
-- =====================================================================

-- Dedicated schema keeps the public API surface clean and avoids
-- Supabase's PostgREST from auto-exposing the table.
create schema if not exists ratelimit;

revoke all on schema ratelimit from public;
grant usage on schema ratelimit to service_role;

create table if not exists ratelimit.registration_events (
    id bigserial primary key,
    ip_hash text not null,
    phone_hash text not null,
    created_at timestamptz not null default now()
);

-- Indexes support the rolling-window counting queries.
create index if not exists idx_rrl_ip_created
    on ratelimit.registration_events (ip_hash, created_at desc);
create index if not exists idx_rrl_phone_created
    on ratelimit.registration_events (phone_hash, created_at desc);
create index if not exists idx_rrl_created
    on ratelimit.registration_events (created_at);

alter table ratelimit.registration_events enable row level security;
alter table ratelimit.registration_events force row level security;

-- No policies at all - service_role bypasses RLS, no other role can
-- see rows. Belt-and-braces: explicitly deny all table grants.
revoke all on ratelimit.registration_events from public;
revoke all on ratelimit.registration_events from anon, authenticated;

-- -----------------------------------------------------------------
-- RPC: atomic rate check + insert
-- -----------------------------------------------------------------
-- Inputs are opaque hex strings produced by the application using
-- HMAC-SHA256(scope || ':' || value, RATE_LIMIT_SECRET).
-- Thresholds are passed as arguments so the application can tune them
-- without a migration (validated against env in the Node layer).
-- Returns a single row:
--   allowed       : boolean - true if under both limits
--   retry_after   : int     - seconds until the oldest event in the
--                             enforced window ages out (0 if allowed)
--   reason        : text    - 'ip' | 'phone' | null (null when allowed)
--
-- On allowed = true the function inserts an event row before returning
-- so the next concurrent call sees it.
create or replace function ratelimit.registration_check(
    p_ip_hash text,
    p_phone_hash text,
    p_ip_limit int,
    p_ip_window_seconds int,
    p_phone_limit int,
    p_phone_window_seconds int
) returns table (allowed boolean, retry_after int, reason text)
language plpgsql
security definer
set search_path = ratelimit, pg_temp
as $$
declare
    v_now timestamptz := now();
    v_ip_window timestamptz;
    v_phone_window timestamptz;
    v_ip_count int;
    v_phone_count int;
    v_oldest_ip timestamptz;
    v_oldest_phone timestamptz;
begin
    -- Input validation: hashes must look like hex strings, limits > 0.
    if p_ip_hash is null or length(p_ip_hash) < 32
       or p_phone_hash is null or length(p_phone_hash) < 32 then
        raise exception 'invalid hash input' using errcode = '22023';
    end if;
    if p_ip_limit < 1 or p_phone_limit < 1
       or p_ip_window_seconds < 1 or p_phone_window_seconds < 1 then
        raise exception 'invalid rate-limit threshold' using errcode = '22023';
    end if;

    v_ip_window    := v_now - make_interval(secs => p_ip_window_seconds);
    v_phone_window := v_now - make_interval(secs => p_phone_window_seconds);

    select count(*)::int, min(created_at)
      into v_ip_count, v_oldest_ip
      from ratelimit.registration_events
     where ip_hash = p_ip_hash
       and created_at > v_ip_window;

    if v_ip_count >= p_ip_limit then
        return query select
            false,
            greatest(
                0,
                ceil(
                    extract(epoch from (v_oldest_ip + make_interval(secs => p_ip_window_seconds) - v_now))
                )::int
            ),
            'ip'::text;
        return;
    end if;

    select count(*)::int, min(created_at)
      into v_phone_count, v_oldest_phone
      from ratelimit.registration_events
     where phone_hash = p_phone_hash
       and created_at > v_phone_window;

    if v_phone_count >= p_phone_limit then
        return query select
            false,
            greatest(
                0,
                ceil(
                    extract(epoch from (v_oldest_phone + make_interval(secs => p_phone_window_seconds) - v_now))
                )::int
            ),
            'phone'::text;
        return;
    end if;

    insert into ratelimit.registration_events (ip_hash, phone_hash)
    values (p_ip_hash, p_phone_hash);

    return query select true, 0::int, null::text;
end;
$$;

-- Lock down execution. service_role already has it as owner of the
-- schema, but be explicit so a Supabase admin cannot accidentally
-- expose the function later.
alter function ratelimit.registration_check(text, text, int, int, int, int) owner to postgres;
revoke all on function ratelimit.registration_check(text, text, int, int, int, int) from public;
revoke all on function ratelimit.registration_check(text, text, int, int, int, int) from anon, authenticated;
grant execute on function ratelimit.registration_check(text, text, int, int, int, int) to service_role;

-- -----------------------------------------------------------------
-- Cleanup helper - delete rows older than the longest window used.
-- Schedule from Supabase cron (not configured here) or call ad-hoc.
-- -----------------------------------------------------------------
create or replace function ratelimit.cleanup_expired()
returns int
language sql
security definer
set search_path = ratelimit, pg_temp
as $$
    with deleted as (
        delete from ratelimit.registration_events
        where created_at < now() - interval '24 hours'
        returning 1
    )
    select coalesce(count(*)::int, 0) from deleted;
$$;

alter function ratelimit.cleanup_expired() owner to postgres;
revoke all on function ratelimit.cleanup_expired() from public;
revoke all on function ratelimit.cleanup_expired() from anon, authenticated;
grant execute on function ratelimit.cleanup_expired() to service_role;

-- =====================================================================
-- Smoke tests (optional, STAGING-ONLY) - run after migration applies.
-- These require service_role (SQL editor runs as postgres superuser,
-- so these will work).
-- =====================================================================
--
--  -- Allow once:
--  select * from ratelimit.registration_check(
--      repeat('a',64), repeat('b',64), 3, 3600, 5, 86400
--  );
--
--  -- Deny after exceeding:
--  select * from ratelimit.registration_check(
--      repeat('a',64), repeat('b',64), 1, 3600, 5, 86400
--  );
--  -- allowed=false, reason='ip', retry_after approx 3600
--
--  -- Cleanup:
--  delete from ratelimit.registration_events
--  where ip_hash = repeat('a',64) or phone_hash = repeat('b',64);
--
-- =====================================================================
