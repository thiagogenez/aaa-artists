import { expect, test } from "playwright/test";
import { blockMediaProviders, seedMediaConsent } from "./helpers";

const banner = (page: import("playwright/test").Page) =>
  page.getByRole("region", { name: "Media cookie choice" });

test.beforeEach(async ({ page }) => {
  // Never let a player reach a real provider during tests.
  await blockMediaProviders(page);
});

test("asks before embedding any third-party player", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await expect(banner(page)).toBeVisible();
  // The whole point: nothing is embedded while the question is unanswered.
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Load SoundCloud player/i })).toBeVisible();
});

test("accepting loads players automatically and persists across pages", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await banner(page).getByRole("button", { name: "Accept" }).click();

  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeAttached();
  await expect(page.getByRole("button", { name: /Load SoundCloud player/i })).toHaveCount(0);

  // The choice is remembered, so another artist page needs no second answer.
  await page.goto("/artist/krevix");
  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeAttached();
});

test("declining keeps players gated but still individually loadable", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await banner(page).getByRole("button", { name: "Decline" }).click();

  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);

  const loadButton = page.getByRole("button", { name: /Load SoundCloud player/i });
  await expect(loadButton).toBeVisible();
  await loadButton.click();
  await expect(page.locator("iframe").first()).toBeAttached();

  // A one-off load must not silently turn into site-wide consent.
  await page.goto("/artist/krevix");
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("the privacy page can change and reset the choice", async ({ page }) => {
  await seedMediaConsent(page, "denied");
  await page.goto("/privacy");

  await expect(page.getByText("Players stay blocked until you load one individually.")).toBeVisible();
  await page.getByRole("button", { name: "Allow media players" }).click();
  await expect(page.getByText("Players load automatically.")).toBeVisible();

  await page.getByRole("button", { name: "Ask me again" }).click();
  await expect(page.getByText("You have not answered yet, so nothing is loaded automatically.")).toBeVisible();
  await expect(banner(page)).toBeVisible();
});
