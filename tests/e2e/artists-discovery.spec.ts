import { expect, test } from "playwright/test";

test("filters by multiple artist names with an accessible autocomplete", async ({ page }) => {
  await page.goto("/artists");
  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();

  const search = page.getByRole("combobox", { name: "Artists" });
  const suggestions = page.getByRole("listbox", { name: "Artist suggestions" });
  const grid = page.getByTestId("artist-grid");

  await search.fill("c");
  await expect(suggestions.getByRole("option", { name: /C-Systems/ })).toBeVisible();
  await expect(suggestions.getByRole("option", { name: /Xijaro & Pitch/ })).toHaveCount(0);
  await expect(grid.getByRole("article")).toHaveCount(9);

  await search.fill("pitch");
  await expect(suggestions.getByRole("option", { name: /Xijaro & Pitch/ })).toBeVisible();

  await search.fill("dek");

  const steve = suggestions.getByRole("option", { name: /Steve Dekay/ });
  await expect(suggestions).toBeVisible();
  await expect(steve).toBeVisible();

  await search.press("ArrowDown");
  await expect(steve).toHaveAttribute("data-active", "true");
  await search.press("Enter");

  const selectedArtists = page.getByRole("list", { name: "Selected artists" });
  await expect(search).toHaveValue("");
  await expect(selectedArtists).toContainText("Steve Dekay");
  await expect(suggestions).not.toBeVisible();
  await expect(grid.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "View Steve Dekay profile" })).toBeVisible();

  await search.fill("dim");
  await suggestions.getByRole("option", { name: /DIM3NSION/ }).click();
  await expect(search).toHaveValue("");
  await expect(selectedArtists).toContainText("Steve Dekay");
  await expect(selectedArtists).toContainText("DIM3NSION");
  await expect(grid.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "View Steve Dekay profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View DIM3NSION profile" })).toBeVisible();

  await page.getByRole("button", { name: "Remove Steve Dekay" }).click();
  await expect(selectedArtists).not.toContainText("Steve Dekay");
  await expect(grid.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "View DIM3NSION profile" })).toBeVisible();

  await search.press("Backspace");
  await expect(selectedArtists).toHaveCount(0);
  await expect(grid.getByRole("article")).toHaveCount(9);
});

test("animates pointer filter changes without slowing keyboard or reduced-motion users", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const testWindow = window as Window & {
      __rosterTransitionCalls?: number;
      __rosterTransitionDirections?: string[];
    };
    testWindow.__rosterTransitionCalls = 0;
    testWindow.__rosterTransitionDirections = [];

    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (update: () => void) => {
        testWindow.__rosterTransitionCalls = (testWindow.__rosterTransitionCalls ?? 0) + 1;
        testWindow.__rosterTransitionDirections?.push(
          document.documentElement.dataset.rosterTransition ?? ""
        );
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
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __rosterTransitionDirections?: string[] })
            .__rosterTransitionDirections
      )
    )
    .toEqual(["collapse"]);

  const trance = genreChoices.getByRole("button", { name: "Trance", exact: true });
  await trance.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(2);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __rosterTransitionDirections?: string[] })
            .__rosterTransitionDirections
      )
    )
    .toEqual(["collapse", "expand"]);

  const techno = genreChoices.getByRole("button", { name: "Techno", exact: true });
  await techno.focus();
  await techno.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await genreChoices.getByRole("button", { name: "All", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __rosterTransitionCalls?: number }).__rosterTransitionCalls
      )
    )
    .toBe(2);
});

test("filters the grid to artists compatible with the selected genre and style", async ({
  page,
}) => {
  await page.goto("/artists");

  const grid = page.getByTestId("artist-grid");
  await expect(grid.getByRole("article")).toHaveCount(9);
  await expect(grid.getByRole("link", { name: /View .* profile/ })).toHaveCount(9);
  await expect(grid.getByRole("link", { name: /Book .*/ })).toHaveCount(9);
  await expect(page.getByTestId("spectrum-moment-picker")).toHaveCount(0);
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
  const thiagoCard = grid.getByRole("article").filter({
    has: page.getByText("Thiago Genez", { exact: true }),
  });
  const selectedStyleLabel = thiagoCard.getByText("Hard", { exact: true });
  const unselectedMetrics = await selectedStyleLabel.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return {
      fontSize: styles.fontSize,
      height: bounds.height,
      width: bounds.width,
    };
  });
  await styleChoices.getByRole("button", { name: "Hard Techno", exact: true }).click();
  const selectedMetrics = await selectedStyleLabel.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return {
      fontSize: styles.fontSize,
      height: bounds.height,
      width: bounds.width,
    };
  });

  expect(selectedMetrics.fontSize).toBe(unselectedMetrics.fontSize);
  expect(selectedMetrics.height).toBeCloseTo(unselectedMetrics.height, 1);
  expect(selectedMetrics.width).toBeCloseTo(unselectedMetrics.width, 1);
  const selectedTreatment = await selectedStyleLabel.evaluate((element) => {
    const label = getComputedStyle(element);
    const surface = getComputedStyle(element, "::before");
    return {
      background: surface.backgroundColor,
      borderWidth: surface.borderTopWidth,
      outline: surface.outlineStyle,
      text: label.color,
    };
  });
  expect(selectedTreatment).toEqual({
    background: "rgba(255, 255, 255, 0.14)",
    borderWidth: "1px",
    outline: "none",
    text: "rgba(255, 255, 255, 0.96)",
  });

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

