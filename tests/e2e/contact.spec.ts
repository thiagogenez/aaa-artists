import { expect, test, type Page } from "playwright/test";
import { seedMediaConsent } from "./helpers";

/** Waits for the Turnstile token before submitting, but only when the build
 *  actually renders a widget. Hermetic CI builds use the literal test-site-key
 *  (no widget, no token needed); local builds with the always-pass key make a
 *  real network round-trip that must finish before Send is clicked. The mode
 *  marker is baked into the prerendered form, so this check cannot race. */
async function waitForTurnstileToken(page: Page) {
  if (await page.locator('form[data-turnstile="widget"]').count()) {
    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
      timeout: 15_000,
    });
  }
}

test.describe("booking form regression coverage", () => {
  // The consent banner is a fixed bottom bar; answering it up front keeps it
  // from overlapping the form controls these tests click.
  test.beforeEach(async ({ page }) => {
    await seedMediaConsent(page);
  });

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
    await expect(suggestions).toHaveText(["@hotmail.co.uk", "@hotmail.com", "@hotmail.fr"]);

    await page.getByRole("button", { name: "+5 more", exact: true }).click();
    await expect(suggestions).toHaveCount(8);
    await page.locator('button[aria-label="Complete email as jane@hotmail.co.uk"]').click();
    await expect(emailInput).toHaveValue("jane@hotmail.co.uk");
    await expect(suggestions).toHaveCount(0);

    await context.close();
  });

  test("enhances the optional phone field only after visitor intent", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 500 } });
    const page = await context.newPage();
    await seedMediaConsent(page);
    await page.goto("/contact");

    const enhancement = page.locator('[data-phone-enhancement="pending"]');
    await expect(enhancement).toBeAttached();
    await expect(enhancement.locator(".aaa-phone-pending-country svg")).toBeVisible();

    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.focus();
    await expect(page.locator('[data-phone-enhancement="ready"]')).toBeAttached();
    await expect(phoneInput).toBeFocused();

    const countryButton = page.locator(".iti__selected-country");
    await expect(countryButton).toHaveAttribute("aria-label", "Select country for phone number");
    await expect(countryButton.locator(".iti__selected-dial-code")).toHaveText("");
    await expect(countryButton.locator(".iti__globe-svg")).toBeVisible();
    await countryButton.click();
    await expect(page.locator(".iti__country").first()).toContainText("Afghanistan");
    await expect(page.locator(".iti__country").first()).toContainText("+93");

    await context.close();
  });

  test("keeps the optional phone input usable if enhancement loading fails", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await page.route("**/_next/static/chunks/*.js", (route) => route.abort());

    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.focus();
    await expect(page.locator('[data-phone-enhancement="fallback"]')).toBeAttached();
    await phoneInput.fill("+44 7400 123456");
    await phoneInput.blur();
    await expect(page.getByText("Enter a valid international phone number")).toHaveCount(0);
  });

  test("keeps WhatsApp usernames clean while showing the fixed @ prefix", async ({ page }) => {
    await page.goto("/contact");

    await page
      .locator('input[name="whatsapp-contact-method"][value="username"]')
      .check({ force: true });
    const usernameInput = page.locator('input[name="whatsappUsername"]');
    await usernameInput.fill("@aaa-booking");

    await expect(usernameInput).toHaveValue("aaa-booking");
    await expect(usernameInput.locator("xpath=..")).toContainText("@");
    await expect(page.locator('input[name="whatsappUsernameKey"]')).toHaveCount(0);
  });

  test("collapses completed artist cards and calculates exact timing", async ({ page }) => {
    await page.goto("/contact");

    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: "Add another artist", exact: true }).click();

    const firstArtistToggle = page.locator('button[aria-controls="artist-booking-0"]');
    const secondArtistToggle = page.locator('button[aria-controls="artist-booking-1"]');
    await expect(firstArtistToggle).toHaveAttribute("aria-expanded", "false");
    await expect(secondArtistToggle).toHaveAttribute("aria-expanded", "true");

    await page.locator('select[name="booking-1-artist"]').selectOption({ index: 2 });
    await page.locator('input[name="booking-1-timing-mode"][value="times"]').check();
    await page.locator('input[name="booking-1-start"]').fill("22:30");
    await page.locator('input[name="booking-1-finish"]').fill("00:00");
    await expect(page.getByRole("status").filter({ hasText: "1 hour 30 minutes" })).toBeVisible();
  });

  test("uses EUR by default and submits an artist discussion without a booking", async ({
    page,
  }) => {
    let requestBody: Record<string, unknown> | undefined;
    await page.route("**/api/enquiries", async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/contact");

    await page.locator('button[aria-controls="section-budget"]').click();
    await expect(page.locator('select[name="currency"]')).toHaveValue("EUR");
    await expect(page.locator('select[name="currency"] option').first()).toHaveAttribute(
      "value",
      "EUR"
    );
    await expect(page.getByRole("option", { name: "Open to suggestions" })).toHaveCount(0);

    const firstArtist = page.locator('select[name="booking-0-artist"]');
    await firstArtist.selectOption({ index: 1 });
    const discuss = page.getByRole("checkbox", { name: /Contact me to discuss/ });
    await discuss.check();
    await expect(page.locator('select[name^="booking-"][name$="-artist"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Add another artist" })).toBeHidden();

    await discuss.uncheck();
    await expect(firstArtist).toHaveValue("");
    await discuss.check();
    await page.locator('input[name="name"]').fill("Jane Booker");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="date"]').fill("2026-12-01");
    await waitForTurnstileToken(page);
    await page.getByRole("button", { name: "Send Enquiry", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible({
      timeout: 15_000,
    });
    expect(requestBody).toMatchObject({
      contactToDiscuss: true,
      bookings: [],
      currency: "EUR",
    });
  });

  test("loads local city suggestions and still accepts free text", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('button[aria-controls="section-event"]').click();

    const countryInput = page.locator('input[name="country"]');
    await countryInput.fill("Brazil");
    await countryInput.press("Enter");
    await expect(countryInput.locator("xpath=..").locator(".iti__br")).toBeVisible();

    const cityInput = page.locator('input[name="city"]');
    await expect(cityInput).toBeEnabled();
    await cityInput.fill("Sao Paulo");
    await expect(
      page.getByRole("option", { name: "Sao Paulo", exact: true }).first()
    ).toBeVisible();

    await cityInput.fill("My small town");
    await expect(cityInput).toHaveValue("My small town");
  });

  test("submits structured enquiry data through the first-party API", async ({ page }) => {
    let requestBody: Record<string, unknown> | undefined;
    await page.route("**/api/enquiries", async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/contact");

    await page.locator('input[name="name"]').fill("Jane Booker");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="date"]').fill("2026-12-01");
    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    // Submitting before the widget's token arrives is refused client-side, so
    // wait for the token like a real visitor effectively does.
    await waitForTurnstileToken(page);
    await page.getByRole("button", { name: "Send Enquiry", exact: true }).click();

    // Mobile WebKit on busy CI runners regularly needs more than the global 5s
    // expectation window here (twice killed scheduled deploys); the submit
    // round-trip is mocked, so a generous timeout costs nothing when healthy.
    await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible({
      timeout: 15_000,
    });
    expect(requestBody).toMatchObject({
      name: "Jane Booker",
      email: "jane@example.com",
      eventDate: "2026-12-01",
      website: "",
      contactToDiscuss: false,
      bookings: [{ timingMode: "duration", durationMinutes: "60" }],
      currency: "EUR",
    });
    expect(requestBody?.submissionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(requestBody).not.toHaveProperty("startedAt");
    expect(requestBody).not.toHaveProperty("whatsappUsernameKey");
    expect(requestBody).not.toHaveProperty("_subject");
  });

  test("preserves an in-progress draft across navigation until reset or submit", async ({
    page,
  }) => {
    const storedDraft = () =>
      page.evaluate(() => window.sessionStorage.getItem("aaa-booking-draft-v1"));
    await page.goto("/contact");
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill("Jane Draft");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await expect.poll(storedDraft).not.toBeNull();

    // Navigate away and back: the draft is restored.
    await page.goto("/privacy");
    await page.goto("/contact");
    await expect(nameInput).toHaveValue("Jane Draft");
    await expect(page.locator('input[name="email"]')).toHaveValue("jane@example.com");

    // A booking link with prefill parameters starts a fresh enquiry instead,
    // without destroying the stored draft.
    await page.goto("/contact?artist=Krevix");
    await expect(page.locator('select[name="booking-0-artist"]')).toHaveValue("Krevix");
    await expect(nameInput).toHaveValue("");
    await page.goto("/contact");
    await expect(nameInput).toHaveValue("Jane Draft");

    // Clearing the form removes the draft permanently.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear form", exact: true }).click();
    await expect(nameInput).toHaveValue("");
    await expect.poll(storedDraft).toBeNull();
    await page.goto("/privacy");
    await page.goto("/contact");
    await expect(nameInput).toHaveValue("");
  });

  test("clears the stored draft after a successful submission", async ({ page }) => {
    await page.route("**/api/enquiries", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/contact");
    await page.locator('input[name="name"]').fill("Jane Booker");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="date"]').fill("2026-12-01");
    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem("aaa-booking-draft-v1")))
      .not.toBeNull();

    // Same Turnstile token wait as the submit test above: never race the widget.
    await waitForTurnstileToken(page);
    await page.getByRole("button", { name: "Send Enquiry", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(() => page.evaluate(() => window.sessionStorage.getItem("aaa-booking-draft-v1")))
      .toBeNull();
  });

  test("associates email errors and suggestions with the input", async ({ page }) => {
    await page.goto("/contact");
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill("jane@hotmail.");
    await emailInput.blur();

    const describedBy = await emailInput.getAttribute("aria-describedby");
    const ids = describedBy?.split(/\s+/).filter(Boolean) ?? [];
    expect(ids).toHaveLength(2);
    for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  });
});
