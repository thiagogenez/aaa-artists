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

  const search = page.getByRole("combobox", { name: "Artists" });
  await search.fill("thi");
  await page
    .getByRole("listbox", { name: "Artist suggestions" })
    .getByRole("option", { name: /Thiago Genez/ })
    .click();
  await expect(page.getByRole("list", { name: "Selected artists" })).toContainText("Thiago Genez");
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
  await expect(page.getByTestId("spectrum-summary")).toHaveCount(0);
  await expect(page.getByText("BPM range", { exact: true })).toHaveCount(0);
  await expect(grid.getByText("Trance", { exact: true }).first()).toBeVisible();

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  const genreChoices = page.getByRole("group", { name: "Genre" });
  const styleChoices = page.getByRole("group", { name: "Style" });
  const gridSummary = page.getByTestId("grid-summary");
  await expect(gridSummary).toHaveText("9 artists · 8 styles");
  await expect(gridSummary).not.toContainText("BPM");
  await genreChoices.getByRole("button", { name: "Trance", exact: true }).click();
  await expect(styleChoices.getByRole("status")).toHaveText("Showing all Trance styles");
  await expect(styleChoices.getByRole("button")).toHaveText([
    "Progressive Trance",
    "Uplifting Trance",
    "Tech Trance",
    "Euro Trance",
    "Hard Trance",
  ]);
  const styleButtonWidths = await styleChoices
    .locator("button[aria-pressed]")
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width));
  expect(Math.max(...styleButtonWidths) - Math.min(...styleButtonWidths)).toBeLessThan(1);

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
  expect(darkThemeAccent).toBe(lightThemeAccent);

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
  const hardTechnoChoice = styleChoices.getByRole("button", {
    name: "Hard Techno",
    exact: true,
  });
  await hardTechnoChoice.click();
  await expect(styleChoices.getByRole("status")).toHaveText("1 of 3 styles selected");
  await expect(
    styleChoices.getByRole("button", { name: "Clear styles", exact: true })
  ).toBeVisible();
  const activeStyleButtonWidths = await styleChoices
    .locator("button[aria-pressed]")
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width));
  expect(Math.max(...activeStyleButtonWidths) - Math.min(...activeStyleButtonWidths)).toBeLessThan(
    1
  );
  await expect
    .poll(() => hardTechnoChoice.evaluate((element) => getComputedStyle(element).boxShadow))
    .not.toBe("none");
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
    background: "rgba(10, 10, 10, 0.72)",
    borderWidth: "1px",
    outline: "none",
    text: "rgba(255, 255, 255, 0.96)",
  });

  await expect(page.getByText("1 artist", { exact: true })).toHaveCount(0);
  await expect(gridSummary).toHaveText("1 artist · 3 styles");
  await expect(
    page.locator("#artist-filters").getByRole("button", { name: "Clear all filters" })
  ).toBeVisible();
  const firstArtist = grid.getByRole("article").first();
  await expect
    .poll(() => firstArtist.evaluate((element) => getComputedStyle(element, "::after").height))
    .toBe("1px");
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
  await expect(styleChoices.getByRole("status")).toHaveText("2 of 3 styles selected");
  await expect(grid.getByRole("article")).toHaveCount(2);
  await expect(grid.getByRole("link", { name: "View Krevix profile" })).toBeVisible();

  await styleChoices.getByRole("button", { name: "Clear styles", exact: true }).click();
  await expect(styleChoices.getByRole("status")).toHaveText("Showing all Techno styles");
  await expect(styleChoices.getByRole("button", { name: "Clear styles", exact: true })).toHaveCount(
    0
  );
  await expect(grid.getByRole("article")).toHaveCount(2);

  await page.locator("#artist-filters").getByRole("button", { name: "Clear all filters" }).click();
  await expect(genreChoices.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(grid.getByRole("article")).toHaveCount(9);
  await expect(gridSummary).toHaveText("9 artists · 8 styles");
  await expect(
    page.locator("#artist-filters").getByRole("button", { name: "Clear all filters" })
  ).toHaveCount(0);
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

test("uses the restrained color treatment across themes", async ({ page }) => {
  await page.goto("/artists");

  await expect(page.getByRole("group", { name: "Color treatment" })).toHaveCount(0);

  const filterToggle = page.getByRole("button", { name: /Filters/ });
  if (await filterToggle.isVisible()) await filterToggle.click();
  await page
    .getByRole("group", { name: "Genre" })
    .getByRole("button", { name: "Trance", exact: true })
    .click();

  const progressiveStyle = page
    .getByRole("group", { name: "Style" })
    .getByRole("button", { name: "Progressive Trance", exact: true });
  const lightColorAccent = await progressiveStyle.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor
  );
  expect(lightColorAccent).toBe("rgb(101, 162, 255)");
  await progressiveStyle.click();
  await expect
    .poll(() =>
      progressiveStyle.evaluate((element) => {
        const styles = getComputedStyle(element);
        const marker = getComputedStyle(element, "::before");
        return (
          styles.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          styles.color !== marker.backgroundColor &&
          styles.boxShadow !== "none"
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
  const peakTimeMoment = momentOptions.getByRole("checkbox", { name: "Peak-time" });
  const warmUpMoment = momentOptions.getByRole("checkbox", { name: "Warm-up" });
  await peakTimeMoment.click();
  await expect(momentOptions).toBeVisible();
  await expect(momentSummary).toContainText("Peak-time");
  await warmUpMoment.click();
  await expect(momentSummary).toContainText("2 moments");
  await expect(peakTimeMoment).toBeChecked();
  await expect(warmUpMoment).toBeChecked();
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
  await expect(bpmControls.getByText("Full range", { exact: true })).toBeVisible();
  const minimumBpmSlider = bpmControls.getByRole("slider", { name: "Minimum BPM" });
  const maximumBpmSlider = bpmControls.getByRole("slider", { name: "Maximum BPM" });
  const minimumBpmValue = bpmControls.locator('[data-handle="minimum"]');
  const maximumBpmValue = bpmControls.locator('[data-handle="maximum"]');
  await expect(minimumBpmSlider).toBeVisible();
  await expect(maximumBpmSlider).toBeVisible();
  await expect(minimumBpmSlider).toHaveAttribute("min", "120");
  await expect(minimumBpmSlider).toHaveAttribute("max", "160");
  await expect(maximumBpmSlider).toHaveAttribute("min", "120");
  await expect(maximumBpmSlider).toHaveAttribute("max", "160");
  await expect(minimumBpmValue).toHaveText("120");
  await expect(maximumBpmValue).toHaveText("160");
  await expect(minimumBpmValue).toHaveCSS("opacity", "0");
  await expect(maximumBpmValue).toHaveCSS("opacity", "0");
  await expect(minimumBpmSlider).toHaveAttribute("data-edge", "start");
  await expect(maximumBpmSlider).toHaveAttribute("data-edge", "end");

  const sliderSelection = bpmControls.locator('[data-bpm-slider-selection="true"]');
  const fullSelectionRatio = await sliderSelection.evaluate((selection) => {
    const track = selection.parentElement;
    if (!track) return 0;
    return selection.getBoundingClientRect().width / track.getBoundingClientRect().width;
  });
  expect(fullSelectionRatio).toBeCloseTo(1, 2);
  const sliderGeometry = await bpmControls.evaluate((control) => {
    const track = control.querySelector('[data-bpm-slider-selection="true"]')?.parentElement;
    const sliders = [...control.querySelectorAll('input[type="range"]')];
    if (!(track instanceof HTMLElement) || sliders.length !== 2) return null;
    const trackBounds = track.getBoundingClientRect();
    return sliders.map((slider) => {
      const sliderBounds = slider.getBoundingClientRect();
      return {
        startExtension: trackBounds.left - sliderBounds.left,
        endExtension: sliderBounds.right - trackBounds.right,
      };
    });
  });
  expect(sliderGeometry).not.toBeNull();
  for (const geometry of sliderGeometry ?? []) {
    expect(geometry.startExtension).toBeCloseTo(8, 0);
    expect(geometry.endExtension).toBeCloseTo(8, 0);
  }

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
        : "Explore an artist to trace every style. Select to compare.",
      { exact: true }
    )
  ).toBeVisible();
  if (mobileSpectrum) {
    const mobileRangeAlignment = await page.evaluate(() => {
      const track = document
        .querySelector('[data-testid="spectrum-mobile-range"] [data-bpm-slider-selection="true"]')
        ?.parentElement?.getBoundingClientRect();
      const rulerScale = document
        .querySelector('[data-bpm-ruler-scale="true"]')
        ?.getBoundingClientRect();
      if (!track || !rulerScale) return null;
      return {
        left: Math.abs(track.left - rulerScale.left),
        width: Math.abs(track.width - rulerScale.width),
      };
    });
    expect(mobileRangeAlignment).not.toBeNull();
    expect(mobileRangeAlignment?.left).toBeLessThan(1);
    expect(mobileRangeAlignment?.width).toBeLessThan(1);

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
    const firstLanes = firstStyle?.nextElementSibling;
    const firstWindow = firstLanes?.querySelector('[data-bpm-window="true"]');
    if (
      !(ruler instanceof HTMLElement) ||
      !(label instanceof HTMLElement) ||
      !(scale instanceof HTMLElement) ||
      !(firstTick instanceof HTMLElement) ||
      !(lastTick instanceof HTMLElement) ||
      !(firstStyle instanceof HTMLElement) ||
      !(firstLanes instanceof HTMLElement) ||
      !(firstWindow instanceof HTMLElement)
    ) {
      return {
        heightDifference: Number.POSITIVE_INFINITY,
        edgeDifference: Number.POSITIVE_INFINITY,
        firstTickDifference: Number.POSITIVE_INFINITY,
        lastTickDifference: Number.POSITIVE_INFINITY,
        laneStartDifference: Number.POSITIVE_INFINITY,
        laneEndDifference: Number.POSITIVE_INFINITY,
        windowStartDifference: Number.POSITIVE_INFINITY,
        windowEndDifference: Number.POSITIVE_INFINITY,
        firstLabelCenterDifference: Number.POSITIVE_INFINITY,
        lastLabelCenterDifference: Number.POSITIVE_INFINITY,
      };
    }
    const scaleBounds = scale.getBoundingClientRect();
    const firstTickBounds = firstTick.getBoundingClientRect();
    const lastTickBounds = lastTick.getBoundingClientRect();
    const lanesBounds = firstLanes.getBoundingClientRect();
    const axisInset = Number.parseFloat(getComputedStyle(firstLanes).marginLeft);
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
      laneStartDifference: Math.abs(scaleBounds.left - firstLanes.getBoundingClientRect().left),
      laneEndDifference: Math.abs(scaleBounds.right - firstLanes.getBoundingClientRect().right),
      windowStartDifference: Math.abs(
        firstWindow.getBoundingClientRect().left - (lanesBounds.left - axisInset)
      ),
      windowEndDifference: Math.abs(
        firstWindow.getBoundingClientRect().right - (lanesBounds.right + axisInset)
      ),
      firstLabelCenterDifference: Math.abs(
        firstTickBounds.left + firstTickBounds.width / 2 - scaleBounds.left
      ),
      lastLabelCenterDifference: Math.abs(
        lastTickBounds.left + lastTickBounds.width / 2 - scaleBounds.right
      ),
    };
  });
  expect(axisAlignment.heightDifference).toBeLessThanOrEqual(1);
  expect(axisAlignment.edgeDifference).toBeLessThan(1);
  expect(axisAlignment.firstTickDifference).toBeLessThan(1);
  expect(axisAlignment.lastTickDifference).toBeLessThan(1);
  expect(axisAlignment.laneStartDifference).toBeLessThan(1);
  expect(axisAlignment.laneEndDifference).toBeLessThan(1);
  expect(axisAlignment.windowStartDifference).toBeLessThan(1);
  expect(axisAlignment.windowEndDifference).toBeLessThan(1);
  expect(axisAlignment.firstLabelCenterDifference).toBeLessThan(1);
  expect(axisAlignment.lastLabelCenterDifference).toBeLessThan(1);
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
  await expect(
    page.getByTestId("discovery-toolbar").getByRole("button", { name: "Clear all filters" })
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) > 767) {
    const spectrumGuide = spectrum.locator(':scope > [aria-live="polite"]');
    const guideHeightBeforeHover = await spectrumGuide.evaluate(
      (element) => element.getBoundingClientRect().height
    );
    await frogrRange.hover();
    await expect(frogrRange).toHaveAttribute("data-footprint", "active");
    await expect(spectrum).toContainText("FROGR · 2 visible styles · 140–146 BPM");
    if ((page.viewportSize()?.width ?? 0) <= 900) {
      const guideHeightAfterHover = await spectrumGuide.evaluate(
        (element) => element.getBoundingClientRect().height
      );
      expect(Math.abs(guideHeightAfterHover - guideHeightBeforeHover)).toBeLessThan(1);
    }
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

  const removeFrogr = page.getByRole("button", { name: "Remove FROGR" });
  await removeFrogr.click();
  await expect(removeFrogr).toHaveCount(0);
  await expect(page.getByLabel("Selected artists")).toContainText("Thiago Genez");
  await page.getByRole("button", { name: "Remove Thiago Genez" }).click();
  await expect(thiagoEntries.first()).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("Selected artists")).toHaveCount(0);

  const spectrumTopBeforeBpmFilter = await spectrum.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY
  );
  await maximumBpmSlider.fill("140");
  await minimumBpmSlider.fill("132");
  await expect(
    page.getByTestId("discovery-toolbar").getByRole("button", { name: "Clear all filters" })
  ).toBeVisible();
  await expect
    .poll(() =>
      spectrum.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
    )
    .toBeCloseTo(spectrumTopBeforeBpmFilter, 1);
  await expect(minimumBpmValue).toHaveText("132");
  await expect(maximumBpmValue).toHaveText("140");
  await expect(minimumBpmValue).toHaveCSS("opacity", "1");
  await expect(maximumBpmValue).toHaveCSS("opacity", "1");
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
  const handleValueAlignment = await bpmControls.evaluate((control) => {
    const selection = control.querySelector('[data-bpm-slider-selection="true"]');
    const minimum = control.querySelector('[data-handle="minimum"]');
    const maximum = control.querySelector('[data-handle="maximum"]');
    if (
      !(selection instanceof HTMLElement) ||
      !(minimum instanceof HTMLElement) ||
      !(maximum instanceof HTMLElement)
    ) {
      return null;
    }
    const selectionBounds = selection.getBoundingClientRect();
    const minimumBounds = minimum.getBoundingClientRect();
    const maximumBounds = maximum.getBoundingClientRect();
    return {
      minimum: Math.abs(minimumBounds.left + minimumBounds.width / 2 - selectionBounds.left),
      maximum: Math.abs(maximumBounds.left + maximumBounds.width / 2 - selectionBounds.right),
    };
  });
  expect(handleValueAlignment).not.toBeNull();
  expect(handleValueAlignment?.minimum).toBeLessThan(1);
  expect(handleValueAlignment?.maximum).toBeLessThan(1);
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
  const stylesPicker = page.getByTestId("spectrum-styles-picker");
  const stylesStatus = stylesPicker.getByRole("status");
  const tranceGroupAction = page.getByRole("button", { name: "Hide all Trance styles" });
  await expect
    .poll(() => tranceGroupAction.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("checkbox", { name: "Progressive Trance" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Uplifting Trance" }).uncheck();
  await expect(page.getByText("7 of 8 styles", { exact: true })).toBeVisible();
  await expect(
    spectrum.getByRole("heading", { name: "Uplifting Trance", exact: true })
  ).toHaveCount(0);
  await page
    .getByTestId("spectrum-styles-picker")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await expect(stylesStatus).toHaveText("Showing all styles.");
  await expect(page.getByText("All 8 styles", { exact: true })).toBeVisible();

  const technoStyles = page.getByRole("region", { name: "Techno styles" });
  await technoStyles.getByRole("button", { name: "Hide all Techno styles" }).click();
  await expect(stylesStatus).toHaveText("Techno styles hidden.");
  await expect(spectrum.getByRole("heading", { name: "Techno", exact: true })).toHaveCount(0);
  await technoStyles.getByRole("button", { name: "Show all Techno styles" }).click();
  await expect(stylesStatus).toHaveText("Showing all Techno styles.");
  await expect(spectrum.getByRole("heading", { name: "Techno", exact: true })).toBeVisible();
  await technoStyles.getByRole("button", { name: "Hide all Techno styles" }).click();
  await expect(stylesStatus).toHaveText("Techno styles hidden.");
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