test("ranks artists matching every selected style before partial matches", async ({ page }) => {
  await page.goto("/artists");

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();

  const genreChoices = page.getByRole("group", { name: "Genre" });
  const styleChoices = page.getByRole("group", { name: "Style" });
  await genreChoices.getByRole("button", { name: "Trance", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Progressive Trance", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Uplifting Trance", exact: true }).click();

  const cards = page.getByTestId("artist-grid").getByRole("article");
  await expect(cards.nth(0)).toContainText("C-Systems");
  await expect(cards.nth(1)).toContainText("DIM3NSION");
  await expect(cards.nth(2)).toContainText("Thiago Genez");
  await expect(cards.nth(3)).toContainText("Krevix");
  await expect(cards.nth(4)).toContainText("Mr B");
  await expect(cards.nth(5)).toContainText("Xijaro & Pitch");
});

test("orders partial style matches by the canonical sound spectrum", async ({ page }) => {
  await page.goto("/artists");

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();

  const genreChoices = page.getByRole("group", { name: "Genre" });
  const styleChoices = page.getByRole("group", { name: "Style" });
  await genreChoices.getByRole("button", { name: "Trance", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Hard Trance", exact: true }).click();
  await styleChoices.getByRole("button", { name: "Progressive Trance", exact: true }).click();

  const cards = page.getByTestId("artist-grid").getByRole("article");
  await expect(cards).toHaveCount(9);
  await expect(cards.nth(0)).toContainText("Mr B");
  await expect(cards.nth(1)).toContainText("C-Systems");
  await expect(cards.nth(2)).toContainText("DIM3NSION");
  await expect(cards.nth(3)).toContainText("Thiago Genez");
  await expect(cards.nth(4)).toContainText("Krevix");
  await expect(cards.nth(5)).toContainText("Xijaro & Pitch");
  await expect(cards.nth(6)).toContainText("Steve Dekay");
  await expect(cards.nth(7)).toContainText("FROGR");
  await expect(cards.nth(8)).toContainText("SAGO");
});

test("switches between monochrome and restrained color treatments", async ({ page }) => {
  await page.goto("/artists");

  const palette = page.getByRole("group", { name: "Color treatment" });
  const withoutColors = palette.getByRole("button", { name: "Without colors" });
  const withColors = palette.getByRole("button", { name: "With colors" });
  await expect(withoutColors).toHaveAttribute("aria-pressed", "true");
  await expect(withColors).toHaveAttribute("aria-pressed", "false");

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  await page
    .getByRole("group", { name: "Genre" })
    .getByRole("button", { name: "Trance", exact: true })
    .click();

  const progressiveStyle = page
    .getByRole("group", { name: "Style" })
    .getByRole("button", { name: "Progressive Trance", exact: true });
  const monochromeAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );

  await withColors.click();
  await progressiveStyle.click();
  const lightColorAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );
  expect(lightColorAccent).not.toBe(monochromeAccent);
  await expect
    .poll(() =>
      progressiveStyle.evaluate((element) => {
        const styles = getComputedStyle(element);
        return (
          styles.backgroundColor === "rgb(10, 10, 10)" && styles.color === styles.borderTopColor
        );
      })
    )
    .toBe(true);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  const darkColorAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );
  expect(darkColorAccent).toBe(lightColorAccent);
});

