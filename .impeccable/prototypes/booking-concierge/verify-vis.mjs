import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const baseUrl = "http://127.0.0.1:3101/?engine=vis";
const reviewPath = (filename) => fileURLToPath(new URL(`../../review/${filename}`, import.meta.url));

async function openPrototype(viewport, theme = "dark") {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("aaa-booking-prototype-theme", selectedTheme);
  }, theme);
  await page.goto(baseUrl);
  return { context, page, consoleErrors };
}

async function openTimings(page, stages = "2") {
  await page.locator('[data-action="go-step"][data-step="1"]').click();
  await page.locator('input[name="timeMode"][value="confirmed"]').check();
  await page.locator('input[data-bind="event.start"]').fill("21:00");
  await page.locator('input[data-bind="event.end"]').fill("02:00");
  await page.locator('select[data-bind="event.roomsStages"]').selectOption(stages);
  await page.locator('[data-action="next"]').click();
  await page.getByRole("heading", { name: "Plan the night" }).waitFor();
  await page.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  await page.locator("#visTimeline .vis-loading-screen").waitFor({ state: "detached" });
  await page.locator("#visTimeline .vis-grid.vis-minor").nth(19).waitFor({ state: "attached" });
}

async function waitForTimelineCounts(page, { stages, items }) {
  await page.waitForTimeout(100);
  await page.waitForFunction(
    ({ expectedStages, expectedItems }) =>
      document.querySelectorAll("#visTimeline [data-stage-name]").length === expectedStages &&
      document.querySelectorAll("#visTimeline .vis-item.vis-range").length === expectedItems &&
      document.querySelectorAll("#visTimeline .vis-grid.vis-minor").length > 0 &&
      getComputedStyle(document.querySelector("#visTimeline .vis-timeline")).visibility === "visible",
    { expectedStages: stages, expectedItems: items }
  );
}

