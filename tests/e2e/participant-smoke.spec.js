// Participant smoke test. Only verifies the registration -> spin page
// handoff. Does NOT press "Spin" - that would consume real gift stock
// and send a real Resend email. Those paths must be verified manually
// with isolated test data.

import { test, expect } from "@playwright/test";

const PHONE_PREFIX = process.env.E2E_TEST_PHONE_PREFIX;

test.describe("Participant smoke", () => {
    test.skip(!PHONE_PREFIX, "E2E_TEST_PHONE_PREFIX not set");

    test("register redirects to /spin and shows the welcome banner", async ({ page }) => {
        const uniquePhone = `${PHONE_PREFIX}${Date.now().toString().slice(-6)}`;

        await page.goto("/register");

        await page.getByLabel(/full name/i).fill("E2E Smoke Test");
        await page.getByLabel(/^email$/i).fill(`${Date.now()}@example.test`);
        await page.getByLabel(/^phone$/i).fill(uniquePhone);
        await page.getByLabel(/terms & conditions/i).check();

        await page.getByRole("button", { name: /continue to spin/i }).click();

        await page.waitForURL("**/spin");
        await expect(page.getByText(/welcome/i)).toBeVisible();
        // Explicitly do NOT click Spin. Stop here.
    });

    test("direct visit to /spin without a cookie bounces to /register", async ({ page, context }) => {
        await context.clearCookies();
        await page.goto("/spin");
        await expect(page).toHaveURL(/\/register$/);
    });
});
