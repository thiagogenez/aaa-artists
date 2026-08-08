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

test("pairs upcoming dates with the player in one row and keeps past shows behind a dialog", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  // FROGR is the sparse case the layout exists for: two dates, one player.
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
  // Dates and media sit side by side, tops level; past shows drop below both.
  expect(listenBox!.x).toBeGreaterThan(upcomingBox!.x + upcomingBox!.width - 4);
  expect(Math.abs(listenBox!.y - upcomingBox!.y)).toBeLessThan(4);
  expect(pastBox!.y).toBeGreaterThan(upcomingBox!.y + upcomingBox!.height - 4);
  expect(Math.abs(pastBox!.x - upcomingBox!.x)).toBeLessThan(4);
  // The player takes whatever the flyer track leaves, so the row is full.
  expect(upcomingBox!.width + listenBox!.width).toBeGreaterThan(1150);

  // The point of the row: the player ends level with the flyers rather than
  // leaving a short column beside them.
  const [cardBox, playerBox] = await Promise.all([
    page.locator("#event-aaa-fusion-xoyo-2026-08-22").boundingBox(),
    page.getByTestId("media-player").boundingBox(),
  ]);
  expect(Math.abs((playerBox!.y + playerBox!.height) - (cardBox!.y + cardBox!.height))).toBeLessThan(8);

  // History stays reachable, but only on request.
  // A closed <dialog> keeps its content in the DOM, so this asserts on
  // visibility rather than presence.
  const dialog = page.getByTestId("past-shows-dialog");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Grand Café Eighty-Four", { exact: true })).toBeHidden();

  await page.getByTestId("past-shows-trigger").click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Grand Café Eighty-Four", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2025", { exact: true })).toBeVisible();

  // Tailwind's preflight zeroes the `margin: auto` a modal <dialog> relies on,
  // so centring has to be asserted, not assumed.
  const dialogBox = (await dialog.boundingBox())!;
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  }));
  expect(Math.abs(dialogBox.x + dialogBox.width / 2 - viewport.width / 2)).toBeLessThan(4);
  expect(Math.abs(dialogBox.y + dialogBox.height / 2 - viewport.height / 2)).toBeLessThan(4);

  // A native <dialog> must close on Escape without any extra wiring.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

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
  // The two-column row collapses: dates, then media, then past shows.
  expect(mobileListenBox!.y).toBeGreaterThan(mobileUpcomingBox!.y);
  expect(mobilePastBox!.y).toBeGreaterThan(mobileListenBox!.y);

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
  // C-Systems has both providers. Only one occupies the column at a time, so
  // the media side can never grow to twice the height of the dates beside it.
  await expect(page.getByTestId("media-player")).toHaveCount(1);
  const playerLabel = page.getByTestId("player-label");
  await expect(playerLabel).toContainText("SoundCloud");
  await expect(playerLabel).toContainText("1 of 2");
  await page.getByRole("button", { name: "Next player" }).click();
  await expect(playerLabel).toContainText("Spotify");
  await expect(playerLabel).toContainText("2 of 2");
  // Two items, so the arrows wrap rather than leaving one permanently dead.
  await page.getByRole("button", { name: "Next player" }).click();
  await expect(playerLabel).toContainText("SoundCloud");

  // A single-player artist gets no controls at all.
  await page.goto("/artist/frogr");
  await expect(page.getByTestId("player-label")).toContainText("SoundCloud");
  await expect(page.getByRole("button", { name: "Next player" })).toHaveCount(0);
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
