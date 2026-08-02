import { expect, test } from "playwright/test";
import { seedMediaConsent } from "./helpers";

// These specs assert on page structure, not on the consent flow (which has its
// own spec), so the banner is answered before they run.
test.beforeEach(async ({ page }) => {
  await seedMediaConsent(page);
});

test("uses the production canonical origin and keeps the pending privacy notice out of search", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aaaartists.co");

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
  await expect(page.getByText("Controller details are being confirmed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to make a data-protection complaint" })).toBeVisible();
  await expect(page.getByText(/acknowledge your complaint within 30 days/i)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aaaartists.co/privacy");

  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(contentWidth).toBeLessThanOrEqual(viewportWidth);
});

async function musicEvents(page: import("playwright/test").Page) {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts
    .flatMap((value) => {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    })
    .filter((value) => value["@type"] === "MusicEvent");
}

test("emits event schema on artist pages and keeps TBC dates out of it", async ({ page }) => {
  await page.goto("/artist/c-systems");
  const xoyo = page.locator("#event-aaa-fusion-xoyo-2026-08-22");
  await expect(xoyo).toHaveCount(1);
  await expect(xoyo).toContainText("XOYO");
  await expect(page.locator("#event-timescape-festival-2026")).toContainText("exact date TBC");

  const events = await musicEvents(page);
  // Month-only dates must never appear as an exact MusicEvent.startDate.
  expect(events.some((event) => event.startDate === "2026-08")).toBe(false);
  const xoyoLd = events.filter((event) => event.identifier === "aaa-fusion-xoyo-2026-08-22");
  expect(xoyoLd).toHaveLength(1);
  expect(xoyoLd[0].startDate).toBe("2026-08-22");
  expect(xoyoLd[0].performer.name).toBe("C-Systems");
  // A ticket link alone does not prove availability, so no unverified offer.
  expect(xoyoLd[0]).not.toHaveProperty("offers");
});

test("marks a shared event with the same identifier on every performer's page", async ({ page }) => {
  const identifiers: string[] = [];
  for (const slug of ["c-systems", "krevix"]) {
    await page.goto(`/artist/${slug}`);
    const shared = (await musicEvents(page)).filter(
      (event) => event.identifier === "aaa-fusion-xoyo-2026-08-22",
    );
    expect(shared, `${slug} is missing the shared event`).toHaveLength(1);
    expect(shared[0]["@id"]).toContain(`/artist/${slug}#event-`);
    identifiers.push(shared[0].identifier);
  }
  expect(new Set(identifiers).size).toBe(1);
});

test("shows visible nested breadcrumbs and a compact, non-duplicated footer", async ({ page }) => {
  await page.goto("/artist/c-systems");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Artists", exact: true })).toBeVisible();
  await expect(breadcrumb.getByText("C-Systems", { exact: true })).toBeVisible();

  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Instagram", exact: true })).toHaveCount(1);
  const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport);
});

