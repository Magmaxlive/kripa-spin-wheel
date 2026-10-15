// Unit tests for the rate-limit helper library.
// Run with:  node --test tests/unit/rate-limit.test.js
//
// Tests cover only the pure-function surface:
//   * phone normalisation + validation
//   * x-forwarded-for extraction
//   * HMAC key stability + scope isolation
//   * env parsing (int bounds, secret length)
//
// Round-trip RPC behaviour is covered by the SQL smoke tests in
// sql/migrations/20261015_rate_limit.sql, not here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
    normalizePhone,
    extractIp,
    buildHashes,
} from '../../src/lib/rate-limit-core.js';
import { readInt, readSecret } from '../../src/lib/env.js';

// ---------------------------------------------------------------
// Phone normalisation
// ---------------------------------------------------------------
test('normalizePhone accepts common NZ-style formats', () => {
    assert.equal(normalizePhone('0211234567'), '0211234567');
    assert.equal(normalizePhone('021 123 4567'), '0211234567');
    assert.equal(normalizePhone('021-123-4567'), '0211234567');
    assert.equal(normalizePhone('(021) 123 4567'), '0211234567');
    assert.equal(normalizePhone('021.123.4567'), '0211234567');
});

test('normalizePhone preserves a leading + for international format', () => {
    assert.equal(normalizePhone('+64 21 123 4567'), '+64211234567');
    assert.equal(normalizePhone('+1-555-123-4567'), '+15551234567');
});

test('normalizePhone rejects obviously invalid input', () => {
    assert.equal(normalizePhone(''), null);
    assert.equal(normalizePhone('abc'), null);
    assert.equal(normalizePhone('123'), null);                    // too short
    assert.equal(normalizePhone('12345678901234567'), null);      // too long
    assert.equal(normalizePhone('++123456789'), null);            // double + is not valid
    assert.equal(normalizePhone('021 abc 4567'), null);
    assert.equal(normalizePhone(null), null);
    assert.equal(normalizePhone(undefined), null);
    assert.equal(normalizePhone(1234567890), null);               // not a string
});

test('normalizePhone treats "0211234567" and "+64211234567" as distinct buckets', () => {
    // Users must consistently include their country code to share a
    // bucket - matches the uniqueness check at the DB layer.
    assert.notEqual(
        normalizePhone('0211234567'),
        normalizePhone('+64211234567')
    );
});

// ---------------------------------------------------------------
// IP extraction
// ---------------------------------------------------------------
function fakeRequest(headers) {
    return {
        headers: {
            get: (name) => {
                const v = headers[name.toLowerCase()];
                return v === undefined ? null : v;
            },
        },
    };
}

test('extractIp uses the first entry of x-forwarded-for', () => {
    const req = fakeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' });
    assert.equal(extractIp(req), '203.0.113.5');
});

test('extractIp trims whitespace in x-forwarded-for', () => {
    const req = fakeRequest({ 'x-forwarded-for': '  203.0.113.5  , 10.0.0.1' });
    assert.equal(extractIp(req), '203.0.113.5');
});

test('extractIp falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = fakeRequest({ 'x-real-ip': '198.51.100.9' });
    assert.equal(extractIp(req), '198.51.100.9');
});

test('extractIp returns null when neither header is present', () => {
    const req = fakeRequest({});
    assert.equal(extractIp(req), null);
});

// ---------------------------------------------------------------
// HMAC key construction
// ---------------------------------------------------------------
const SECRET = 'a'.repeat(64);

test('buildHashes returns 64-char hex strings', () => {
    const { ipHash, phoneHash } = buildHashes('203.0.113.5', '+64211234567', SECRET);
    assert.match(ipHash, /^[0-9a-f]{64}$/);
    assert.match(phoneHash, /^[0-9a-f]{64}$/);
});

test('buildHashes is deterministic for the same inputs', () => {
    const a = buildHashes('203.0.113.5', '+64211234567', SECRET);
    const b = buildHashes('203.0.113.5', '+64211234567', SECRET);
    assert.equal(a.ipHash, b.ipHash);
    assert.equal(a.phoneHash, b.phoneHash);
});

test('buildHashes scopes ip and phone separately so values cannot cross-collide', () => {
    // Even if someone registered with their IP as their phone number
    // the hashes must differ.
    const SAME = '203.0.113.5';
    const { ipHash, phoneHash } = buildHashes(SAME, SAME, SECRET);
    assert.notEqual(ipHash, phoneHash);
});

test('buildHashes with a null IP uses the fallback bucket key', () => {
    const { ipHash: a } = buildHashes(null, '+64211234567', SECRET);
    const { ipHash: b } = buildHashes(undefined, '+64211234567', SECRET);
    const expected = createHmac('sha256', SECRET)
        .update('ip:no-proxy-header')
        .digest('hex');
    assert.equal(a, expected);
    assert.equal(b, expected);
});

test('buildHashes diverges when the secret changes', () => {
    const a = buildHashes('203.0.113.5', '+64211234567', 'a'.repeat(64));
    const b = buildHashes('203.0.113.5', '+64211234567', 'b'.repeat(64));
    assert.notEqual(a.ipHash, b.ipHash);
    assert.notEqual(a.phoneHash, b.phoneHash);
});

// ---------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------
function withEnv(key, value, fn) {
    const original = Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : undefined;
    const had = original !== undefined;
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    try {
        return fn();
    } finally {
        if (had) process.env[key] = original;
        else delete process.env[key];
    }
}

test('readInt returns the fallback when env is unset or empty', () => {
    withEnv('__RL_TEST', undefined, () => {
        assert.equal(readInt('__RL_TEST', 7), 7);
    });
    withEnv('__RL_TEST', '', () => {
        assert.equal(readInt('__RL_TEST', 7), 7);
    });
});

test('readInt parses a valid integer', () => {
    withEnv('__RL_TEST', '42', () => {
        assert.equal(readInt('__RL_TEST', 7), 42);
    });
});

test('readInt rejects non-integer, out-of-range, or non-numeric values', () => {
    for (const bad of ['abc', '1.5', '-1', '0']) {
        withEnv('__RL_TEST', bad, () => {
            assert.throws(() => readInt('__RL_TEST', 7, { min: 1 }), /must be an integer/);
        });
    }
});

test('readInt enforces the max bound', () => {
    withEnv('__RL_TEST', '2000', () => {
        assert.throws(() => readInt('__RL_TEST', 7, { max: 1000 }));
    });
});

test('readSecret rejects missing or too-short values', () => {
    withEnv('__RL_SECRET', undefined, () => {
        assert.throws(() => readSecret('__RL_SECRET'));
    });
    withEnv('__RL_SECRET', 'short', () => {
        assert.throws(() => readSecret('__RL_SECRET'));
    });
});

test('readSecret returns a long-enough value verbatim', () => {
    const good = 'x'.repeat(32);
    withEnv('__RL_SECRET', good, () => {
        assert.equal(readSecret('__RL_SECRET'), good);
    });
});
