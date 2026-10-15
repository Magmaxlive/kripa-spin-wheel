// Playwright configuration for Spin & Win E2E smoke tests.
//
// Tests target a running Next.js instance. Set these environment
// variables (see .env.test.example) before running:
//
//   E2E_BASE_URL              e.g. http://localhost:3000 or
//                             https://<staging>.vercel.app
//   E2E_ADMIN_EMAIL           staging admin login
//   E2E_ADMIN_PASSWORD        staging admin password
//   E2E_TEST_PHONE_PREFIX     prefix for throwaway participants
//
// Run with:  npm run test:e2e
//
// To spin up the dev server automatically pass:
//   E2E_START_DEV=1 npm run test:e2e
// (We intentionally do NOT start the dev server by default so a tester
// can point the suite at an already-running staging deployment.)

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

const config = {
    testDir: "./tests/e2e",
    timeout: 30_000,
    expect: { timeout: 10_000 },
    retries: process.env.CI ? 2 : 0,
    workers: 1, // avoid race on the single test admin account
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
};

if (process.env.E2E_START_DEV === "1") {
    config.webServer = {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    };
}

export default defineConfig(config);