{
  const { context, page, consoleErrors } = await openPrototype({ width: 1280, height: 900 });
  await openTimings(page);
  assert.equal(await page.locator("#visTimeline [data-stage-name]").count(), 2);
  assert.equal(await page.locator("#visTimeline .vis-new-stage-label").count(), 1);
  assert.equal(
    await page.locator("#visTimeline .vis-item.vis-range").count(),
    2,
    `Console errors: ${consoleErrors.join(" | ") || "none"}`
  );
  const minorGridCount = await page.locator("#visTimeline .vis-grid.vis-minor").count();
  assert.ok(minorGridCount >= 20, `Expected at least 20 quarter-hour grid lines, found ${minorGridCount}`);
  assert.equal(await page.locator("#visTimeline .vis-item.vis-selected").count(), 1);
  assert.equal(await page.locator(".engine-chip").innerText(), "VIS-TIMELINE SPIKE");
  assert.equal(await page.locator(".timing-inspector").count(), 0);
  assert.equal(await page.getByRole("button", { name: /reset suggestion/i }).count(), 0);
  assert.equal(await page.locator('[data-action="set-timeline-grid"]').count(), 3);
  assert.equal(await page.locator('[data-action="set-timeline-grid"][aria-pressed="true"]').innerText(), "15m");
  assert.equal(await page.locator('[data-action="begin-add-timing-artist"]').count(), 1);
  assert.equal(await page.locator('#visTimeline [data-action="begin-add-timing-artist"]').count(), 0);
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);

  await page.locator("#visTimeline .vis-timeline").evaluate((element) => {
    element.dataset.instanceMarker = "persistent-timeline";
  });

  await page.locator('[data-agenda-bind="start"]').fill("20:00");
  await page.locator('[data-agenda-bind="duration"]').selectOption("300");
  assert.equal(await page.locator(".timeline-toolbar-readout strong").innerText(), "01:00");
  await page.locator('[data-action="set-timeline-grid"][data-step="30"]').click();
  await page.waitForFunction(() => {
    const count = document.querySelectorAll("#visTimeline .vis-grid.vis-minor").length;
    return count >= 10 && count < 20;
  });
  const halfHourGridCount = await page.locator("#visTimeline .vis-grid.vis-minor").count();
  assert.ok(halfHourGridCount >= 10 && halfHourGridCount < minorGridCount);
  assert.equal(
    await page.locator('#visTimeline .vis-timeline[data-instance-marker="persistent-timeline"]').count(),
    1,
    "Changing snap interval remounted the timeline"
  );

  const timelineWidthBeforeComposer = (await page.locator("#visTimeline").boundingBox()).width;
  await page.locator('[data-action="begin-add-timing-artist"]').click();
  await page.locator(".timing-inline-panel .timing-composer").waitFor();
  const timelineWidthWithComposer = (await page.locator("#visTimeline").boundingBox()).width;
  assert.ok(Math.abs(timelineWidthBeforeComposer - timelineWidthWithComposer) <= 1);
  assert.equal(
    await page.locator('#visTimeline .vis-timeline[data-instance-marker="persistent-timeline"]').count(),
    1,
    "Opening Add artist remounted the timeline"
  );

  await page.locator('select[data-composer-bind="artist"]').selectOption("Mr B");
  await page.locator('select[data-composer-bind="role"]').selectOption("Closing");
  await page.locator('select[data-composer-bind="stageIndex"]').selectOption("1");
  await page.locator('[data-action="confirm-add-timing-artist"]').click();
  await waitForTimelineCounts(page, { stages: 2, items: 3 });
  await page.locator(".timing-inline-editor:not(.timing-composer)").waitFor();
  assert.equal(await page.locator("#visTimeline .vis-item.vis-range").count(), 3);
  assert.equal(
    await page.locator('#visTimeline .vis-timeline[data-instance-marker="persistent-timeline"]').count(),
    1,
    "Adding an artist remounted the timeline"
  );
  await page.locator('[data-action="undo-timeline"]').click();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });
  assert.equal(await page.locator("#visTimeline .vis-item.vis-range").count(), 2);

  const firstArtistItem = page.locator('#visTimeline .vis-item:has([data-vis-slot-id="1"])');
  await firstArtistItem.click();
  await page.locator(".timing-inline-editor:not(.timing-composer)").waitFor();
  assert.equal(await page.locator(".timing-inspector").count(), 0);
  await page.locator('[data-action="close-timing-quick"]').click();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });

  const stageColors = await page.locator("#visTimeline [data-stage-name]").evaluateAll((inputs) =>
    inputs.map((input) => getComputedStyle(input.closest(".vis-label")).boxShadow)
  );
  assert.notEqual(stageColors[0], stageColors[1]);

  const draggableItem = page.locator('#visTimeline .vis-item:has([data-vis-slot-id="1"])');
  await draggableItem.locator(".vis-drag-center").waitFor();
  const itemBox = await draggableItem.boundingBox();
  const gridXs = await page.locator("#visTimeline .vis-grid.vis-minor").evaluateAll((grids) =>
    [...new Set(grids.map((grid) => Math.round(grid.getBoundingClientRect().x)))].sort((a, b) => a - b)
  );
  assert.ok(itemBox && gridXs.length >= 2);
  const gridPixels = gridXs[1] - gridXs[0];
  const moveStart = { x: itemBox.x + itemBox.width / 2, y: itemBox.y + itemBox.height / 2 };
  await page.mouse.move(moveStart.x, moveStart.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.move(moveStart.x + 8, moveStart.y, { steps: 2 });
  await page.mouse.move(moveStart.x + gridPixels * 2.5, moveStart.y, { steps: 14 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(120);
  await page
    .locator('[data-vis-slot-id="1"]')
    .filter({ hasText: /20:30–22:00|21:00–22:30/ })
    .waitFor();
  const movedTiming = await page.locator('[data-vis-slot-id="1"]').innerText();
  assert.doesNotMatch(movedTiming, /20:00–21:30/);
  assert.match(movedTiming, /(?:20:30–22:00|21:00–22:30) · 90 min/);

  await page.locator('[data-action="close-timing-quick"]').click();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });
  const itemForStageDrop = page.locator('#visTimeline .vis-item:has([data-vis-slot-id="1"])');
  await itemForStageDrop.locator(".vis-drag-center").waitFor();
  const itemForStageDropBox = await itemForStageDrop.boundingBox();
  const newStageBox = await page
    .locator("#visTimeline .vis-foreground > .vis-group.vis-new-stage-group")
    .boundingBox();
  assert.ok(itemForStageDropBox && newStageBox && newStageBox.height >= 40);
  const stageDropStart = {
    x: itemForStageDropBox.x + itemForStageDropBox.width / 2,
    y: itemForStageDropBox.y + itemForStageDropBox.height / 2,
  };
  await page.mouse.move(stageDropStart.x, stageDropStart.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
   await page.mouse.move(stageDropStart.x, stageDropStart.y + 16, { steps: 2 });
  await page.mouse.move(stageDropStart.x, newStageBox.y + newStageBox.height * 0.7, { steps: 16 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });
  assert.match(await page.locator(".timeline-notice").innerText(), /Stage \d+ created.*Stage \d+ removed/i);
  const stageNames = await page.locator("#visTimeline [data-stage-name]").evaluateAll((inputs) =>
    inputs.map((input) => input.value)
  );
  assert.equal(new Set(stageNames).size, stageNames.length, "A generated stage name was repeated");
  assert.equal(stageNames[0], "Stage 1");
  await page.locator('[data-action="close-timing-quick"]').click();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: reviewPath("prototype-timings-vis-desktop-dark.png"),
    fullPage: true,
  });
  await page.locator("#themeToggle").click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("#visTimeline .vis-text.vis-minor")].some(
      (label) => label.textContent === "01:00"
    )
  );
  await page.screenshot({
    path: reviewPath("prototype-timings-vis-desktop-light.png"),
    fullPage: true,
  });
  assert.deepEqual(consoleErrors, []);
  await context.close();
}

