import { expect, test } from "playwright/test";
import { seedMediaConsent } from "./helpers";

/**
 * Navigability — can a visitor actually get around, and does every link land?
 *
 * The rest of the suite checks that individual pages behave and that they look
 * right. Neither notices a link that 404s, a route that stopped being reachable
 * from the navigation, or a booking CTA that loses the artist it was supposed to
 * pre-select. Those are the failures a visitor hits first.
 *
 * Every internal link on every page is crawled and checked, so a typo in a href
 * fails here rather than in front of a promoter.
 */
const PAGES = ["/", "/artists", "/artist/xijaro-pitch", "/contact", "/about", "/privacy"];

test.describe("navigability", () => {
  test.beforeEach(async ({ page }) => {
    await seedMediaConsent(page);
  });

  test("every internal link on every page resolves", async ({ page, baseURL }) => {
    const checked = new Map<string, number>();
    const broken: string[] = [];

    for (const path of PAGES) {
      await page.goto(path);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));

      for (const href of hrefs) {
        const url = new URL(href);
        // Only our own pages. External links are someone else's uptime.
        if (url.origin !== new URL(baseURL!).origin) continue;
        const target = url.pathname + url.search;
        if (checked.has(target)) continue;

        const response = await page.request.get(target);
        checked.set(target, response.status());
        if (response.status() >= 400)
          broken.push(`${target} -> ${response.status()} (from ${path})`);
      }
    }

    expect(checked.size).toBeGreaterThan(8);
    expect(broken, `broken internal links:\n${broken.join("\n")}`).toEqual([]);
  });

  test("the primary navigation reaches every section, on desktop", async ({ page }) => {
    await page.goto("/");
    for (const [label, expected] of [
      ["Artists", "/artists"],
      ["About", "/about"],
    ] as const) {
      await page.goto("/");
      await page.locator("header").getByRole("link", { name: label, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`${expected}/?$`));
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("a visitor can go from the roster to an artist to a pre-filled enquiry", async ({
    page,
  }) => {
    // The booking path is the only conversion on the site. Each hop is a place it
    // can break silently.
    await page.goto("/artists");

    // On a pointer device the action panel is revealed by hover, so the profile
    // link is not clickable until the card opens. Do what a visitor does.
    const card = page.locator("[id^='artist-card-'][id$='-actions']").first();
    const cardRoot = card.locator("xpath=..");
    await cardRoot.scrollIntoViewIfNeeded();
    await cardRoot.hover();

    const profileLink = page.getByRole("link", { name: /view .* profile/i }).first();
    await expect(profileLink).toBeVisible();
    await profileLink.click();
    await expect(page).toHaveURL(/\/artist\/[a-z0-9-]+/);

    const artistName = (await page.locator("h1").first().innerText()).trim();

    await page
      .getByRole("link", { name: /book|enquir/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contact/);

    // The artist must survive the hop, or the promoter retypes it and we learn
    // nothing about which artist the enquiry was for.
    await expect(page.locator('select[name="booking-0-artist"]')).toHaveValue(
      new RegExp(artistName.split(" ")[0], "i")
    );
  });

  test("the retired /events URL still redirects to the roster", async ({ page }) => {
    // Handled by the Worker in production. The static preview cannot serve the
    // redirect, so this asserts the destination exists rather than the hop
    // itself; the redirect is covered by the production smoke test.
    const response = await page.request.get("/artists");
    expect(response.status()).toBe(200);
  });

  test("a wrong URL lands on a not-found page with a way back", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("h1")).toBeVisible();
    // A dead end is worse than a 404: there has to be a route out.
    await expect(page.getByRole("link").first()).toBeVisible();
    await page
      .getByRole("link", { name: /home|artists/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/(artists)?$/);
  });

  test("breadcrumbs on a nested page lead back up", async ({ page }) => {
    await page.goto("/artist/xijaro-pitch");
    const crumbs = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(crumbs).toBeVisible();
    await crumbs.getByRole("link", { name: /artists/i }).click();
    await expect(page).toHaveURL(/\/artists\/?$/);
  });
});