test("shares name filters with a selectable BPM-ordered spectrum", async ({ page }) => {
  await page.goto("/artists");
  await page.getByRole("button", { name: "Spectrum" }).click();
  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  const momentPicker = page.getByTestId("spectrum-moment-picker");
  await expect(momentPicker).toBeVisible();
  const momentSummary = momentPicker.locator("[data-picker-trigger]");
  const stylesSummary = page.getByTestId("spectrum-styles-picker").locator("[data-picker-trigger]");
  const pickerHeights = await Promise.all([
    momentSummary.evaluate((element) => element.getBoundingClientRect().height),
    stylesSummary.evaluate((element) => element.getBoundingClientRect().height),
  ]);
  expect(Math.abs(pickerHeights[0] - pickerHeights[1])).toBeLessThan(1);

  await momentSummary.click();
  const momentOptions = page.locator("#spectrum-moment-options");
  await expect(momentOptions).toBeVisible();
  const peakTimeMoment = momentOptions.getByRole("button", { name: "Peak-time" });
  const warmUpMoment = momentOptions.getByRole("button", { name: "Warm-up" });
  await peakTimeMoment.click();
  await expect(momentOptions).toBeVisible();
  await expect(momentSummary).toContainText("Peak-time");
  await warmUpMoment.click();
  await expect(momentSummary).toContainText("2 moments");
  await expect(peakTimeMoment).toHaveAttribute("aria-pressed", "true");
  await expect(warmUpMoment).toHaveAttribute("aria-pressed", "true");
  const resetMoment = momentOptions.getByRole("button", { name: "Reset" });
  await expect(resetMoment).toBeEnabled();
  await resetMoment.click();
  await expect(momentSummary).toContainText("Any moment");
  await expect(resetMoment).toBeDisabled();
  await momentOptions.getByRole("button", { name: "Done" }).click();
  await expect(momentOptions).not.toBeVisible();
  const spectrumRuler = page.locator('[data-spectrum-ruler="true"]');
  const mobileSpectrum = (page.viewportSize()?.width ?? 0) <= 767;
  const bpmControls = mobileSpectrum ? page.getByTestId("spectrum-mobile-range") : spectrumRuler;
  await expect(bpmControls.getByText(/BPM(?: range)?/, { exact: true })).toBeVisible();
  await expect(
    bpmControls.getByText(mobileSpectrum ? "Full range" : "Full range selected", { exact: true })
  ).toBeVisible();
  const minimumBpmSlider = bpmControls.getByRole("slider", { name: "Minimum BPM" });
  const maximumBpmSlider = bpmControls.getByRole("slider", { name: "Maximum BPM" });
  await expect(minimumBpmSlider).toBeVisible();
  await expect(maximumBpmSlider).toBeVisible();
  await expect(minimumBpmSlider).toHaveAttribute("data-edge", "start");
  await expect(maximumBpmSlider).toHaveAttribute("data-edge", "end");

  const sliderSelection = bpmControls.locator('[data-bpm-slider-selection="true"]');
  const fullSelectionRatio = await sliderSelection.evaluate((selection) => {
    const track = selection.parentElement;
    if (!track) return 0;
    return selection.getBoundingClientRect().width / track.getBoundingClientRect().width;
  });
  expect(fullSelectionRatio).toBeCloseTo(1, 2);

  const spectrum = page.getByTestId("artist-spectrum");
  await expect(spectrum).toBeVisible();
  await expect
    .poll(() =>
      spectrum
        .locator('[data-bpm-window="true"]')
        .first()
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))
    )
    .toBeGreaterThan(0);
  const touchGuidance = await page.evaluate(() => window.matchMedia("(hover: none)").matches);
  await expect(
    spectrum.getByText(
      touchGuidance
        ? "Tap an artist to trace every style and compare."
        : "Point to trace every style. Select to compare.",
      { exact: true }
    )
  ).toBeVisible();
  if (mobileSpectrum) {
    const viewportShell = spectrum.locator('[data-scroll-hint="true"]');
    await expect(viewportShell).toBeVisible();
    await expect(spectrum.getByText("Swipe for higher BPM", { exact: true })).toBeVisible();
    await viewportShell
      .getByRole("region", { name: "Artist BPM spectrum" })
      .evaluate((element) => element.scrollTo({ left: 100 }));
    await expect(spectrum.locator('[data-scroll-hint="false"]')).toBeVisible();
  }
  const rulerTicks = spectrum.locator("[data-bpm-tick]");
  await expect(rulerTicks).toHaveCount(21);
  await expect(spectrum.locator('[data-bpm-tick][data-major="true"]')).toHaveCount(5);
  await expect(spectrum.locator('[data-bpm-tick][data-major="false"]')).toHaveCount(16);
  await expect(page.getByTestId("spectrum-summary")).toContainText(
    "9 artists · 8 styles · 122–155 BPM"
  );
  await expect(
    spectrum.getByRole("heading", { name: "Trance", exact: true }).first()
  ).toBeVisible();
  await expect(
    spectrum.getByRole("heading", { name: "Euro Trance", exact: true }).first()
  ).toBeVisible();

  const frogrRange = spectrum
    .getByRole("button", { name: "FROGR, Euro Trance, 140 to 145 BPM" })
    .first();
  await expect(frogrRange).not.toHaveAttribute("title");
  await expect(spectrum.locator('[data-spectrum-coverage="true"]')).toHaveCount(8);
  const progressiveMeta = spectrum.locator('[data-spectrum-style="progressive-trance"] h3');
  await expect(progressiveMeta.locator("[data-spectrum-style-count]")).toHaveText("5 artists");
  await expect(progressiveMeta.locator("[data-spectrum-style-bpm]")).toHaveText("126–136 BPM");
  await expect
    .poll(() =>
      spectrum
        .locator('[data-spectrum-style="progressive-trance"] [data-artist]')
        .evaluateAll((entries) => entries.map((entry) => entry.getAttribute("data-artist")))
    )
    .toEqual(["dim3nsion", "krevix", "mr-b", "thiago", "c-systems"]);

  const dimensionProgressive = spectrum.getByRole("button", {
    name: "DIM3NSION, Progressive Trance, 126 to 134 BPM",
  });
  const dimensionRangeValues = dimensionProgressive.locator('[data-bpm-range-values="true"]');
  await expect(dimensionRangeValues.locator("span").first()).toHaveText("126");
  await expect(dimensionRangeValues.locator("span").last()).toHaveText("134");
  const dimensionRangeLayout = await dimensionProgressive.evaluate((entry) => {
    const range = entry.querySelector('[data-bpm-profile-range="true"]');
    const values = entry.querySelector('[data-bpm-range-values="true"]');
    if (!(range instanceof HTMLElement) || !(values instanceof HTMLElement)) return false;
    return values.getBoundingClientRect().top >= range.getBoundingClientRect().bottom;
  });
  expect(dimensionRangeLayout).toBe(true);

  const axisAlignment = await spectrum.evaluate((element) => {
    const ruler = element.querySelector('[data-spectrum-ruler="true"]');
    const label = element.querySelector('[data-spectrum-axis-label="true"]');
    const scale = ruler?.querySelector(":scope > div");
    const firstTick = scale?.querySelector('[data-bpm-tick="120"]');
    const lastTick = scale?.querySelector('[data-bpm-tick="160"]');
    const firstStyle = element.querySelector('[data-spectrum-style="progressive-trance"] h3');
    if (
      !(ruler instanceof HTMLElement) ||
      !(label instanceof HTMLElement) ||
      !(scale instanceof HTMLElement) ||
      !(firstTick instanceof HTMLElement) ||
      !(lastTick instanceof HTMLElement) ||
      !firstStyle
    ) {
      return {
        heightDifference: Number.POSITIVE_INFINITY,
        edgeDifference: Number.POSITIVE_INFINITY,
        firstTickDifference: Number.POSITIVE_INFINITY,
        lastTickDifference: Number.POSITIVE_INFINITY,
        firstLabelInset: Number.NEGATIVE_INFINITY,
        lastLabelInset: Number.NEGATIVE_INFINITY,
      };
    }
    const scaleBounds = scale.getBoundingClientRect();
    const firstTickBounds = firstTick.getBoundingClientRect();
    const lastTickBounds = lastTick.getBoundingClientRect();
    return {
      heightDifference: Math.abs(
        label.getBoundingClientRect().height - ruler.getBoundingClientRect().height
      ),
      edgeDifference: Math.abs(
        label.getBoundingClientRect().right - firstStyle.getBoundingClientRect().right
      ),
      firstTickDifference: Math.abs(
        firstTickBounds.left +
          Number.parseFloat(getComputedStyle(firstTick, "::after").left) -
          scaleBounds.left
      ),
      lastTickDifference: Math.abs(
        lastTickBounds.left +
          Number.parseFloat(getComputedStyle(lastTick, "::after").left) -
          scaleBounds.right
      ),
      firstLabelInset: firstTickBounds.left - scaleBounds.left,
      lastLabelInset: scaleBounds.right - lastTickBounds.right,
    };
  });
  expect(axisAlignment.heightDifference).toBeLessThanOrEqual(1);
  expect(axisAlignment.edgeDifference).toBeLessThan(1);
  expect(axisAlignment.firstTickDifference).toBeLessThan(1);
  expect(axisAlignment.lastTickDifference).toBeLessThan(1);
  expect(axisAlignment.firstLabelInset).toBeGreaterThanOrEqual(3);
  expect(axisAlignment.lastLabelInset).toBeGreaterThanOrEqual(3);
  const thiagoEntries = spectrum.locator('[data-artist="thiago"]');
  await expect(thiagoEntries).toHaveCount(5);
  await thiagoEntries.first().focus();
  await expect
    .poll(() =>
      thiagoEntries.evaluateAll((entries) => entries.map((entry) => entry.dataset.footprint))
    )
    .toEqual(["active", "active", "active", "active", "active"]);
  await expect(spectrum.locator('[data-artist="frogr"]').first()).toHaveAttribute(
    "data-footprint",
    "muted"
  );
  await expect(spectrum).toContainText("Thiago Genez · 5 visible styles · 122–155 BPM");

  await page.getByRole("button", { name: "Spectrum" }).focus();
  const toggleThiago = async () => {
    if ((page.viewportSize()?.width ?? 0) <= 767) {
      await thiagoEntries.first().focus();
      await page.keyboard.press("Enter");
      return;
    }
    await thiagoEntries.first().click();
  };
  await toggleThiago();
  await expect(thiagoEntries.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/artists$/);
  await expect(page.getByLabel("Selected artists")).toContainText("Thiago Genez");
  await expect(spectrum).toContainText("Selected: Thiago Genez");
  await expect(page.getByRole("navigation", { name: "Actions for Thiago Genez" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 0) > 767) {
    await frogrRange.hover();
    await expect(frogrRange).toHaveAttribute("data-footprint", "active");
    await expect(spectrum).toContainText("FROGR · 2 visible styles · 140–146 BPM");
    await expect
      .poll(() =>
        thiagoEntries.evaluateAll((entries) => entries.map((entry) => entry.dataset.footprint))
      )
      .toEqual(["active", "active", "active", "active", "active"]);
  }
  await page.getByRole("button", { name: "Spectrum" }).hover();
  await page.getByRole("button", { name: "Spectrum" }).focus();
  await expect(spectrum.locator('[data-artist="frogr"]').first()).toHaveCSS("opacity", "0.08");

  if ((page.viewportSize()?.width ?? 0) <= 767) {
    await frogrRange.focus();
    await page.keyboard.press("Enter");
  } else {
    await frogrRange.click();
  }
  await expect(frogrRange).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Selected artists")).toContainText("FROGR");
  await expect(page.getByRole("button", { name: "Clear selected" })).toBeVisible();
  await expect
    .poll(() =>
      thiagoEntries.evaluateAll((entries) => entries.map((entry) => entry.dataset.footprint))
    )
    .toEqual(["active", "active", "active", "active", "active"]);

  await page.getByRole("button", { name: "Remove FROGR" }).click();
  await page.getByRole("button", { name: "Remove Thiago Genez" }).click();
  await expect(thiagoEntries.first()).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("Selected artists")).toHaveCount(0);

  await maximumBpmSlider.fill("140");
  await minimumBpmSlider.fill("132");
  await expect(minimumBpmSlider).not.toHaveAttribute("data-edge");
  await expect(maximumBpmSlider).not.toHaveAttribute("data-edge");
  await expect(
    bpmControls.getByText(mobileSpectrum ? "Selected" : "Selected range", { exact: true })
  ).toBeVisible();
  if (!mobileSpectrum) {
    const selectedRangeFitsAxis = await spectrumRuler
      .getByText("Selected range", { exact: true })
      .evaluate((status) => {
        const axisLabel = status.closest('[data-spectrum-axis-label="true"]');
        return (
          axisLabel instanceof HTMLElement &&
          status.getBoundingClientRect().right <= axisLabel.getBoundingClientRect().right
        );
      });
    expect(selectedRangeFitsAxis).toBe(true);
  }
  await expect(spectrum).toHaveAttribute("data-bpm-filtered", "true");
  await expect(spectrum.locator('[data-bpm-tick="130"]')).toHaveAttribute("data-in-range", "false");
  await expect(spectrum.locator('[data-bpm-tick="132"]')).toHaveAttribute("data-in-range", "true");
  const rulerSelectionRatio = await sliderSelection.evaluate((selection) => {
    const track = selection.parentElement;
    if (!track) return 0;
    return selection.getBoundingClientRect().width / track.getBoundingClientRect().width;
  });
  expect(rulerSelectionRatio).toBeCloseTo(0.2, 2);
  await expect
    .poll(() =>
      spectrum
        .locator('[data-bpm-window="true"]')
        .first()
        .evaluate((element) => getComputedStyle(element).opacity)
    )
    .toBe("1");
  await expect(spectrum.locator('[data-bpm-window="true"]').first()).toHaveCSS(
    "border-left-width",
    "0px"
  );

  const thiagoProgressive = spectrum.getByRole("button", {
    name: "Thiago Genez, Progressive Trance, 128 to 136 BPM",
  });
  await expect(thiagoProgressive).toHaveAttribute("data-bpm-match", "partial");
  const overlapRatio = await thiagoProgressive.evaluate((entry) => {
    const fullRange = entry.querySelector('[data-bpm-profile-range="true"]');
    const overlap = entry.querySelector('[data-bpm-overlap="true"]');
    if (!(fullRange instanceof HTMLElement) || !(overlap instanceof HTMLElement)) return 0;
    return overlap.getBoundingClientRect().width / fullRange.getBoundingClientRect().width;
  });
  expect(overlapRatio).toBeCloseTo(0.5, 1);

  await page.getByText("All 8 styles", { exact: true }).click();
  const progressiveStyleOption = page.locator('[data-spectrum-style-option="progressive-trance"]');
  const showOnlyProgressive = progressiveStyleOption.getByRole("button", {
    name: "Show only Progressive Trance",
  });
  if ((page.viewportSize()?.width ?? 0) > 1100) {
    await expect(showOnlyProgressive).toHaveCSS("opacity", "0");
    await progressiveStyleOption.scrollIntoViewIfNeeded();
    await progressiveStyleOption.getByText("Progressive Trance", { exact: true }).hover();
    await expect(showOnlyProgressive).toHaveCSS("opacity", "1");
    await page.getByRole("heading", { name: "Our Artists" }).hover();
    await expect(showOnlyProgressive).toHaveCSS("opacity", "0");
    await progressiveStyleOption.getByText("Progressive Trance", { exact: true }).hover();
  } else {
    await expect(showOnlyProgressive).toHaveCSS("opacity", "1");
  }
  await showOnlyProgressive.click();
  await expect(page.getByText("1 of 8 styles", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Progressive Trance" })).toBeChecked();
  await expect(
    spectrum.getByRole("heading", { name: "Uplifting Trance", exact: true })
  ).toHaveCount(0);
  await page
    .getByTestId("spectrum-styles-picker")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await expect(page.getByText("All 8 styles", { exact: true })).toBeVisible();

  const technoStyles = page.getByRole("region", { name: "Techno styles" });
  await technoStyles.getByRole("button", { name: "Hide all Techno styles" }).click();
  await expect(spectrum.getByRole("heading", { name: "Techno", exact: true })).toHaveCount(0);
  await expect(
    spectrum.getByRole("heading", { name: "Trance", exact: true }).first()
  ).toBeVisible();
  await expect(page.getByText("5 of 8 styles", { exact: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "Progressive Trance" }).uncheck();
  await expect(
    spectrum.getByRole("heading", { name: "Progressive Trance", exact: true })
  ).toHaveCount(0);
  await expect(
    spectrum.getByRole("heading", { name: "Uplifting Trance", exact: true }).first()
  ).toBeVisible();
  await expect(page.getByText("4 of 8 styles", { exact: true })).toBeVisible();

  const stylesPicker = page.getByTestId("spectrum-styles-picker");
  await stylesPicker.getByRole("button", { name: "Done", exact: true }).click();
  await expect(technoStyles).not.toBeVisible();

  await stylesPicker.getByText("4 of 8 styles", { exact: true }).click();
  await expect(technoStyles).toBeVisible();
  await page.getByRole("heading", { name: "Our Artists" }).click();
  await expect(technoStyles).not.toBeVisible();
});

test("preserves the BPM map as a horizontally scrollable spectrum on mobile", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 767, "Mobile spectrum behavior");

  await page.goto("/artists");
  await page.getByRole("button", { name: "Spectrum" }).click();

  const viewport = page.getByRole("region", { name: "Artist BPM spectrum" });
  const dimensions = await viewport.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  await expect(viewport.getByRole("heading", { name: "Progressive Trance" })).toHaveCSS(
    "position",
    "sticky"
  );
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
