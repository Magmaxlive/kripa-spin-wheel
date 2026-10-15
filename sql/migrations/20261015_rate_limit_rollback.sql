-- =====================================================================
-- Rollback for 20261015_rate_limit.sql
-- =====================================================================
-- Drops the two functions, the table, and the schema in reverse order.
-- Safe to run multiple times (uses IF EXISTS).
-- =====================================================================

drop function if exists ratelimit.cleanup_expired();
drop function if exists ratelimit.registration_check(text, text, int, int, int, int);
drop table if exists ratelimit.registration_events;
drop schema if exists ratelimit cascade;
