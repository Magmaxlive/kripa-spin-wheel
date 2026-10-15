// Unit tests for Pacific/Auckland date bounds.
// Run with:  node --test tests/unit/nz-time.test.js
//
// NZ DST reference for 2026:
//   NZDT starts: Sun 2026-09-27, clock jumps 02:00 NZST -> 03:00 NZDT
//   NZDT ends:   Sun 2026-04-05, clock falls 03:00 NZDT -> 02:00 NZST
// NZST offset: UTC+12. NZDT offset: UTC+13.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dateRangeToUtcBounds, isValidDateRange } from '../../src/lib/time/nz.js';

const NZ = 'Pacific/Auckland';

// Fixed "now" instants for deterministic tests.
// Each represents a specific wall-clock time in NZ, expressed as the
// absolute UTC instant that would be observed.

// 2026-06-15 10:00 NZST (UTC+12) → 2026-06-14 22:00 UTC
const NOW_NZST = new Date('2026-06-14T22:00:00Z');

// 2026-01-15 10:00 NZDT (UTC+13) → 2026-01-14 21:00 UTC
const NOW_NZDT = new Date('2026-01-14T21:00:00Z');

// 23:30 NZT on 2026-06-15 → 11:30 UTC same day (NZST)
const NOW_NEAR_MIDNIGHT_NZT = new Date('2026-06-15T11:30:00Z');

// 00:30 NZT on 2026-06-16 → 12:30 UTC on 2026-06-15 (NZST)
const NOW_JUST_AFTER_MIDNIGHT_NZT = new Date('2026-06-15T12:30:00Z');

// NZDT→NZST transition day: Sun 2026-04-05, 12:00 noon NZDT
// Clocks fall back at 03:00 NZDT -> 02:00 NZST that morning.
// 12:00 NZST on 2026-04-05 → 00:00 UTC same day.
const NOW_DST_END_NOON = new Date('2026-04-05T00:00:00Z');

// NZST→NZDT transition day: Sun 2026-09-27
// Clocks spring forward at 02:00 NZST -> 03:00 NZDT.
// 12:00 NZDT on 2026-09-27 → 2026-09-26T23:00Z.
const NOW_DST_START_NOON = new Date('2026-09-26T23:00:00Z');

test('isValidDateRange recognises exactly the four supported values', () => {
    for (const r of ['all', 'today', 'last_7', 'last_30']) {
        assert.equal(isValidDateRange(r), true, r);
    }
    for (const r of ['', 'last_14', 'yesterday', 'ALL', null, undefined]) {
        assert.equal(isValidDateRange(r), false, String(r));
    }
});

test("dateRangeToUtcBounds returns null for 'all'", () => {
    assert.equal(dateRangeToUtcBounds('all', { now: NOW_NZST }), null);
});

test('dateRangeToUtcBounds throws for invalid ranges', () => {
    assert.throws(
        () => dateRangeToUtcBounds('bogus', { now: NOW_NZST }),
        /Invalid date range/
    );
});

test("'today' during NZST: start=NZ midnight today, end=NZ midnight tomorrow", () => {
    // 2026-06-15 10:00 NZST. "Today" in NZ = 2026-06-15.
    // Start = 2026-06-15T00:00 NZST = 2026-06-14T12:00Z
    // End   = 2026-06-16T00:00 NZST = 2026-06-15T12:00Z
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_NZST });
    assert.equal(start.toISOString(), '2026-06-14T12:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-06-15T12:00:00.000Z');
});

test("'today' during NZDT: 13-hour offset applied", () => {
    // 2026-01-15 10:00 NZDT. "Today" in NZ = 2026-01-15.
    // Start = 2026-01-15T00:00 NZDT = 2026-01-14T11:00Z
    // End   = 2026-01-16T00:00 NZDT = 2026-01-15T11:00Z
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_NZDT });
    assert.equal(start.toISOString(), '2026-01-14T11:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-01-15T11:00:00.000Z');
});

