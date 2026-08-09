import { expect, test } from "playwright/test";

test.describe("interactive roster prototype", () => {
  test("keeps V10 as a viable fixed-range rollback", async ({ page }) => {
    await page.goto("/roster-prototype/v10");

    await expect(page.getByTestId("bpm-fader")).toHaveCount(0);
    await expect(page.getByTestId("cluster-progressive").getByLabel("126 to 134 BPM")).toBeVisible();
    await page.getByTestId("cluster-progressive").click();

    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Progressive Trance");
    await expect(page.getByTestId("artist-krevix")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-mr-b")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-thiago")).toHaveAttribute("data-match", "false");
    await expect(page.getByTestId("cluster-progressive")).toContainText("Show all artists");
  });

  test("keeps V11 available at its explicit mixer URL", async ({ page }) => {
    await page.goto("/roster-prototype/v11");
    await expect(page.getByTestId("bpm-fader")).toBeDisabled();
    await page.getByTestId("cluster-uplifting").click();
    await expect(page.getByTestId("bpm-fader")).toHaveValue("139");
    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Uplifting Trance at 139 BPM");
  });

  test("filters artists and keeps Thiago out of Progressive", async ({ page }) => {
    await page.goto("/roster-prototype");

    await expect(page.getByRole("heading", { name: "Find the right sound for your room." })).toBeVisible();
    await expect(page.locator('[data-testid^="artist-"][data-match]')).toHaveCount(7);
    await expect(page.getByTestId("family-mark")).toHaveAccessibleName("Trance and Techno");
    await expect(page.locator('[data-testid^="family-option-"]')).toHaveCount(0);
    await expect(page.getByTestId("cluster-peak")).toContainText("Peak Time / Driving");
    await expect(page.getByTestId("cluster-progressive")).toContainText("Reveal artists");
    await expect(page.getByTestId("bpm-fader")).toBeDisabled();

    await page.getByTestId("cluster-progressive").click();
    await expect(page.getByTestId("cluster-progressive")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("bpm-fader")).toBeEnabled();
    await expect(page.getByTestId("bpm-fader")).toHaveValue("130");
    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Progressive Trance at 130 BPM");
    await expect(page.getByTestId("best-matches-label")).toHaveText("Best matches");
    await expect(page.getByTestId("other-sounds-label")).toHaveText("Other sounds");
    await expect(page.getByTestId("artist-krevix")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-mr-b")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-thiago")).toHaveAttribute("data-match", "false");

    await page.getByTestId("cluster-progressive").click();
    await expect(page.getByTestId("cluster-progressive")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("roster-result")).toHaveText("Choose a genre, then tune the BPM");
    await expect(page.getByTestId("bpm-fader")).toBeDisabled();
    await expect(page.getByTestId("best-matches-label")).toHaveCount(0);
    await expect(page.locator('[data-testid^="artist-"][data-match="true"]')).toHaveCount(7);

    await page.getByTestId("cluster-uplifting").click();
    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Uplifting Trance at 139 BPM");
    await expect(page.getByTestId("artist-thiago")).toHaveAttribute("data-match", "true");

    await page.getByTestId("cluster-peak").click();
    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Techno (Peak Time / Driving) at 137 BPM");
  });

  test("recalculates artist matches while the BPM fader moves", async ({ page }) => {
    await page.goto("/roster-prototype");
    await page.getByTestId("cluster-progressive").click();

    const fader = page.getByTestId("bpm-fader");
    await fader.focus();
    for (let step = 0; step < 6; step += 1) await fader.press("ArrowRight");

    await expect(fader).toHaveValue("136");
    await expect(fader).toHaveAttribute("aria-valuetext", "136 BPM");
    await expect(page.getByTestId("roster-result")).toHaveText("Best matches for Progressive Trance at 136 BPM");
    await expect(page.getByTestId("artist-krevix")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-mr-b")).toHaveAttribute("data-match", "false");
    await expect(page.getByTestId("artist-mr-b")).toHaveAttribute("data-genre-match", "true");

    await fader.press("End");
    await expect(fader).toHaveValue("160");
    await expect(page.locator('[data-testid^="artist-"][data-match="true"]')).toHaveCount(0);
    await expect(page.getByTestId("roster-result")).toContainText("No exact match");
  });

  test("reveals the production-style artist action panel", async ({ page }) => {
    await page.goto("/roster-prototype");
    const card = page.getByTestId("artist-thiago");
    await card.focus();

    const actions = page.getByTestId("artist-actions-thiago");
    await expect(card).toHaveAttribute("data-open", "true");
    await expect(actions).toHaveAttribute("aria-hidden", "false");
    await expect(actions.getByText("Uplifting · Peak Time · Hard Techno", { exact: true })).toBeVisible();
    await expect(actions.getByText("130–160 BPM", { exact: true })).toBeVisible();
    await expect(actions.getByRole("link", { name: "View Thiago Genez profile" })).toHaveAttribute("href", "/artist/thiago");
    await expect(actions.getByRole("link", { name: "Book Thiago Genez" })).toHaveAttribute("href", "/contact?artist=Thiago%20Genez");

    await card.press("Escape");
    await expect(card).toHaveAttribute("data-open", "false");
    await expect(actions).toHaveAttribute("aria-hidden", "true");
  });

  test("does not create horizontal overflow", async ({ page }) => {
    await page.goto("/roster-prototype");

    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test("keeps other-sound cards compact and interactive on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-webkit", "Mobile-specific roster flow");

    await page.goto("/roster-prototype");
    await page.getByTestId("cluster-progressive").click();
    await expect(page.getByTestId("bpm-fader")).toBeInViewport();

    await expect(page.locator('[data-match="true"]')).toHaveCount(2);
    await expect(page.locator('[data-match="false"]')).toHaveCount(5);

    const matchingSize = await page.getByTestId("artist-krevix").evaluate((card) => ({ width: card.clientWidth, height: card.clientHeight }));
    const otherSize = await page.getByTestId("artist-c-systems").evaluate((card) => ({ width: card.clientWidth, height: card.clientHeight }));
    expect(otherSize.width / matchingSize.width).toBeGreaterThanOrEqual(0.92);
    expect(otherSize.width / matchingSize.width).toBeLessThanOrEqual(0.96);
    expect(otherSize.height / matchingSize.height).toBeGreaterThanOrEqual(0.92);
    expect(otherSize.height / matchingSize.height).toBeLessThanOrEqual(0.96);

    const matchingImageOpacity = await page.getByTestId("artist-krevix").locator("img").evaluate((image) => Number(getComputedStyle(image).opacity));
    const otherImageOpacity = await page.getByTestId("artist-c-systems").locator("img").evaluate((image) => Number(getComputedStyle(image).opacity));
    expect(otherImageOpacity).toBeLessThan(matchingImageOpacity);

    await page.getByTestId("artist-c-systems").click();
    await expect(page.getByTestId("artist-c-systems")).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("artist-actions-c-systems")).toHaveAttribute("aria-hidden", "false");
  });
});
