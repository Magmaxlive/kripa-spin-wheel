// Rate-limit entrypoint for /api/register.
//
// Trust model (document before deploying):
//   * On Vercel, `x-forwarded-for` is set by Vercel's edge network and
//     trustworthy. On any other platform using a reverse proxy, the
//     proxy MUST be configured to override whatever the client sent,
//     otherwise an attacker can spoof the IP header to bypass limits.
//   * If no proxy header is present we fall back to a shared bucket.
//
// Storage: only HMAC-SHA256-hex(scope || ':' || value, secret) is sent
// to the database. Raw IPs, phone numbers, names, emails, tokens, and
// user agents never leave the Node process.

import { supabaseServer } from "@/lib/supabase/server";
import { readInt, readSecret } from "@/lib/env";
import { buildHashes } from "@/lib/rate-limit-core";

export { normalizePhone, extractIp, buildHashes } from "@/lib/rate-limit-core";

const DEFAULT_IP_LIMIT = 3;
const DEFAULT_IP_WINDOW_SECONDS = 60 * 60;
const DEFAULT_PHONE_LIMIT = 5;
const DEFAULT_PHONE_WINDOW_SECONDS = 24 * 60 * 60;

function readConfig() {
    return {
        ipLimit: readInt("RATE_LIMIT_IP_LIMIT", DEFAULT_IP_LIMIT, {
            min: 1,
            max: 1000,
        }),
        ipWindow: readInt("RATE_LIMIT_IP_WINDOW_SECONDS", DEFAULT_IP_WINDOW_SECONDS, {
            min: 1,
            max: 86400,
        }),
        phoneLimit: readInt("RATE_LIMIT_PHONE_LIMIT", DEFAULT_PHONE_LIMIT, {
            min: 1,
            max: 1000,
        }),
        phoneWindow: readInt("RATE_LIMIT_PHONE_WINDOW_SECONDS", DEFAULT_PHONE_WINDOW_SECONDS, {
            min: 1,
            max: 86400,
        }),
    };
}

// Returns one of:
//   { ok: true }
//   { ok: false, status: 429, retryAfter: int, reason: 'ip' | 'phone' }
//   { ok: false, status: 503, retryAfter: 60, reason: 'rpc_error' | 'config_error' | 'rpc_malformed' }
export async function checkRegistrationRate({ ip, phone }) {
    let secret;
    let cfg;
    try {
        secret = readSecret("RATE_LIMIT_SECRET", { minLength: 32 });
        cfg = readConfig();
    } catch (err) {
        console.error("Rate limit configuration error:", err.message);
        return {
            ok: false,
            status: 503,
            retryAfter: 60,
            reason: "config_error",
        };
    }

    const { ipHash, phoneHash } = buildHashes(ip, phone, secret);

    const { data, error } = await supabaseServer.rpc(
    "registration_rate_limit_check",
    {
        p_ip_hash: ipHash,
        p_phone_hash: phoneHash,
        p_ip_limit: cfg.ipLimit,
        p_ip_window_seconds: cfg.ipWindow,
        p_phone_limit: cfg.phoneLimit,
        p_phone_window_seconds: cfg.phoneWindow,
    }
);

    if (error) {
        console.error("Rate limit RPC error:", {
            code: error.code,
            message: error.message,
        });
        return {
            ok: false,
            status: 503,
            retryAfter: 60,
            reason: "rpc_error",
        };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== "boolean") {
        console.error("Rate limit RPC returned unexpected shape");
        return {
            ok: false,
            status: 503,
            retryAfter: 60,
            reason: "rpc_malformed",
        };
    }

    if (!row.allowed) {
        return {
            ok: false,
            status: 429,
            retryAfter: Math.max(1, Number(row.retry_after) || 60),
            reason: row.reason || "limit",
        };
    }

    return { ok: true };
}
