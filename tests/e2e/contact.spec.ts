import { expect, test } from "playwright/test";

test.describe("booking form regression coverage", () => {
  test("keeps the mobile form inside the viewport and resets safely", async ({ page }) => {
    await page.goto("/contact");

    const clearButton = page.getByRole("button", { name: "Clear form", exact: true });
    await expect(clearButton).toHaveCount(0);

    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill("Jane Booker");
    await expect(clearButton).toBeVisible();

    page.once("dialog", async (dialog) => dialog.accept());
    await clearButton.click();
    await expect(nameInput).toHaveValue("");
    await expect(clearButton).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reset form", exact: true })).toHaveCount(0);

    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);

    const dateBox = await page.locator('input[name="date"]').boundingBox();
    expect(dateBox).not.toBeNull();
    expect(dateBox!.x + dateBox!.width).toBeLessThanOrEqual(dimensions.innerWidth);
  });

  test("offers regional email domains without assuming one after @", async ({ browser }) => {
    const context = await browser.newContext({
      locale: "en-GB",
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/contact");

    const emailInput = page.locator('input[name="email"]');
    const suggestions = page.locator('button[aria-label^="Complete email as"]');

    await emailInput.fill("jane@");
    await expect(suggestions).toHaveCount(0);

    await emailInput.fill("jane@hotmail.");
    await expect(suggestions).toHaveCount(3);
    await expect(suggestions).toHaveText([
      "@hotmail.co.uk",
      "@hotmail.com",
      "@hotmail.fr",
    ]);

    await page.getByRole("button", { name: "+5 more", exact: true }).click();
    await expect(suggestions).toHaveCount(8);
    await page.locator('button[aria-label="Complete email as jane@hotmail.co.uk"]').click();
    await expect(emailInput).toHaveValue("jane@hotmail.co.uk");
    await expect(suggestions).toHaveCount(0);

    await context.close();
  });

  test("keeps WhatsApp usernames clean while showing the fixed @ prefix", async ({ page }) => {
    await page.goto("/contact");

    await page.locator('input[name="whatsapp-contact-method"][value="username"]').check({ force: true });
    const usernameInput = page.locator('input[name="whatsappUsername"]');
    await usernameInput.fill("@aaa-booking");

    await expect(usernameInput).toHaveValue("aaa-booking");
    await expect(usernameInput.locator("xpath=..")).toContainText("@");
    await expect(page.locator('input[name="whatsappUsernameKey"]')).toBeVisible();
  });

  test("collapses completed artist cards and calculates exact timing", async ({ page }) => {
    await page.goto("/contact");

    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add another artist", exact: true }).click();

    const firstArtistToggle = page.locator('button[aria-controls="artist-booking-0"]');
    const secondArtistToggle = page.locator('button[aria-controls="artist-booking-1"]');
    await expect(firstArtistToggle).toHaveAttribute("aria-expanded", "false");
    await expect(secondArtistToggle).toHaveAttribute("aria-expanded", "true");

    await page.locator('select[name="booking-1-artist"]').selectOption("Open to suggestions");
    await page.locator('input[name="booking-1-timing-mode"][value="times"]').check();
    await page.locator('input[name="booking-1-start"]').fill("22:30");
    await page.locator('input[name="booking-1-finish"]').fill("00:00");
    await expect(page.getByRole("status").filter({ hasText: "1 hour 30 minutes" })).toBeVisible();
  });

  test("loads local city suggestions and still accepts free text", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('button[aria-controls="section-event"]').click();

    const countryInput = page.locator('input[name="country"]');
    await countryInput.fill("Brazil");
    await countryInput.press("Enter");

    const cityInput = page.locator('input[name="city"]');
    await expect(cityInput).toBeEnabled();
    await cityInput.fill("Sao Paulo");
    await expect(page.getByRole("option", { name: "Sao Paulo", exact: true }).first()).toBeVisible();

    await cityInput.fill("My small town");
    await expect(cityInput).toHaveValue("My small town");
  });

  test("submits structured enquiry data through the first-party API", async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await page.route("**/api/enquiries", async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto("/contact");

    await page.locator('input[name="name"]').fill("Jane Booker");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="date"]').fill("2026-12-01");
    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: "Send Enquiry", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible();
    expect(requestBody).toMatchObject({
      name: "Jane Booker",
      email: "jane@example.com",
      eventDate: "2026-12-01",
      website: "",
      bookings: [{ timingMode: "duration", durationMinutes: "60" }],
    });
    expect(requestBody).not.toHaveProperty("_subject");
  });
});
