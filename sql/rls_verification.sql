-- =====================================================================
-- Spin & Win — RLS verification script (STAGING ONLY)
-- =====================================================================
--
-- !! DO NOT RUN THIS AGAINST PRODUCTION. !!
--
-- Before running anything in this file, confirm you are on staging:
--
--   SELECT current_database(), current_user, inet_server_addr();
--
-- Compare the output against the staging Supabase project URL. Abort
-- immediately if it does not match staging.
--
-- Structure:
--   Part A - Catalog read-only probes.
--     Pure SELECTs against pg_catalog / information_schema. No writes,
--     no role changes. Safe to run at any time.
--
--   Part B - Role-impersonation probes (optional).
--     Uses `BEGIN; SET LOCAL ROLE <role>; ...; ROLLBACK;` blocks so
--     the role change actually takes effect and any write that happens
--     to succeed is undone by the outer ROLLBACK.
--
--   Appendix - API-level anon-key probes (curl).
--     The authoritative check. Run from a developer machine.
--
-- LIMITATIONS - read before trusting any result:
--
--   1. These probes approximate how PostgREST + the anon key would
--      behave, but they are NOT equivalent to it. PostgREST adds its
--      own JWT handling, header processing, and policy evaluation. A
--      green run of Parts A and B is necessary but not sufficient -
--      the Appendix curl probes are the authoritative check.
--
--   2. In the Supabase SQL Editor every statement is autocommit by
--      default. `SET LOCAL ROLE anon;` outside an explicit transaction
--      applies only to that statement, and the next statement runs
--      with the editor's role (usually `postgres`). The editor role
--      is a superuser and the table owner, so it bypasses RLS and
--      returns results that look safe when they are not. Every Part B
--      probe is therefore wrapped in BEGIN...ROLLBACK and must be run
--      as a single selection in the editor.
--
--   3. `postgres` and `service_role` bypass RLS. Any result returned
--      while running as either role is uninformative - re-run under
--      the explicit anon / authenticated SET ROLE blocks below.
--
--   4. Seed at least one representative row in each of participants,
--      spins, gifts, and admins before Part B. An empty table makes
--      every count-based probe return 0, which cannot be distinguished
--      from a correctly denied read.
--
--   5. A table being free of policies is only safe if the role also
--      has no table GRANT. Read A2 and A3 together, never alone.
-- =====================================================================


-- =====================================================================
-- PART A - CATALOG READ-ONLY PROBES
-- =====================================================================
-- Safe to run as one selection. No role changes, no writes.

-- A0. Confirm target.
SELECT
    current_database()                        AS db,
    current_user                              AS session_role,
    current_setting('server_version')         AS pg_version,
    now()                                     AS checked_at;


-- A1. RLS flags on each target table.
SELECT
    n.nspname                                 AS schema,
    c.relname                                 AS table,
    c.relrowsecurity                          AS rls_enabled,
    c.relforcerowsecurity                     AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('participants','spins','gifts','admins')
  AND n.nspname = 'public'
ORDER BY c.relname;
-- EXPECT: rls_enabled = true for all four.
-- NOTE : rls_forced = false means the table OWNER (usually postgres)
--        bypasses RLS. Service-role bypass is required by the app and
--        is normal; owner bypass means "postgres can still read even
--        if policies deny it" and should be kept in mind when
--        interpreting Part B results.


-- A2. Every policy on the target tables.
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd                                       AS command,
    qual                                      AS using_expr,
    with_check                                AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('participants','spins','gifts','admins')
ORDER BY tablename, cmd, policyname;
-- EXPECT:
--   participants : no policies granting anon/authenticated anything.
--   spins        : same.
--   admins       : at most SELECT where `user_id = auth.uid()`.
--   gifts        : optional SELECT for anon/authenticated restricted
--                  to is_active = true; must not expose weight.
-- IMPORTANT: absence of a policy is NOT the same as denial. Combine
-- this output with A3 (grants) to decide whether a role can act.


-- A3. Role grants on each target table.
SELECT
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('participants','spins','gifts','admins')
  AND grantee IN ('anon','authenticated','public','PUBLIC')
ORDER BY table_name, grantee, privilege_type;
-- EXPECT: anon and authenticated should have NO grants on participants,
-- spins, or admins. A SELECT grant on gifts is acceptable only if A2
-- shows a policy that filters is_active and omits weight.


-- A4. participants columns. Flag anything that must never reach anon.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'participants'
ORDER BY ordinal_position;
-- Any column named access_token / token / secret / password MUST NOT
-- be reachable via the anon key. Confirm with B1b below.


-- A5. perform_spin ownership + SECURITY DEFINER configuration.
SELECT
    n.nspname                                 AS schema,
    p.proname                                 AS function_name,
    r.rolname                                 AS owner,
    p.prosecdef                               AS is_security_definer,
    p.proconfig                               AS function_config,
    pg_get_function_arguments(p.oid)          AS arguments,
    pg_get_function_result(p.oid)             AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r     ON r.oid = p.proowner
