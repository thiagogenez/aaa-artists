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
  await expect(page.getByTestId("media-player-disabled")).toContainText("External media is waiting for your choice.");
  await expect(page.getByRole("button", { name: /Load .* player/i })).toHaveCount(0);
});

test("does not show the media prompt outside artist pages", async ({ page }) => {
  await page.goto("/about");
  await expect(banner(page)).toHaveCount(0);
});

test("inverts the media prompt against light and dark themes", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await expect(banner(page)).toHaveCSS("background-color", "rgb(10, 10, 10)");
  await expect(banner(page).getByRole("button", { name: "Accept" })).toHaveCSS(
    "background-color",
    "rgb(248, 248, 248)",
  );

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(banner(page)).toHaveCSS("background-color", "rgb(242, 242, 242)");
  await expect(banner(page).getByRole("button", { name: "Accept" })).toHaveCSS(
    "background-color",
    "rgb(10, 10, 10)",
  );
});

test("accepting loads players automatically and persists across pages", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await banner(page).getByRole("button", { name: "Accept" }).click();

  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeAttached();
  await expect(page.getByTestId("media-player-disabled")).toHaveCount(0);

  // The choice is remembered, so another artist page needs no second answer.
  await page.goto("/artist/krevix");
  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeAttached();

  // The static HTML must not briefly render an unanswered banner before the
  // saved localStorage choice is restored during hydration.
  await page.reload();
  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe").first()).toBeAttached();
});

test("declining keeps players disabled and the choice is reversible", async ({ page }) => {
  await page.goto("/artist/c-systems");
  await banner(page).getByRole("button", { name: "Decline" }).click();

  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByTestId("media-player-disabled")).toContainText("External media disabled.");
  await expect(page.getByRole("button", { name: /Load .* player/i })).toHaveCount(0);

  // A mistaken decline is reversible beside the disabled player, where the
  // effect of that choice is immediately visible.
  await page.getByRole("button", { name: "Change media preferences" }).click();
  await expect(banner(page)).toBeVisible();
  await banner(page).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator("iframe").first()).toBeAttached();
});

test("the footer can reset a remembered choice without prompting on unrelated pages", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => window.localStorage.setItem("aaa-media-consent-v1", "denied"));
  await page.reload();

  await expect(banner(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Media preferences" }).click();
  await expect(banner(page)).toHaveCount(0);

  await page.goto("/artist/c-systems");
  await expect(banner(page)).toBeVisible();
});

test("the privacy page can change and reset the choice", async ({ page }) => {
  await seedMediaConsent(page, "denied");
  await page.goto("/privacy");

  await expect(page.getByText("External media stays disabled.")).toBeVisible();
  await page.getByRole("button", { name: "Allow media players" }).click();
  await expect(page.getByText("Players load automatically.")).toBeVisible();

  await page.getByRole("button", { name: "Ask me again" }).click();
  await expect(page.getByText("You have not answered yet, so nothing is loaded automatically.")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
});
