import { expect, test } from "playwright/test";

test.describe("interactive roster prototype", () => {
  test("filters artists and keeps Thiago out of Progressive", async ({ page }) => {
    await page.goto("/roster-prototype");

    await expect(page.getByRole("heading", { name: "Find the right sound for your room." })).toBeVisible();
    await expect(page.locator('[data-testid^="artist-"][data-match]')).toHaveCount(7);

    await page.getByTestId("cluster-progressive").click();
    await expect(page.getByText("2 artists match Progressive", { exact: true })).toBeVisible();
    await expect(page.getByTestId("best-matches-label")).toContainText("Best matches");
    await expect(page.getByTestId("best-matches-label")).toContainText("02");
    await expect(page.getByTestId("other-sounds-label")).toContainText("Other sounds");
    await expect(page.getByTestId("other-sounds-label")).toContainText("05");
    await expect(page.getByTestId("artist-krevix")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-mr-b")).toHaveAttribute("data-match", "true");
    await expect(page.getByTestId("artist-thiago")).toHaveAttribute("data-match", "false");

    await page.getByTestId("cluster-uplifting").click();
    await expect(page.getByText("6 artists match Uplifting", { exact: true })).toBeVisible();
    await expect(page.getByTestId("artist-thiago")).toHaveAttribute("data-match", "true");
  });

  test("opens booking details with the selected artist's cluster ranges", async ({ page }) => {
    await page.goto("/roster-prototype");
    await page.getByTestId("artist-thiago").click();

    const detail = page.getByTestId("artist-detail");
    await expect(detail.getByRole("heading", { name: "Thiago Genez" })).toBeVisible();
    await expect(detail.getByText("Uplifting Trance", { exact: true })).toBeVisible();
    await expect(detail.getByText("Peak Time / Driving", { exact: true })).toBeVisible();
    await expect(detail.getByText("Hard Techno", { exact: true })).toBeVisible();
    await expect(detail.getByText("Progressive Trance", { exact: true })).toHaveCount(0);
    await expect(detail.getByRole("link", { name: "Enquire" })).toHaveAttribute("href", "/contact?artist=Thiago%20Genez");
  });

  test("does not create horizontal overflow", async ({ page }) => {
    await page.goto("/roster-prototype");

    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
