// Env-var helpers. Server-side only - never import from client code.

export function readInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) {
        throw new Error(
            `Env var ${name} must be an integer between ${min} and ${max}`
        );
    }
    return n;
}

export function readSecret(name, { minLength = 32 } = {}) {
    const raw = process.env[name];
    if (!raw || raw.length < minLength) {
        throw new Error(
            `Env var ${name} is missing or shorter than ${minLength} characters`
        );
    }
    return raw;
}