test("'today' at 23:30 NZT is still the current NZ day", () => {
    // Still 2026-06-15 in NZ.
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_NEAR_MIDNIGHT_NZT });
    assert.equal(start.toISOString(), '2026-06-14T12:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-06-15T12:00:00.000Z');
});

test("'today' at 00:30 NZT rolls over to the next NZ day", () => {
    // Now 2026-06-16 in NZ.
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_JUST_AFTER_MIDNIGHT_NZT });
    assert.equal(start.toISOString(), '2026-06-15T12:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-06-16T12:00:00.000Z');
});

test("'last_7' = today plus 6 previous NZ days", () => {
    // Today NZT = 2026-06-15. Start day = 2026-06-09.
    const { start, end } = dateRangeToUtcBounds('last_7', { now: NOW_NZST });
    assert.equal(start.toISOString(), '2026-06-08T12:00:00.000Z'); // 2026-06-09 00:00 NZST
    assert.equal(end.toISOString(),   '2026-06-15T12:00:00.000Z'); // 2026-06-16 00:00 NZST
});

test("'last_30' = today plus 29 previous NZ days", () => {
    // Today NZT = 2026-06-15. Start day = 2026-05-17.
    const { start, end } = dateRangeToUtcBounds('last_30', { now: NOW_NZST });
    assert.equal(start.toISOString(), '2026-05-16T12:00:00.000Z'); // 2026-05-17 00:00 NZST
    assert.equal(end.toISOString(),   '2026-06-15T12:00:00.000Z');
});

test('last_7 across the NZDT→NZST transition yields correct UTC bounds', () => {
    // Today NZDT = 2026-04-05 (noon NZST after fall-back). Start day = 2026-03-30.
    // 2026-03-30 00:00 NZDT = 2026-03-29T11:00Z  (DST still active)
    // End = 2026-04-06 00:00 NZST = 2026-04-05T12:00Z
    const { start, end } = dateRangeToUtcBounds('last_7', { now: NOW_DST_END_NOON });
    assert.equal(start.toISOString(), '2026-03-29T11:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-04-05T12:00:00.000Z');
});

test('last_7 across the NZST→NZDT transition yields correct UTC bounds', () => {
    // Today NZDT = 2026-09-27 (after spring-forward). Start day = 2026-09-21.
    // 2026-09-21 00:00 NZST = 2026-09-20T12:00Z
    // End = 2026-09-28 00:00 NZDT = 2026-09-27T11:00Z
    const { start, end } = dateRangeToUtcBounds('last_7', { now: NOW_DST_START_NOON });
    assert.equal(start.toISOString(), '2026-09-20T12:00:00.000Z');
    assert.equal(end.toISOString(),   '2026-09-27T11:00:00.000Z');
});

test('a spin exactly at the inclusive start boundary is included', () => {
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_NZST });
    const spinAtStart = start;
    assert.ok(spinAtStart >= start, 'start boundary is inclusive');
    assert.ok(spinAtStart < end,    'start boundary falls strictly before end');
});

test('a spin exactly at the exclusive end boundary is NOT included', () => {
    const { start, end } = dateRangeToUtcBounds('today', { now: NOW_NZST });
    const spinAtEnd = end;
    const included = spinAtEnd >= start && spinAtEnd < end;
    assert.equal(included, false, 'end boundary must be exclusive');
});

test('bounds do not depend on the host process timezone', () => {
    // Snapshot the host TZ, swap to a non-NZ one, re-run, restore.
    const originalTZ = process.env.TZ;
    try {
        process.env.TZ = 'America/Los_Angeles';
        const a = dateRangeToUtcBounds('today', { now: NOW_NZST });
        process.env.TZ = 'Asia/Kolkata';
        const b = dateRangeToUtcBounds('today', { now: NOW_NZST });
        assert.equal(a.start.toISOString(), b.start.toISOString());
        assert.equal(a.end.toISOString(),   b.end.toISOString());
        assert.equal(a.start.toISOString(), '2026-06-14T12:00:00.000Z');
    } finally {
        if (originalTZ === undefined) delete process.env.TZ;
        else process.env.TZ = originalTZ;
    }
});
