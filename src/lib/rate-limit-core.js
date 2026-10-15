// Pure helpers for rate limiting. Keep this file free of imports from
// `@/lib/supabase/*` so unit tests can exercise it without env vars.

import { createHmac } from "node:crypto";

export function normalizePhone(raw) {
    if (typeof raw !== "string") return null;
    const compact = raw.replace(/[\s().\-]/g, "");
    if (!/^\+?\d{7,15}$/.test(compact)) return null;
    return compact;
}

export function extractIp(request) {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    const xReal = request.headers.get("x-real-ip");
    if (xReal) return xReal.trim();
    return null;
}

function hmacHex(scope, value, secret) {
    return createHmac("sha256", secret)
        .update(`${scope}:${value}`)
        .digest("hex");
}

export function buildHashes(ip, phone, secret) {
    const ipKey = ip ?? "no-proxy-header";
    return {
        ipHash: hmacHex("ip", ipKey, secret),
        phoneHash: hmacHex("phone", phone, secret),
    };
}