WHERE p.proname = 'perform_spin'
  AND n.nspname = 'public';
-- EXPECT:
--   is_security_definer = true  (lets perform_spin bypass RLS on spins
--                                and update gifts.stock).
--   function_config CONTAINS "search_path=..." pinning a safe value
--     (e.g. public, pg_temp). A SECURITY DEFINER function owned by a
--     superuser with no pinned search_path is a classic privilege-
--     escalation vector.
-- If is_security_definer = false, ordinary roles would need direct
-- INSERT/UPDATE policies on spins and gifts for the app to work - which
-- is itself a critical finding.


-- A6. Who can EXECUTE perform_spin.
-- `information_schema.role_routine_grants` does NOT include the
-- implicit EXECUTE-to-PUBLIC grant PostgreSQL adds to functions by
-- default. Use `pg_proc.proacl` and `has_function_privilege()`.
SELECT
    p.proname                                 AS function_name,
    pg_catalog.array_to_string(p.proacl, E'\n') AS acl,
    has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_execute,
    has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'perform_spin';
-- EXPECT:
--   anon_can_execute      = false
--   auth_can_execute      = false
--   service_can_execute   = true
-- If anon_can_execute = true, any client holding the anon key can call
-- perform_spin with any participant_id and award themselves a prize,
-- bypassing the access_token check in /api/spin. Remedy:
--   REVOKE EXECUTE ON FUNCTION public.perform_spin(uuid) FROM PUBLIC;
-- (then revoke from anon/authenticated if explicitly granted).


-- A7. Every public table whose relacl mentions any role.
-- Last sanity sweep in case a table outside the four audited has
-- drifted open.
SELECT
    n.nspname                                 AS schema,
    c.relname                                 AS table,
    pg_catalog.array_to_string(c.relacl, E'\n') AS grants
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;


-- =====================================================================
-- PART B - ROLE-IMPERSONATION PROBES (OPTIONAL)
-- =====================================================================
-- Each block below MUST be run as ONE selection in the Supabase SQL
-- Editor. Select the full BEGIN...ROLLBACK block, then click Run. The
-- outer ROLLBACK undoes every write regardless of whether it succeeded
-- or raised.
--
-- If you forget to wrap the SET LOCAL ROLE in a transaction, every
-- probe silently runs as the editor role (superuser) and reports
-- misleadingly safe results. See LIMITATIONS #2 above.


-- B1. anon SELECT probes.
BEGIN;
SET LOCAL ROLE anon;

-- B1a - anon reading participants.
SELECT count(*) AS anon_participants_visible FROM public.participants;
-- EXPECT: permission denied, OR 0 rows after RLS filtering.
-- NOTE  : "0" is only informative if the staging table has >=1 row.

-- B1b - anon reading participants.access_token (critical).
SELECT count(*) AS anon_tokens_visible
FROM public.participants
WHERE access_token IS NOT NULL;
-- EXPECT: permission denied, OR 0. Any non-zero value is CRITICAL -
-- the access_token is a spin-takeover primitive.

-- B1c - anon reading admins.
SELECT count(*) AS anon_admins_visible FROM public.admins;
-- EXPECT: permission denied, OR 0.

-- B1d - anon reading spins.
SELECT count(*) AS anon_spins_visible FROM public.spins;
-- EXPECT: permission denied, OR 0.

-- B1e - anon reading gifts (public read may be allowed, with limits).
SELECT count(*) AS anon_gifts_visible FROM public.gifts;
SELECT count(*) AS anon_weight_rows_visible
FROM public.gifts
WHERE weight IS NOT NULL;
-- EXPECT: anon_gifts_visible = number of active, in-stock gifts.
--         anon_weight_rows_visible = 0. If weight is reachable,
--         win odds leak and this is a MEDIUM finding.

ROLLBACK;


-- B2. anon WRITE probes.
-- Each write sits inside a PL/pgSQL BEGIN...EXCEPTION savepoint. If
-- the write unexpectedly succeeds, the row IS inserted inside this
-- transaction but is reverted by the outer ROLLBACK, so nothing
-- persists.
BEGIN;
SET LOCAL ROLE anon;

-- B2a - anon forging a spin.
DO $$
BEGIN
    BEGIN
        INSERT INTO public.spins (participant_id, gift_id)
        SELECT p.id, g.id
        FROM public.participants p, public.gifts g
        LIMIT 1;
        RAISE NOTICE 'CRITICAL: anon INSERT on spins succeeded';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'OK: anon INSERT on spins denied (%).', sqlerrm;
    END;
END$$;

-- B2b - anon manipulating gift stock.
DO $$
BEGIN
    BEGIN
        UPDATE public.gifts SET stock = 999999 WHERE true;
        RAISE NOTICE 'CRITICAL: anon UPDATE on gifts succeeded';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'OK: anon UPDATE on gifts denied (%).', sqlerrm;
    END;
END$$;

