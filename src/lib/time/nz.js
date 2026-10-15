// Pacific/Auckland date utilities for the spin campaign.
//
// Design notes:
//  * All inputs/outputs at the database boundary are UTC ISO strings.
//    `created_at` in Postgres is `timestamptz` and arrives as an ISO
//    string with offset; comparing it against a UTC Date works
//    regardless of the server's local timezone.
//  * Calendar-day boundaries are computed in the campaign timezone
//    (Pacific/Auckland by default) via Intl.DateTimeFormat, which is
//    DST-aware and handled by the JavaScript runtime's zone database.
//  * "Today" means the current calendar day in NZ, start-inclusive
//    (00:00:00.000 local) through the start of tomorrow (exclusive).
//  * "Last 7 Days" means today plus the six previous calendar days.
//  * "Last 30 Days" means today plus the twenty-nine previous days.
//    Both ranges are start-inclusive, end-exclusive.
//  * All ambiguous DST wall-times (missing or duplicated hour) resolve
//    to the UTC instant that Intl formats back to the target wall-time;
//    for midnight boundaries this is unambiguous because NZ DST changes
//    happen at 02:00/03:00 local, never at midnight.

export const CAMPAIGN_TIMEZONE = 'Pacific/Auckland';

const VALID_RANGES = new Set(['all', 'today', 'last_7', 'last_30']);

// Parses the output of Intl.DateTimeFormat.formatToParts into a
// { year, month, day, hour, minute, second } record.
function partsToWallTime(parts) {
    const out = {};
    for (const p of parts) {
        if (p.type === 'literal') continue;
        out[p.type] = Number(p.value);
    }
    // Intl may format midnight as "24" in some locales; normalise.
    if (out.hour === 24) out.hour = 0;
    return out;
}

// Returns the current calendar date in `zone` as { year, month, day }.
function todayInZone(now, zone) {
    const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = partsToWallTime(dtf.formatToParts(now));
    return { year: parts.year, month: parts.month, day: parts.day };
}

// Returns the UTC Date that corresponds to midnight local time on the
// given calendar date in `zone`. Converges within a few iterations
// across DST transitions.
function zonedMidnightToUtc(year, month, day, zone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const targetUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

    const observedUtcMs = (ms) => {
        const w = partsToWallTime(dtf.formatToParts(new Date(ms)));
        return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
    };

    let utcMs = targetUtcMs;
    for (let i = 0; i < 4; i++) {
        const observed = observedUtcMs(utcMs);
        const diff = targetUtcMs - observed;
        if (diff === 0) break;
        utcMs += diff;
    }
    return new Date(utcMs);
}

// Adds `days` to a { year, month, day } tuple using UTC arithmetic so
// the host timezone cannot shift the result.
function addDays({ year, month, day }, days) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + days);
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
    };
}

export function isValidDateRange(range) {
    return VALID_RANGES.has(range);
}

// Returns { start, end } as UTC Date objects for the given admin date
// filter, computed against the campaign timezone. `start` is inclusive,
// `end` is exclusive. Returns null for 'all'. Pass `now` for testing.
export function dateRangeToUtcBounds(range, { zone = CAMPAIGN_TIMEZONE, now = new Date() } = {}) {
    if (!isValidDateRange(range)) {
        throw new Error(`Invalid date range: ${range}`);
    }
    if (range === 'all') return null;

    const today = todayInZone(now, zone);

    let startDaysBack;
    if (range === 'today') startDaysBack = 0;
    else if (range === 'last_7') startDaysBack = 6;
    else if (range === 'last_30') startDaysBack = 29;
    else return null;

    const startDate = addDays(today, -startDaysBack);
    const endDate = addDays(today, 1);

    const start = zonedMidnightToUtc(startDate.year, startDate.month, startDate.day, zone);
    const end = zonedMidnightToUtc(endDate.year, endDate.month, endDate.day, zone);

    return { start, end };
}
