import { expect, test } from "playwright/test";

test("autocompletes artist names with keyboard navigation", async ({ page }) => {
  await page.goto("/artists");
  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();

  const search = page.getByRole("combobox", { name: "Artist" });
  const suggestions = page.getByRole("listbox", { name: "Artist suggestions" });

  await search.fill("c");
  await expect(suggestions.getByRole("option", { name: /C-Systems/ })).toBeVisible();
  await expect(suggestions.getByRole("option", { name: /Xijaro & Pitch/ })).toHaveCount(0);
  await expect(page.getByTestId("artist-grid").getByRole("article")).toHaveCount(1);

  await search.fill("pitch");
  await expect(suggestions.getByRole("option", { name: /Xijaro & Pitch/ })).toBeVisible();

  await search.fill("dek");

  const steve = suggestions.getByRole("option", { name: /Steve Dekay/ });
  await expect(suggestions).toBeVisible();
  await expect(steve).toBeVisible();

  await search.press("ArrowDown");
  await expect(steve).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");

  await expect(search).toHaveValue("Steve Dekay");
  await expect(suggestions).not.toBeVisible();
  await expect(page.getByTestId("artist-grid").getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "View Steve Dekay profile" })).toBeVisible();

  await search.fill("dim");
  await suggestions.getByRole("option", { name: /DIM3NSION/ }).click();
  await expect(search).toHaveValue("DIM3NSION");
  await expect(page.getByRole("link", { name: "View DIM3NSION profile" })).toBeVisible();
});

test("animates pointer filter changes without slowing keyboard or reduced-motion users", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const testWindow = window as Window & { __rosterTransitionCalls?: number };
    testWindow.__rosterTransitionCalls = 0;

    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (update: () => void) => {
        testWindow.__rosterTransitionCalls = (testWindow.__rosterTransitionCalls ?? 0) + 1;
        const updateCallbackDone = Promise.resolve().then(update);
        return {
          ready: updateCallbackDone,
          updateCallbackDone,
          finished: updateCallbackDone,
          skipTransition: () => undefined,
          types: new Set<string>(),
        };
      },
    });
  });
  await page.goto("/artists");
  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();

  const genreChoices = page.getByRole("group", { name: "Genre" });
  await genreChoices.getByRole("button", { name: "Techno", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(1);

  const trance = genreChoices.getByRole("button", { name: "Trance", exact: true });
  await trance.focus();
  await trance.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await genreChoices.getByRole("button", { name: "All", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(1);
});

test("filters the grid to artists compatible with the selected genre and style", async ({
  page,
}) => {
  await page.goto("/artists");

  const grid = page.getByTestId("artist-grid");
  await expect(grid.getByRole("article")).toHaveCount(9);
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(9);
  await expect(grid.getByRole("link", { name: /Book .*/ })).toHaveCount(9);
  await expect(page.getByLabel("Moment", { exact: true })).toHaveCount(0);
  await expect(page.getByText("BPM range", { exact: true })).toHaveCount(0);
  await expect(grid.getByText("Trance", { exact: true }).first()).toBeVisible();

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  const genreChoices = page.getByRole("group", { name: "Genre" });
  const styleChoices = page.getByRole("group", { name: "Style" });
  await genreChoices.getByRole("button", { name: "Trance", exact: true }).click();
  await expect(styleChoices.getByRole("button")).toHaveText([
    "All styles",
    "Progressive Trance",
    "Uplifting Trance",
    "Tech Trance",
    "Euro Trance",
    "Hard Trance",
  ]);

  const progressiveStyle = styleChoices.getByRole("button", {
    name: "Progressive Trance",
    exact: true,
  });
  const lightThemeAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  const darkThemeAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );
  expect(darkThemeAccent).not.toBe(lightThemeAccent);

  await genreChoices.getByRole("button", { name: "Techno", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Hard Techno", exact: true }).click();

  await expect(page.getByText("1 artist", { exact: true })).toBeVisible();
  const firstArtist = grid.getByRole("article").first();
  await firstArtist.hover();
  await expect(
    firstArtist.getByRole("link", { name: "View Thiago Genez profile" })
  ).toHaveAttribute("href", "/artist/thiago");
  await expect(firstArtist.getByRole("link", { name: "Book Thiago Genez" })).toHaveAttribute(
    "href",
    "/contact?artist=Thiago%20Genez"
  );
  await expect(firstArtist).toContainText("Hard");
  await expect(firstArtist).toContainText("Melodic");
  await expect(firstArtist).toContainText("Peak-Time");
  await expect(firstArtist).not.toContainText("BPM");
  await expect(grid.getByText("Uplifting Trance", { exact: true })).toHaveCount(0);
  await expect(grid.getByRole("article")).toHaveCount(1);

  await styleChoices.getByRole("button", { name: "Melodic Techno", exact: true }).click();
  await expect(
    styleChoices.getByRole("button", { name: "Hard Techno", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    styleChoices.getByRole("button", { name: "Melodic Techno", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(grid.getByRole("article")).toHaveCount(2);
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

  const imageBox = page
    .getByTestId("artist-grid")
    .getByRole("article")
    .first()
    .locator("span")
    .first();
  const size = await imageBox.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  expect(Math.abs(size.width - size.height)).toBeLessThan(1);
});
