import { expect, test } from "@playwright/test";

/**
 * Split exam layout e2e (mock-test §6): the stimulus pane stays pinned on the left while the questions
 * pane scrolls independently on the right, and question-pill navigation scrolls the right pane.
 *
 * Runs against the BrowserRouter dev server with NO provider key → the exam falls back to the bundled
 * offline IELTS seed (Listening + Reading sections, both of which use the split layout). Requires a
 * desktop viewport (≥1024px, the Playwright default) and an ungated dev env (Supabase unconfigured).
 * Run: `npx playwright install chromium` once, then `npx playwright test split-layout`.
 */
test("stimulus stays pinned while the questions pane scrolls; pills navigate", async ({ page }) => {
  await page.goto("/language/exams/ielts");

  // Generate → no provider → bundled offline seed → exam runner mounts (Section 1 = Listening).
  await page.getByRole("button", { name: /Generate full exam/i }).click();
  await expect(page.getByRole("timer")).toBeVisible({ timeout: 20_000 });

  // Move to the Reading section (passage stimulus on the left).
  await page.getByRole("button", { name: /Next section/i }).click();
  const passage = page.getByRole("region", { name: "Reading passage" });
  const questions = page.getByRole("region", { name: "Questions" });
  await expect(passage).toBeVisible();
  await expect(questions).toBeVisible();

  // The left pane must NOT move when the right pane scrolls.
  const before = await passage.boundingBox();
  await questions.evaluate((el) => el.scrollBy(0, 400));
  const after = await passage.boundingBox();
  expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
  expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
  await expect(passage).toBeInViewport();

  // A question pill scrolls the RIGHT pane (its scrollTop changes), not the page.
  const scrollTopBefore = await questions.evaluate((el) => el.scrollTop);
  await page.getByRole("button", { name: /^Question 3/ }).click();
  await page.waitForTimeout(400);
  const scrollTopAfter = await questions.evaluate((el) => el.scrollTop);
  expect(scrollTopAfter).not.toBe(scrollTopBefore);
});
