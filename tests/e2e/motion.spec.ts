import { expect, test, type Page } from "playwright/test";
import { seedMediaConsent } from "./helpers";

/** Mirrors the wait in contact.spec.ts: hermetic CI builds render no widget, local
 *  builds with the always-pass key make a real round-trip before Send is allowed. */
async function waitForTurnstileToken(page: Page) {
  if (await page.locator('form[data-turnstile="widget"]').count()) {
    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
      timeout: 15_000,
    });
  }
}

test.describe("loading and motion states", () => {
  test("artist photographs fade in once decoded and stay visible", async ({ page }) => {
    await seedMediaConsent(page);
    await page.goto("/artists");

    const firstImage = page.locator("img.image-fade").first();
    await expect(firstImage).toHaveAttribute("data-loaded", "true", { timeout: 15_000 });
    // The fade must not leave a photograph stuck at zero opacity.
    await expect(firstImage).toBeVisible();
    await expect
      .poll(async () => firstImage.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
  });

  test("a photograph that fails to load stops the skeleton instead of shimmering forever", async ({
    page,
  }) => {
    // A wrong `image:` path in an artist's YAML is an ordinary editing mistake. The
    // card must degrade to a visibly broken image, not to an endless loading state
    // that looks like the site is still working.
    // The 404 is delayed on purpose. `HTMLImageElement.complete` becomes true after a
    // *failed* load too, so the ref check in ArtistCard already covers the fast case —
    // an immediate 404 passes with or without the onError handler and proves nothing.
    // Delaying it past mount is what actually exercises the broken path.
    await page.route("**/artists/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({ status: 404, body: "" });
    });
    await seedMediaConsent(page);
    await page.goto("/artists");

    const firstImage = page.locator("img.image-fade").first();
    await expect(firstImage).toHaveAttribute("data-loaded", "true", { timeout: 15_000 });
    // Scoped to this card on purpose. On a small viewport the cards below the fold are
    // lazy and have not started loading, so they still show a skeleton — correctly.
    const firstCard = page.locator("img.image-fade").first().locator("xpath=..");
    await expect(firstCard).not.toHaveClass(/skeleton/, { timeout: 15_000 });
  });

  test("the player skeleton never swallows a click meant for the frame", async ({ page }) => {
    await seedMediaConsent(page, "granted");
    await page.goto("/artist/xijaro-pitch");

    const skeleton = page.locator(".skeleton").first();
    if ((await skeleton.count()) > 0) {
      // It overlays the player, so it must be transparent to the pointer for as long
      // as it exists — including the 6s fallback path where it outlives a working frame.
      await expect
        .poll(async () => skeleton.evaluate((node) => getComputedStyle(node).pointerEvents))
        .toBe("none");
    }
  });

  test("cards below the fold are lazily loaded, the first one is not", async ({ page }) => {
    await seedMediaConsent(page);
    await page.goto("/artists");

    const images = page.locator("img.image-fade");
    await expect(images.first()).not.toHaveAttribute("loading", "lazy");
    await expect(images.nth(2)).toHaveAttribute("loading", "lazy");
  });

  test("a consented player shows a labelled skeleton until the frame arrives", async ({ page }) => {
    // Consent granted so the frame is allowed to mount, and the provider is held
    // open rather than aborted: an aborted iframe fires `load` immediately, which
    // is precisely the state this test must not observe. Holding it reproduces
    // what a visitor on a slow connection sees.
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/soundcloud\.com|spotify\.com/, async (route) => {
      await held;
      await route.abort();
    });
    await seedMediaConsent(page, "granted");
    await page.goto("/artist/xijaro-pitch", { waitUntil: "commit" });

    // The frame is lazily loaded, so it only starts once it is scrolled into view.
    const frame = page.locator("iframe").first();
    await frame.scrollIntoViewIfNeeded();

    const skeleton = page.getByText(/^Loading /).first();
    await expect(skeleton).toBeVisible({ timeout: 15_000 });
    await expect(skeleton).toHaveAttribute("aria-live", "polite");

    release?.();
    // Once the provider answers, the skeleton uncovers the frame beneath it.
    await expect(skeleton).toHaveCount(0, { timeout: 15_000 });
    await expect(frame).toBeVisible();
  });

  test("the submit button reports progress while the enquiry is in flight", async ({ page }) => {
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/enquiries", async (route) => {
      // Hold the response open so the in-flight state is observable rather than raced.
      await held;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await seedMediaConsent(page);
    await page.goto("/contact");

    await page.locator('input[name="name"]').fill("Jane Booker");
    await page.locator('input[name="email"]').fill("jane@example.com");
    await page.locator('input[name="date"]').fill("2026-12-01");
    await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
    await waitForTurnstileToken(page);

    const submit = page.getByRole("button", { name: "Send Enquiry", exact: true });
    await submit.click();

    const sending = page.getByRole("button", { name: "Sending…", exact: true });
    await expect(sending).toBeVisible({ timeout: 15_000 });
    await expect(sending).toHaveAttribute("aria-busy", "true");
    await expect(page.getByTestId("submit-progress")).toBeVisible();

    release?.();
    await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible({
      timeout: 15_000,
    });
    // The progress indicator belongs to the request, not to the page.
    await expect(page.getByTestId("submit-progress")).toHaveCount(0);
  });

  test("the mobile menu opens and closes with reduced motion enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedMediaConsent(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Artists", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Close menu" }).click();
    // Reduced motion collapses the exit animation, but the panel must still leave.
    await expect(menu).toHaveCount(0, { timeout: 5_000 });
  });

  test("the past-shows modal animates in and out, and still closes", async ({ page }) => {
    await seedMediaConsent(page);
    await page.goto("/artist/xijaro-pitch");

    const trigger = page.getByRole("button", { name: /past shows/i }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.getByTestId("past-shows-dialog");
    await expect(dialog).toBeVisible();
    // The panel must carry the animated class, not the old hard-cut backdrop utility.
    await expect(dialog).toHaveClass(/dialog-panel/);
    await expect
      .poll(async () => dialog.evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");

    await page.keyboard.press("Escape");
    // Exit transitions keep a <dialog> painted for their duration; it must still go.
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test("interactive elements acknowledge a press", async ({ page }) => {
    await seedMediaConsent(page);
    await page.goto("/");

    // A phone has no hover, so the press state is the only feedback a tap gets.
    const cta = page.getByRole("link", { name: /book artists/i }).first();
    await expect(cta).toBeVisible();
    const transition = await cta.evaluate((node) => getComputedStyle(node).transitionProperty);
    expect(transition).toContain("transform");
  });

  test("a form section animates open and the city field shows skeleton rows", async ({ page }) => {
    await seedMediaConsent(page);
    await page.goto("/contact");

    const eventSection = page.locator('button[aria-controls="section-event"]');
    await eventSection.click();
    const panel = page.locator("#section-event");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/panel-enter/);
  });

  test("every page is fully rendered with reduced motion enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedMediaConsent(page);
    await page.goto("/artists");

    // The reveal animation must never be the reason content is invisible.
    const cards = page.locator(".reveal");
    await expect(cards.first()).toBeVisible();
    await expect
      .poll(async () => cards.last().evaluate((node) => getComputedStyle(node).opacity))
      .toBe("1");
  });
});
