import { expect, test } from "@playwright/test";

/**
 * Key-journey e2e (work order §13): landing → dashboard → profile setup (deterministic GPA) →
 * tracker. Runs against the BrowserRouter dev server. Mock-exam TTS/STT and live AI need a provider
 * key, so they're exercised manually; this covers the guest-first deterministic spine.
 */

test("landing renders and links into the app", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: /German Master/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Get started free/i }).first()).toBeVisible();
});

test("dashboard shows the profile setup empty state for a new guest", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Application dashboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Set up your profile/i })).toBeVisible();
});

test("intake computes a deterministic German grade", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Current grade / GPA").fill("8.4");
  await page.getByLabel("Grade scale").selectOption("cgpa10");
  // 1 + 3*(10-8.4)/(10-4) = 1.8
  await expect(page.getByText(/German grade 1,8/)).toBeVisible();
});

test("application tracker adds a programme", async ({ page }) => {
  await page.goto("/tracker");
  await page.getByLabel("University").fill("TU München");
  await page.getByLabel("Programme").fill("M.Sc. Data Engineering");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("TU München")).toBeVisible();
});