{
  const { context, page, consoleErrors } = await openPrototype({ width: 820, height: 900 });
  await openTimings(page);
  assert.equal(await page.locator(".timing-inspector").count(), 0);
  const timelineWidthBeforeComposer = (await page.locator("#visTimeline").boundingBox()).width;
  await page.locator("#visTimeline .vis-timeline").evaluate((element) => {
    element.dataset.instanceMarker = "tablet-timeline";
  });
  await page.locator('[data-action="begin-add-timing-artist"]').click();
  const composer = page.locator(".timing-inline-panel .timing-composer");
  await composer.waitFor();
  await waitForTimelineCounts(page, { stages: 2, items: 2 });
  assert.notEqual(await composer.evaluate((element) => getComputedStyle(element).position), "fixed");
  const timelineWidthWithComposer = (await page.locator("#visTimeline").boundingBox()).width;
  assert.ok(Math.abs(timelineWidthBeforeComposer - timelineWidthWithComposer) <= 1);
  assert.equal(await page.locator('#visTimeline .vis-timeline[data-instance-marker="tablet-timeline"]').count(), 1);
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await page.screenshot({
    path: reviewPath("prototype-timings-vis-tablet-dark.png"),
    fullPage: true,
  });
  assert.deepEqual(consoleErrors, []);
  await context.close();
}

{
  const { context, page, consoleErrors } = await openPrototype({ width: 390, height: 844 });
  await page.locator('[data-action="go-step"][data-step="2"]').click();
  await page.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  assert.equal(await page.locator("#visTimeline").count(), 0);
  assert.equal(await page.locator(".agenda-mobile").count(), 1);
  assert.equal(await page.locator(".engine-chip").innerText(), "MOBILE FALLBACK");
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await page.screenshot({
    path: reviewPath("prototype-timings-vis-mobile-dark.png"),
    fullPage: true,
  });
  assert.deepEqual(consoleErrors, []);
  await context.close();
}

await browser.close();
console.log("vis-timeline prototype verification passed.");