-- B2c - anon self-granting admin.
DO $$
BEGIN
    BEGIN
        INSERT INTO public.admins (user_id) VALUES (gen_random_uuid());
        RAISE NOTICE 'CRITICAL: anon INSERT on admins succeeded';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'OK: anon INSERT on admins denied (%).', sqlerrm;
    END;
END$$;

ROLLBACK;


-- B3. authenticated SELECT probes.
-- SET ROLE authenticated does NOT set a JWT claim, so auth.uid()
-- returns NULL. Policies of the form `using (user_id = auth.uid())`
-- therefore filter all rows. That's the correct behaviour for a
-- "logged-in Supabase user with no admin row" probe.
BEGIN;
SET LOCAL ROLE authenticated;

SELECT count(*) AS auth_participants_visible FROM public.participants;
SELECT count(*) AS auth_admins_total          FROM public.admins;
-- EXPECT both = 0 (or permission denied). A non-zero value means a
-- logged-in Supabase user with no admin row can enumerate the table.

ROLLBACK;


-- B4. authenticated WRITE probes.
BEGIN;
SET LOCAL ROLE authenticated;

-- B4a - authenticated self-granting admin.
DO $$
BEGIN
    BEGIN
        INSERT INTO public.admins (user_id)
        VALUES (COALESCE(auth.uid(), gen_random_uuid()));
        RAISE NOTICE 'CRITICAL: authenticated INSERT on admins succeeded';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'OK: authenticated INSERT on admins denied (%).', sqlerrm;
    END;
END$$;

ROLLBACK;


-- B5. authenticated calling perform_spin directly.
--
-- Preparation (run as the editor role FIRST, outside this block,
-- then paste the result into v_pid below):
--
--     SELECT id FROM public.participants LIMIT 1;
--
-- Reason: if RLS on participants is correct, `authenticated` cannot
-- SELECT the table at all, so looking up the UUID inside this block
-- would return NULL and the probe would silently no-op.
--
-- If A6 already shows anon_can_execute = false AND auth_can_execute =
-- false, you can skip this block - perform_spin is unreachable from
-- the anon key.
BEGIN;
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    v_pid uuid := '00000000-0000-0000-0000-000000000000'::uuid; -- REPLACE
BEGIN
    BEGIN
        PERFORM public.perform_spin(v_pid);
        RAISE NOTICE 'CRITICAL: authenticated EXECUTE on perform_spin succeeded';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'OK: authenticated EXECUTE on perform_spin denied (%).', sqlerrm;
    END;
END$$;

ROLLBACK;


-- =====================================================================
-- APPENDIX - API-LEVEL ANON-KEY PROBES (NOT runnable in SQL Editor)
-- =====================================================================
--
-- These are the AUTHORITATIVE check. The SQL-Editor probes above
-- approximate what the anon role can do at the DB layer, but they
-- don't exercise PostgREST, JWT handling, or Supabase's auth helpers.
-- Only matching results across both layers prove end-to-end safety.
--
-- Replace $SUPABASE_URL with the staging REST URL (NOT production)
-- and $ANON_KEY with the staging anon publishable key. Run from a
-- developer workstation.
--
--   # 1. anon must NOT read participants. Any row containing an
--   #    access_token is a CRITICAL leak.
--   curl -s -H "apikey: $ANON_KEY" \
--     "$SUPABASE_URL/rest/v1/participants?select=*&limit=1"
--
--   # 2. anon must NOT insert spins.
--   curl -s -X POST \
--     -H "apikey: $ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"participant_id":"00000000-0000-0000-0000-000000000000"}' \
--     "$SUPABASE_URL/rest/v1/spins"
--
--   # 3. anon must NOT read admins.
--   curl -s -H "apikey: $ANON_KEY" \
--     "$SUPABASE_URL/rest/v1/admins?select=*&limit=1"
--
--   # 4. anon must NOT update gift stock.
--   curl -s -X PATCH \
--     -H "apikey: $ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"stock":9999}' \
--     "$SUPABASE_URL/rest/v1/gifts?id=eq.00000000-0000-0000-0000-000000000000"
--
--   # 5. anon must NOT call perform_spin.
--   curl -s -X POST \
--     -H "apikey: $ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"p_participant_id":"00000000-0000-0000-0000-000000000000"}' \
--     "$SUPABASE_URL/rest/v1/rpc/perform_spin"
--
-- EXPECT: HTTP 401/403, or a PostgREST JSON payload with error code
--         "42501" (insufficient privilege) / "PGRST116" (RLS). Any 2xx
--         response is a CRITICAL finding and must be fixed before any
--         production deploy.
--
-- =====================================================================
-- End of verification script.
--
-- Do NOT consider RLS "verified" until:
--   (1) Part A has been run and every EXPECT comment matches.
--   (2) Part B has been run with seeded staging data and every probe
--       returned the OK path.
--   (3) The curl probes in the Appendix all returned 401/403/42501.
-- Record the output of each section in the audit log.
-- =====================================================================
