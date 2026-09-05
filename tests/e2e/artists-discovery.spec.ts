import { expect, test } from "playwright/test";

test("keeps the full roster visible while bringing the strongest match forward", async ({
  page,
}) => {
  await page.goto("/artists");

  const grid = page.getByTestId("artist-grid");
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(9);

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  await page.getByLabel("Genre", { exact: true }).selectOption("techno");
  await page.getByLabel("Style", { exact: true }).selectOption("hard-techno");

  await expect(page.getByText("1 best match", { exact: false })).toBeVisible();
  const firstArtist = grid.getByRole("link", { name: /View .* profile/ }).first();
  await expect(firstArtist).toHaveAttribute("href", "/artist/thiago");
  await expect(firstArtist).toContainText("Hard Techno · 145–155 BPM");
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(9);
});

test("shares the filters with a directly navigable spectrum", async ({ page }) => {
  await page.goto("/artists");
  await page.getByRole("button", { name: "Spectrum" }).click();

  const spectrum = page.getByTestId("artist-spectrum");
  await expect(spectrum).toBeVisible();
  await expect(
    spectrum.getByRole("heading", { name: "Trance", exact: true }).first()
  ).toBeVisible();
  await expect(
    spectrum.getByRole("heading", { name: "Euro Trance", exact: true }).first()
  ).toBeVisible();

  const frogrRange = spectrum.getByRole("link", { name: "FROGR, 140 to 145 BPM" }).first();
  await expect(frogrRange).toHaveAttribute("href", "/artist/frogr");

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  await page.getByLabel("Genre", { exact: true }).selectOption("techno");
  await expect(
    spectrum.getByRole("heading", { name: "Techno", exact: true }).first()
  ).toBeVisible();
  await expect(spectrum.getByRole("heading", { name: "Trance", exact: true })).toHaveCount(0);
});

test("collapses filters on mobile and keeps square artist photography", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/artists");

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Genre", { exact: true })).not.toBeVisible();

  await filterToggle.click();
  await expect(filterToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByLabel("Genre", { exact: true })).toBeVisible();

  const imageBox = page.getByTestId("artist-grid").locator("a").first().locator("span").first();
  const size = await imageBox.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  expect(Math.abs(size.width - size.height)).toBeLessThan(1);
});
