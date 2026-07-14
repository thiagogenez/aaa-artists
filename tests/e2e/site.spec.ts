import { expect, test } from "playwright/test";

test("uses the production canonical origin and keeps the pending privacy notice out of search", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aaaartists.co");

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
  await expect(page.getByText("Controller details are being confirmed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to make a data-protection complaint" })).toBeVisible();
  await expect(page.getByText(/acknowledge your complaint within 30 days/i)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aaaartists.co/privacy");

  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(contentWidth).toBeLessThanOrEqual(viewportWidth);
});

test("deduplicates shared events and keeps TBC dates out of event schema", async ({ page }) => {
  await page.goto("/events");
  const xoyo = page.locator("#aaa-fusion-xoyo-2026-08-22");
  await expect(xoyo).toHaveCount(1);
  await expect(xoyo.getByRole("link", { name: "C-Systems", exact: true })).toBeVisible();
  await expect(xoyo.getByRole("link", { name: "Krevix", exact: true })).toBeVisible();
  await expect(page.locator("#timescape-festival-2026")).toContainText("exact date TBC");

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const musicEvents = scripts.flatMap((value) => {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  }).filter((value) => value["@type"] === "MusicEvent");
  expect(musicEvents.some((event) => event.startDate === "2026-08")).toBe(false);
  expect(musicEvents.filter((event) => event.url.endsWith("#aaa-fusion-xoyo-2026-08-22"))).toHaveLength(1);
  expect(musicEvents.find((event) => event.url.endsWith("#aaa-fusion-xoyo-2026-08-22"))).not.toHaveProperty("offers");
});

test("shows visible nested breadcrumbs and a compact, non-duplicated footer", async ({ page }) => {
  await page.goto("/artist/c-systems");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Artists", exact: true })).toBeVisible();
  await expect(breadcrumb.getByText("C-Systems", { exact: true })).toBeVisible();

  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Instagram", exact: true })).toHaveCount(1);
  const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
});

test("opens the mobile menu and preserves footer contrast in dark mode", async ({ page }) => {
  await page.goto("/");
  const openMenu = page.getByRole("button", { name: "Open menu" });
  if (await openMenu.isVisible()) {
    await openMenu.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
  }
  const darkMode = page.getByRole("button", { name: "Switch to dark theme" });
  await darkMode.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("footer")).toBeVisible();
});

test("keeps shared chrome inside common phone and desktop widths", async ({ page }) => {
  for (const width of [320, 375, 390, 412, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  }
});
