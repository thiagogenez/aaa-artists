import { expect, test } from "playwright/test";

test("filters the grid to artists compatible with the selected genre and style", async ({
  page,
}) => {
  await page.goto("/artists");

  const grid = page.getByTestId("artist-grid");
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(9);
  await expect(page.getByLabel("Moment", { exact: true })).toHaveCount(0);
  await expect(page.getByText("BPM range", { exact: true })).toHaveCount(0);
  await expect(grid.getByText("Trance", { exact: true }).first()).toBeVisible();

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  const genreChoices = page.getByRole("group", { name: "Genre" });
  const styleChoices = page.getByRole("group", { name: "Style" });
  await genreChoices.getByRole("button", { name: "Techno", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Hard Techno", exact: true }).click();

  await expect(page.getByText("1 artist", { exact: true })).toBeVisible();
  const firstArtist = grid.getByRole("link", { name: /View .* profile/ }).first();
  await expect(firstArtist).toHaveAttribute("href", "/artist/thiago");
  await expect(firstArtist).toContainText("Hard Techno");
  await expect(firstArtist).not.toContainText("BPM");
  await expect(grid.getByText("Uplifting Trance", { exact: true })).toHaveCount(0);
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(1);

  await styleChoices.getByRole("button", { name: "Melodic Techno", exact: true }).click();
  await expect(
    styleChoices.getByRole("button", { name: "Hard Techno", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    styleChoices.getByRole("button", { name: "Melodic Techno", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(2);
  await expect(grid.getByRole("link", { name: "View Krevix profile" })).toBeVisible();
});

test("shares the filters with a directly navigable spectrum", async ({ page }) => {
  await page.goto("/artists");
  await page.getByRole("button", { name: "Spectrum" }).click();
  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  await expect(page.getByLabel("Moment", { exact: true })).toBeVisible();
  await expect(page.getByText("BPM range", { exact: true })).toBeVisible();

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
  await expect(page.getByRole("group", { name: "Genre" })).not.toBeVisible();

  await filterToggle.click();
  await expect(filterToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("group", { name: "Genre" })).toBeVisible();

  const imageBox = page.getByTestId("artist-grid").locator("a").first().locator("span").first();
  const size = await imageBox.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  expect(Math.abs(size.width - size.height)).toBeLessThan(1);
});
