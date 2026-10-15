// Admin smoke test. Requires staging credentials:
//   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
//
// If either is unset the whole suite is SKIPPED - we never want to
// claim passed when the preconditions were missing.

import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Admin smoke", () => {
    test.skip(
        !ADMIN_EMAIL || !ADMIN_PASSWORD,
        "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set"
    );

    async function login(page) {
        await page.goto("/admin/login");
        await page.getByLabel(/^email$/i).fill(ADMIN_EMAIL);
        await page.getByLabel(/^password$/i).fill(ADMIN_PASSWORD);
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForURL("**/admin");
    }

    test("logged out visitor is redirected from /admin to /admin/login", async ({ page }) => {
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/login$/);
    });

    test("logged out visitor is redirected from /admin/gifts to /admin/login", async ({ page }) => {
        await page.goto("/admin/gifts");
        await expect(page).toHaveURL(/\/admin\/login$/);
    });

    test("invalid credentials show an error and stay on /admin/login", async ({ page }) => {
        await page.goto("/admin/login");
        await page.getByLabel(/^email$/i).fill("not-a-real-admin@example.com");
        await page.getByLabel(/^password$/i).fill("definitely-wrong-password");
        await page.getByRole("button", { name: /sign in/i }).click();
        await expect(page.getByText(/invalid email or password/i)).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/login$/);
    });

    test("valid admin can sign in and see the dashboard", async ({ page }) => {
        await login(page);
        await expect(page).toHaveURL(/\/admin$/);
        await expect(
            page.getByRole("heading", { name: /dashboard overview/i })
        ).toBeVisible();
    });

    test("admin can open Gifts, Participants, Spin Results and see CSV export control", async ({ page }) => {
        await login(page);

        // Gifts
        await page.getByRole("link", { name: /^Gifts$/ }).click();
        await expect(page).toHaveURL(/\/admin\/gifts$/);
        await expect(
            page.getByRole("heading", { level: 2, name: /gift catalogue/i })
        ).toBeVisible();

        // Participants
        await page.getByRole("link", { name: /^Participants$/ }).click();
        await expect(page).toHaveURL(/\/admin\/participants$/);
        await expect(
            page.getByRole("button", { name: /export csv/i })
        ).toBeVisible();

        // Spin Results
        await page.getByRole("link", { name: /^Spin Results$/ }).click();
        await expect(page).toHaveURL(/\/admin\/spins$/);
        await expect(
            page.getByRole("button", { name: /export csv/i })
        ).toBeVisible();
    });

    test("admin can create and delete a disposable test gift", async ({ page }) => {
        await login(page);
        await page.goto("/admin/gifts");

        const giftName = `e2e-smoke-${Date.now()}`;

        // Open create dialog
        await page.getByRole("button", { name: /add gift/i }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        await dialog.getByLabel(/^name$/i).fill(giftName);
        await dialog.getByLabel(/^stock$/i).fill("1");
        await dialog.getByLabel(/winning weight/i).fill("1");
        await dialog.getByRole("button", { name: /add gift/i }).click();

        // Row shows up
        await expect(page.getByText(giftName, { exact: true })).toBeVisible();

        // Delete via per-row control
        const row = page.locator("tr", { hasText: giftName });
        await row.getByRole("button", { name: /^delete$/i }).click();

        const confirm = page.getByRole("dialog");
        await expect(confirm).toBeVisible();
        await confirm.getByRole("button", { name: /^delete$/i }).click();

        // Row is gone
        await expect(page.getByText(giftName, { exact: true })).toHaveCount(0);
    });

    test("sign out clears the session and re-protects routes", async ({ page }) => {
        await login(page);
        await page.getByRole("button", { name: /sign out/i }).click();
        await page.waitForURL("**/admin/login");

        // Protected route should redirect again
        await page.goto("/admin/gifts");
        await expect(page).toHaveURL(/\/admin\/login$/);
    });
});