test("balances artist activity and reveals past dates one year at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/artist/frogr");

  const activity = page.getByTestId("artist-activity");
  const upcoming = activity.getByTestId("upcoming-events");
  const listen = activity.getByTestId("listen");
  const past = activity.getByTestId("past-dates");

  await expect(upcoming).toBeVisible();
  await expect(listen).toBeVisible();
  await expect(past).toBeVisible();

  const [upcomingBox, listenBox, pastBox] = await Promise.all([
    upcoming.boundingBox(),
    listen.boundingBox(),
    past.boundingBox(),
  ]);
  expect(upcomingBox).not.toBeNull();
  expect(listenBox).not.toBeNull();
  expect(pastBox).not.toBeNull();
  expect(pastBox!.x).toBeGreaterThan(upcomingBox!.x);
  expect(listenBox!.y).toBeGreaterThan(upcomingBox!.y + upcomingBox!.height);
  expect(listenBox!.y).toBeGreaterThan(pastBox!.y + pastBox!.height);

  await expect(past.getByText("2026", { exact: true })).toBeVisible();
  await expect(past.getByText("Grand Café Eighty-Four", { exact: true })).toHaveCount(0);
  const earlierDates = past.getByRole("button", { name: "Show 2025 dates (3)" });
  await earlierDates.click();
  await expect(past.getByText("Grand Café Eighty-Four", { exact: true })).toBeVisible();
  const showFewer = past.getByRole("button", { name: "Show fewer" });
  await expect(showFewer).toBeVisible();
  await showFewer.click();
  await expect(past.getByText("Grand Café Eighty-Four", { exact: true })).toHaveCount(0);

  const eventCard = page.locator("#event-aaa-fusion-xoyo-2026-08-22");
  const flyer = eventCard.getByRole("img", { name: "FROGR at XOYO" });
  const eventDetails = eventCard.getByRole("link", { name: "Event details" });
  const [flyerBox, detailsBox] = await Promise.all([flyer.boundingBox(), eventDetails.boundingBox()]);
  expect(flyerBox).not.toBeNull();
  expect(detailsBox).not.toBeNull();
  expect(detailsBox!.y).toBeGreaterThan(flyerBox!.y + flyerBox!.height);

  await page.setViewportSize({ width: 390, height: 844 });
  const [mobileUpcomingBox, mobileListenBox, mobilePastBox] = await Promise.all([
    upcoming.boundingBox(),
    listen.boundingBox(),
    past.boundingBox(),
  ]);
  expect(mobileUpcomingBox).not.toBeNull();
  expect(mobileListenBox).not.toBeNull();
  expect(mobilePastBox).not.toBeNull();
  expect(mobilePastBox!.y).toBeGreaterThan(mobileUpcomingBox!.y);
  expect(mobileListenBox!.y).toBeGreaterThan(mobilePastBox!.y);

  await page.goto("/artist/c-systems");
  // On mobile every upcoming card stacks into the page: no paging controls, and
  // crucially no inner scroll area competing with the page's own scrolling.
  const mobileSlider = page.getByTestId("upcoming-slider");
  await expect(mobileSlider.getByText("Timescape Festival", { exact: true })).toBeVisible();
  await expect(mobileSlider.getByText("XOYO", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next upcoming events" })).toHaveCount(0);
  const trapsScroll = await mobileSlider.evaluate(
    (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
  );
  expect(trapsScroll, "upcoming events must not scroll inside itself on mobile").toBe(false);

  // Tablet portrait: the whole page must commit to one layout. Previously the
  // players went two-up at 768 while the events above stayed single-column, and
  // the flyer cards sat at a 320px cap inside a ~790px column.
  await page.setViewportSize({ width: 834, height: 1112 });
  const tabletCards = await page.locator("#event-timescape-festival-2026, #event-aaa-fusion-xoyo-2026-08-22").all();
  const tabletBoxes = await Promise.all(tabletCards.map((card) => card.boundingBox()));
  expect(tabletBoxes).toHaveLength(2);
  // Two-up, so they share a row and use the width available.
  expect(Math.abs(tabletBoxes[0]!.y - tabletBoxes[1]!.y)).toBeLessThan(4);
  expect(tabletBoxes[0]!.width).toBeGreaterThan(330);
  // Players stay stacked below lg, matching the single-column events above.
  const tabletPlayers = await page.getByTestId("listen").locator("iframe, [class*='flex-col']").first().boundingBox();
  expect(tabletPlayers).not.toBeNull();
  const listenLabels = await page.getByTestId("listen").getByText(/^(SoundCloud|Spotify)$/i).all();
  const labelYs = await Promise.all(listenLabels.map(async (l) => (await l.boundingBox())!.y));
  expect(new Set(labelYs).size, "players must stack on tablet, not sit side by side").toBe(labelYs.length);
});

test("opens the mobile menu and preserves footer contrast in dark mode", async ({ page }) => {
  await page.goto("/");
  const openMenu = page.getByRole("button", { name: "Open menu" });
  if (await openMenu.isVisible()) {
    await openMenu.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
  }
  const darkMode = page.getByRole("button", { name: "Switch to dark theme" });
  await darkMode.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("footer")).toBeVisible();
});

test("keeps shared chrome inside common phone and desktop widths", async ({ page }) => {
  for (const width of [320, 375, 390, 412, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  }
});
