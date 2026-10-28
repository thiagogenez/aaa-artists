import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const baseUrl = "http://127.0.0.1:3101";

async function openPrototype(viewport, theme) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("aaa-booking-prototype-theme", selectedTheme);
  }, theme);
  await page.goto(baseUrl);
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }`,
  });
  return { context, page };
}

async function dragVerticalSlot(page, slotId, target) {
  const source = page.locator(`.vertical-timeline-block[data-slot-id="${slotId}"] .vertical-block-main`);
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  assert.ok(sourceBox && targetBox);
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, sourceBox.y + sourceBox.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
}

for (const capture of [
  { name: "prototype-desktop-dark", width: 1536, height: 1024, theme: "dark" },
  { name: "prototype-desktop-light", width: 1536, height: 1024, theme: "light" },
  { name: "prototype-mobile-dark", width: 390, height: 844, theme: "dark" },
  { name: "prototype-mobile-light", width: 390, height: 844, theme: "light" },
]) {
  const { context, page } = await openPrototype(
    { width: capture.width, height: capture.height },
    capture.theme
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.impeccable/review/${capture.name}.png`,
    fullPage: true,
  });
  if (capture.name === "prototype-desktop-dark") {
    await page.screenshot({ path: ".impeccable/review/hero-repro.png" });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 0, `${capture.name} overflows horizontally by ${overflow}px`);
  assert.equal(await page.locator(".dock-summary").count(), 0);
  assert.equal(await page.locator(".slot-editor > .panel-header").count(), 1);
  const activeStepSurface = await page
    .locator('.step-button[aria-current="step"]')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const inactiveStepSurface = await page
    .locator('.step-button:not([aria-current="step"])')
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  assert.notEqual(activeStepSurface, inactiveStepSurface);
  const panelHeaderSurface = await page
    .locator(".panel-header")
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const panelSurface = await page
    .locator(".panel")
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  assert.notEqual(panelHeaderSurface, panelSurface);
  const [backBox, nextBox] = await Promise.all([
    page.locator('.dock-actions [data-action="back"]').boundingBox(),
    page.locator('.dock-actions [data-action="next"]').boundingBox(),
  ]);
  assert.ok(backBox && nextBox);
  assert.ok(Math.abs(backBox.width - nextBox.width) < 1, `${capture.name} action widths differ`);
  assert.ok(Math.abs(backBox.height - nextBox.height) < 1, `${capture.name} action heights differ`);
  if (capture.width <= 720) {
    assert.equal(await page.locator(".mobile-slot-editor").count(), 1);
    assert.equal(
      await page.locator(".slot-item:has(.slot-row.is-active) > .mobile-slot-editor").count(),
      1
    );
  } else {
    assert.equal(await page.locator(".mobile-slot-editor").count(), 0);
  }
  await context.close();
}

for (const capture of [
  { name: "prototype-event-desktop-dark", width: 1536, height: 1024 },
  { name: "prototype-event-mobile-dark", width: 390, height: 844 },
]) {
  const { context: eventContext, page: eventPage } = await openPrototype(
    { width: capture.width, height: capture.height },
    "dark"
  );
  await eventPage.locator('[data-action="go-step"][data-step="1"]').click();
  await eventPage.getByRole("heading", { name: "Tell us about the event" }).waitFor();
  assert.equal(await eventPage.locator(".event-panel").count(), 4);
  assert.equal(await eventPage.locator(".event-panel > .panel-header").count(), 4);
  assert.equal(await eventPage.locator(".event-column").count(), 0);
  const eventPanelBoxes = await eventPage.locator(".event-panel").evaluateAll((panels) =>
    panels.map((panel) => {
      const { x, y, width, height } = panel.getBoundingClientRect();
      return { x, y, width, height };
    })
  );
  for (let index = 1; index < eventPanelBoxes.length; index += 1) {
    assert.ok(Math.abs(eventPanelBoxes[index].x - eventPanelBoxes[0].x) < 1);
    assert.ok(Math.abs(eventPanelBoxes[index].width - eventPanelBoxes[0].width) < 1);
    assert.ok(eventPanelBoxes[index].y > eventPanelBoxes[index - 1].y + eventPanelBoxes[index - 1].height);
  }
  await eventPage.getByRole("heading", { name: "Date & time" }).waitFor();
  await eventPage.getByRole("heading", { name: "Event identity" }).waitFor();
  await eventPage.getByRole("heading", { name: "Location" }).waitFor();
  await eventPage.getByRole("heading", { name: "Audience and access" }).waitFor();
  assert.equal(await eventPage.locator('select[data-bind="event.roomsStages"]').count(), 1);
  assert.deepEqual(
    await eventPage.locator('select[data-bind="event.roomsStages"] option').allTextContents(),
    ["Select…", "1", "2", "3", "4", "Not confirmed yet"]
  );
  if (capture.width > 720) {
    const [capacityBox, ticketingBox] = await Promise.all([
      eventPage.getByText("Expected capacity", { exact: true }).boundingBox(),
      eventPage.getByText("Ticketing", { exact: true }).boundingBox(),
    ]);
    assert.ok(capacityBox && ticketingBox);
    assert.ok(Math.abs(capacityBox.y - ticketingBox.y) < 1, "Capacity and ticketing are not paired");
  }
  await eventPage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await eventPage.screenshot({
    path: `.impeccable/review/${capture.name}.png`,
    fullPage: true,
  });
  await eventContext.close();
}

{
  const { context: mobileTimingContext, page: mobileTimingPage } = await openPrototype(
    { width: 390, height: 844 },
    "dark"
  );
  await mobileTimingPage.locator('[data-action="go-step"][data-step="2"]').click();
  await mobileTimingPage.getByRole("heading", { name: "Plan the night" }).waitFor();
  await mobileTimingPage.waitForFunction(
    () => document.activeElement === document.querySelector(".step-header h1")
  );
  const activeStepVisible = await mobileTimingPage.evaluate(() => {
    const navigation = document.querySelector(".step-navigation");
    const active = navigation?.querySelector('[aria-current="step"]');
    if (!navigation || !active) return false;
    const navigationRect = navigation.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    return activeRect.left >= navigationRect.left && activeRect.right <= navigationRect.right;
  });
  assert.equal(activeStepVisible, true);
  assert.equal(await mobileTimingPage.locator('.agenda-mode-option[data-mode="aaa"][aria-pressed="true"]').count(), 1);
  assert.equal(await mobileTimingPage.locator(".concierge-plan").count(), 1);
  assert.equal(await mobileTimingPage.locator(".agenda-mobile").count(), 0);
  await mobileTimingPage.screenshot({
    path: ".impeccable/review/prototype-running-order-mobile-dark.png",
    fullPage: true,
  });
  await mobileTimingPage.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  assert.equal(await mobileTimingPage.locator(".agenda-mobile").count(), 1);
  assert.equal(await mobileTimingPage.locator(".agenda-stage").count(), 1);
  assert.equal(await mobileTimingPage.locator(".timeline-scroll").count(), 0);
  assert.equal(await mobileTimingPage.locator('[data-action="set-timeline-grid"][aria-pressed="true"]').innerText(), "15m");
  assert.equal(await mobileTimingPage.locator(".timeline-toolbar-readout strong").innerText(), "T+6h");
  await mobileTimingPage.screenshot({
    path: ".impeccable/review/prototype-timings-mobile-dark.png",
    fullPage: true,
  });
  await mobileTimingPage.locator('[data-action="begin-add-timing-artist"]').click();
  await mobileTimingPage.locator(".timing-composer").waitFor();
  assert.equal(await mobileTimingPage.locator('select[data-composer-bind="artist"]').count(), 1);
  assert.equal(await mobileTimingPage.locator('[data-action="confirm-add-timing-artist"]').isDisabled(), true);
  assert.ok(
    (await mobileTimingPage.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0
  );
  await mobileTimingPage.screenshot({
    path: ".impeccable/review/prototype-timings-mobile-add-artist-dark.png",
    fullPage: true,
  });
  await mobileTimingContext.close();
}

{
  const { context: singleContext, page: singlePage } = await openPrototype(
    { width: 1280, height: 900 },
    "dark"
  );
  await singlePage.locator('[data-action="remove-slot"][data-slot-id="2"]').click();
  await singlePage.locator('[data-action="go-step"][data-step="2"]').click();
  await singlePage.getByRole("heading", { name: "Plan the night" }).waitFor();
  assert.equal(await singlePage.locator(".concierge-plan").count(), 1);
  await singlePage.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  assert.equal(await singlePage.locator(".single-artist-timing").count(), 1);
  assert.equal(await singlePage.locator(".vertical-schedule").count(), 0);
  assert.equal(await singlePage.getByRole("button", { name: /^add artist$/i }).count(), 1);
  await singleContext.close();
}

{
  const { context: overflowContext, page: overflowPage } = await openPrototype(
    { width: 1280, height: 900 },
    "dark"
  );
  await overflowPage.locator('[data-action="go-step"][data-step="1"]').click();
  await overflowPage.locator('input[name="timeMode"][value="confirmed"]').check();
  await overflowPage.locator('input[data-bind="event.start"]').fill("21:00");
  await overflowPage.locator('input[data-bind="event.end"]').fill("04:00");
  await overflowPage.locator('select[data-bind="event.roomsStages"]').selectOption("2");
  await overflowPage.locator('[data-action="next"]').click();
  await overflowPage.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  await overflowPage.locator('.vertical-timeline-block[data-slot-id="1"] .vertical-block-main').click();
  await overflowPage.locator('select[data-timing-bind="timelineOffset"]').selectOption("330");
  await overflowPage.locator('.vertical-timeline-block[data-slot-id="1"]').evaluate((element) => {
    element.dataset.instanceMarker = "stable-overflow";
  });
  await overflowPage.locator('[data-agenda-bind="duration"]').selectOption("120");
  const overflowSlot = overflowPage.locator('.vertical-timeline-block[data-slot-id="1"]');
  await overflowSlot.waitFor();
  assert.match(await overflowSlot.innerText(), /02:30–04:00/i);
  assert.equal(await overflowPage.locator('.vertical-timeline-block[data-instance-marker="stable-overflow"]').count(), 1);
  const overflowSlotBox = await overflowSlot.boundingBox();
  assert.ok(overflowSlotBox && overflowSlotBox.height > 0);
  assert.equal(await overflowPage.locator(".vertical-overflow-region").count(), 2);
  assert.match(await overflowPage.locator(".agenda-summary-list .is-outside").innerText(), /C-Systems[\s\S]*Outside T\+D/i);
  await overflowPage.screenshot({
    path: ".impeccable/review/prototype-timings-overflow-dark.png",
    fullPage: true,
  });
  await overflowContext.close();
}

{
  const { context: stageContext, page: stagePage } = await openPrototype(
    { width: 1280, height: 900 },
    "dark"
  );
  await stagePage.locator('[data-action="go-step"][data-step="1"]').click();
  await stagePage.locator('select[data-bind="event.roomsStages"]').selectOption("2");
  await stagePage.locator('[data-action="next"]').click();
  await stagePage.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  await stagePage.locator('.vertical-timeline-block[data-slot-id="1"]').evaluate((element) => {
    element.dataset.instanceMarker = "stable-stage-drag";
  });
  await dragVerticalSlot(stagePage, 1, stagePage.locator(".vertical-new-stage-track"));
  assert.equal(await stagePage.locator('.vertical-timeline-block[data-instance-marker="stable-stage-drag"]').count(), 1);
  assert.deepEqual(await stagePage.locator(".vertical-stage-header .stage-name-input").evaluateAll((inputs) => inputs.map((input) => input.value)), [
    "Stage 1",
    "Stage 3",
  ]);
  await dragVerticalSlot(stagePage, 1, stagePage.locator(".vertical-new-stage-track"));
  assert.equal(await stagePage.locator('.vertical-timeline-block[data-instance-marker="stable-stage-drag"]').count(), 1);
  assert.deepEqual(await stagePage.locator(".vertical-stage-header .stage-name-input").evaluateAll((inputs) => inputs.map((input) => input.value)), [
    "Stage 1",
    "Stage 4",
  ]);
  await stageContext.close();
}

{
  const { context: squeezeContext, page: squeezePage } = await openPrototype(
    { width: 1280, height: 900 },
    "dark"
  );
  await squeezePage.locator('[data-action="add-slot"]').first().click();
  await squeezePage.locator('[data-action="set-slot-mode"][data-mode="known"]').click();
  await squeezePage.locator('select[data-slot-bind="artist"]').selectOption("Krevix");
  await squeezePage.locator('select[data-slot-bind="role"]').selectOption("Support");
  await squeezePage.locator('[data-action="next"]').click();
  await squeezePage.locator('input[name="timeMode"][value="confirmed"]').check();
  await squeezePage.locator('input[data-bind="event.start"]').fill("21:00");
  await squeezePage.locator('input[data-bind="event.end"]').fill("23:00");
  await squeezePage.locator('select[data-bind="event.roomsStages"]').selectOption("1");
  await squeezePage.locator('[data-action="next"]').click();
  await squeezePage.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();
  assert.equal(await squeezePage.locator(".timeline-conflict").count(), 0);
  await squeezePage.locator(".vertical-timeline-block.is-selected .vertical-block-main").click();
  await squeezePage.locator(".timing-inline-editor:not(.timing-composer)").waitFor();
  await squeezePage.locator('select[data-timing-bind="duration"]').selectOption("60");
  assert.equal(await squeezePage.locator(".timeline-conflict").count(), 0);
  assert.match(await squeezePage.locator(".timeline-notice").innerText(), /shortened/i);
  const squeezedDurations = (await squeezePage.locator(".vertical-block-detail").allTextContents()).map(
    (copy) => Number(copy.match(/(\d+) min/)?.[1])
  );
  assert.deepEqual([...squeezedDurations].sort((left, right) => left - right), [30, 30, 60]);
  await squeezePage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await squeezePage.mouse.move(0, 0);
  await squeezePage.screenshot({
    path: ".impeccable/review/prototype-timings-squeezed-dark.png",
    fullPage: true,
  });
  await squeezeContext.close();
}

const { context, page } = await openPrototype({ width: 1280, height: 900 }, "dark");

assert.equal(await page.locator(".slot-row").count(), 2);
assert.equal((await page.locator(".slot-row").first().locator(".slot-summary").innerText()).trim(), "HEADLINE");
const knownSurface = await page.locator(".slot-row").first().evaluate((element) =>
  getComputedStyle(element).backgroundColor
);
const openSurface = await page.locator(".slot-row.is-open").evaluate((element) =>
  getComputedStyle(element).backgroundColor
);
assert.notEqual(knownSurface, openSurface);
assert.equal(await page.locator('select[data-slot-bind="preferredDuration"]').count(), 1);
assert.equal(await page.locator('select[data-slot-bind="preferredDuration"]').inputValue(), "");
assert.equal(
  await page.locator('select[data-slot-bind="preferredDuration"] option[value=""]').innerText(),
  "Not specified"
);
assert.doesNotMatch(await page.locator('.slot-row').nth(1).locator('.slot-summary').innerText(), /min preferred/i);
await page.locator('select[data-slot-bind="preferredDuration"]').selectOption("75");
assert.match(await page.locator('.slot-row').nth(1).locator('.slot-summary').innerText(), /75 min preferred/i);
assert.equal(await page.locator('input[data-slot-bind="bpmMin"]').count(), 0);
assert.equal(await page.locator('input[data-slot-bind="bpmMax"]').count(), 0);
assert.equal(await page.locator('select[data-slot-bind="bpmMin"]').count(), 1);
assert.equal(await page.locator('select[data-slot-bind="bpmMax"]').count(), 1);
await page.locator('select[data-slot-bind="bpmMin"]').selectOption("140");
assert.equal(
  await page.locator('select[data-slot-bind="bpmMax"] option[value="135"]').evaluate((option) => option.disabled),
  true
);
await page.locator('select[data-slot-bind="bpmMax"]').selectOption("145");
assert.equal(
  await page.locator('select[data-slot-bind="bpmMin"] option[value="150"]').evaluate((option) => option.disabled),
  true
);
await page.locator('[data-action="add-slot"]').first().click();
assert.equal(await page.locator(".slot-row").count(), 3);
await page.locator('[data-action="set-slot-mode"][data-mode="known"]').click();
await page.waitForFunction(
  () => document.activeElement?.matches('[data-action="set-slot-mode"][data-mode="known"]')
);
await page.locator('select[data-slot-bind="artist"]').selectOption("Krevix");
await page.locator('select[data-slot-bind="role"]').selectOption("Support");
await page.waitForFunction(
  () => document.activeElement?.matches('select[data-slot-bind="role"]')
);
await page.locator('select[data-slot-bind="energy"]').selectOption("Driving");
await page.locator('[data-action="next"]').click();

assert.equal(await page.getByText("Event so far", { exact: true }).count(), 0);
assert.equal(await page.locator('input[name="timeMode"][value="tbc"]').isChecked(), true);
assert.equal(await page.locator('input[data-bind="event.start"]').count(), 0);

await page.locator('input[name="dateMode"][value="confirmed"]').check();
await page.locator('input[data-bind="event.date"]').fill("2026-12-01");
await page.locator('input[data-bind="event.name"]').fill("AAA Winter Session");
await page.locator('input[data-bind="event.country"]').fill("Netherlands");
await page.locator('input[data-bind="event.city"]').fill("Amsterdam");
await page.locator('input[name="timeMode"][value="confirmed"]').check();
await page.locator('input[data-bind="event.start"]').fill("21:00");
await page.locator('input[data-bind="event.end"]').fill("02:00");
await page.locator('input[name="timeMode"][value="tbc"]').check();
assert.equal(await page.locator('input[data-bind="event.start"]').count(), 0);
await page.locator('input[name="timeMode"][value="confirmed"]').check();
assert.equal(await page.locator('input[data-bind="event.start"]').inputValue(), "");
assert.equal(await page.locator('input[data-bind="event.end"]').inputValue(), "");
await page.locator('input[data-bind="event.start"]').fill("21:00");
await page.locator('input[data-bind="event.end"]').fill("02:00");
await page.locator('[data-action="next"]').click();
assert.match(await page.locator(".form-error").innerText(), /rooms or stages/i);
assert.equal(await page.evaluate(() => window.location.hash), "#event");
await page.locator('select[data-bind="event.roomsStages"]').selectOption("2");
await page.locator('[data-action="next"]').click();
await page.getByRole("heading", { name: "Plan the night" }).waitFor();

assert.equal(await page.locator('.agenda-mode-option[data-mode="aaa"][aria-pressed="true"]').count(), 1);
assert.equal(await page.locator(".concierge-plan").count(), 1);
assert.equal(await page.locator(".vertical-schedule").count(), 0);
assert.match(await page.locator(".concierge-plan").innerText(), /AAA recommendation/i);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.screenshot({
  path: ".impeccable/review/prototype-running-order-desktop-dark.png",
  fullPage: true,
});
await page.locator('[data-action="set-agenda-mode"][data-mode="custom"]').click();

assert.match(await page.locator(".timing-status").innerText(), /custom draft/i);
assert.equal(await page.locator(".vertical-stage-header").count(), 2);
assert.equal(await page.locator(".vertical-timeline-block").count(), 3);
assert.equal(await page.locator(".agenda-mobile").count(), 0);
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="2"]').innerText(), /21:00–22:15[\s\S]*75 min/i);
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="3"]').innerText(), /21:00–22:15[\s\S]*75 min/i);
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="1"]').innerText(), /22:15–23:45[\s\S]*90 min/i);
assert.equal(await page.locator('.vertical-timeline-block.is-selected .vertical-resize > span').count(), 2);
assert.deepEqual(
  await page.locator('.vertical-timeline-block.is-selected .vertical-resize b').allTextContents(),
  ["T", "T+D"]
);
assert.equal(await page.locator(".timing-inspector").count(), 0);
assert.equal(await page.locator(".agenda-summary").count(), 1);
assert.equal(await page.locator(".schedule-grid-bar .timeline-grid-control").count(), 1);
assert.equal(await page.locator(".schedule-grid-bar .timeline-add-artist").count(), 1);
await page.screenshot({
  path: ".impeccable/review/prototype-custom-agenda-desktop-dark.png",
  fullPage: true,
});
assert.deepEqual(
  (await page.locator(".vertical-time-ruler span").allTextContents()).slice(0, 5),
  ["21:00", "21:15", "21:30", "21:45", "22:00"]
);
await page.locator('[data-action="set-timeline-grid"][data-step="30"]').click();
assert.deepEqual(
  (await page.locator(".vertical-time-ruler span").allTextContents()).slice(0, 3),
  ["21:00", "21:30", "22:00"]
);
await page.locator('[data-action="set-timeline-grid"][data-step="15"]').click();
assert.equal(await page.locator('[data-action="set-time-format"]').count(), 2);
await page.locator('[data-action="set-time-format"][data-format="12"]').click();
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="2"]').innerText(), /9:00 PM–10:15 PM/i);
await page.locator('[data-action="set-time-format"][data-format="24"]').click();
await page.locator(".vertical-timeline-block.is-selected .vertical-block-main").click();
await page.locator(".timing-inline-editor:not(.timing-composer)").waitFor();
assert.equal(await page.locator('select[data-timing-bind="duration"]').count(), 1);
const timelineBackground = await page
  .locator('.vertical-stage-track[data-stage-index="0"]')
  .evaluate((element) => getComputedStyle(element).backgroundImage);
assert.ok((timelineBackground.match(/repeating-linear-gradient/g) || []).length >= 2);

assert.equal(await page.locator('[data-action="add-timing-stage"]').count(), 1);
await page.locator('[data-action="close-timing-quick"]').click();

await page.locator('[data-action="begin-add-timing-artist"]').click();
await page.locator('select[data-composer-bind="artist"]').selectOption("Mr B");
await page.locator('select[data-composer-bind="role"]').selectOption("Closing");
await page.locator('select[data-composer-bind="stageIndex"]').selectOption("1");
await page.locator('[data-action="confirm-add-timing-artist"]').click();
assert.equal(await page.locator(".vertical-timeline-block").count(), 4);
assert.equal(await page.locator(".timeline-conflict").count(), 0);
assert.match(await page.locator(".timeline-notice").innerText(), /Mr B added/i);
await page.locator('[data-action="undo-timeline"]').click();
assert.equal(await page.locator(".vertical-timeline-block").count(), 3);

const sourceBlock = page.locator('.vertical-timeline-block[data-slot-id="3"] .vertical-block-main');
const sourceBox = await sourceBlock.boundingBox();
const targetLaneBox = await page.locator('.vertical-stage-track[data-stage-index="0"]').boundingBox();
assert.ok(sourceBox && targetLaneBox);
await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
await page.mouse.down();
await page.mouse.move(targetLaneBox.x + targetLaneBox.width / 2, sourceBox.y + sourceBox.height / 2, {
  steps: 6,
});
await page.mouse.up();
assert.equal(await page.locator('select[data-timing-bind="stageIndex"]').inputValue(), "0");
assert.equal(await page.locator(".timeline-conflict").count(), 0);
assert.equal(await page.locator(".vertical-timeline-block.has-conflict").count(), 0);
assert.match(await page.locator(".timeline-notice").innerText(), /shifted automatically/i);
assert.equal(await page.locator('.vertical-timeline-block[data-slot-id="2"]').getAttribute("style").then((style) => /--block-start:\s*25%/.test(style)), true);
await page.screenshot({
  path: ".impeccable/review/prototype-timings-auto-adjust-dark.png",
  fullPage: true,
});

await page.locator('[data-action="undo-timeline"]').click();
assert.equal(await page.locator(".vertical-stage-header").count(), 2);
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="2"]').innerText(), /21:00–22:15/i);
await page.locator('input[data-stage-name="1"]').fill("Terrace");
assert.equal(await page.locator('input[data-stage-name="1"]').inputValue(), "Terrace");

const resizeTarget = page.locator('.vertical-timeline-block[data-slot-id="1"]');
await resizeTarget.evaluate((element) => {
  element.dataset.instanceMarker = "stable-resize";
});
const resizeHandle = resizeTarget.locator(".vertical-resize-end");
const resizeBox = await resizeHandle.boundingBox();
const resizeTrackBox = await page.locator('.vertical-stage-track[data-stage-index="0"]').boundingBox();
assert.ok(resizeBox && resizeTrackBox);
await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
await page.mouse.down();
await page.mouse.move(
  resizeBox.x + resizeBox.width / 2,
  resizeBox.y + resizeBox.height / 2 + (resizeTrackBox.height * 30) / 300,
  { steps: 4 }
);
await page.mouse.up();
assert.equal(await page.locator('select[data-timing-bind="duration"]').inputValue(), "120");
assert.match(await page.locator('.vertical-timeline-block[data-slot-id="1"]').innerText(), /120 min/i);
assert.equal(await page.locator('.vertical-timeline-block[data-instance-marker="stable-resize"]').count(), 1);
assert.match(await page.locator(".timing-status").innerText(), /customised/i);
await page.evaluate(() => document.activeElement?.blur());
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.screenshot({
  path: ".impeccable/review/prototype-timings-desktop-dark.png",
  fullPage: true,
});
await page.locator("#themeToggle").click();
await page.screenshot({
  path: ".impeccable/review/prototype-timings-desktop-light.png",
  fullPage: true,
});
await page.locator("#themeToggle").click();

await page.locator('[data-action="next"]').click();
await page.getByRole("heading", { name: "Set the total budget" }).waitFor();

await page.locator('select[data-bind="budget.range"]').selectOption("5,000–10,000");
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.screenshot({
  path: ".impeccable/review/prototype-budget-desktop-dark.png",
  fullPage: true,
});
await page.locator('[data-action="next"]').click();
await page.getByRole("heading", { name: "Who should we contact?" }).waitFor();

await page.locator('input[data-bind="contact.name"]').fill("Jane Booker");
await page.locator('input[data-bind="contact.email"]').fill("jane@example.com");
await page.locator('input[name="whatsappMode"][value="different"]').check();
await page.locator('input[data-bind="contact.whatsapp"]').fill("+31612345678");
await page.locator('[data-action="next"]').click();

await page.getByRole("heading", { name: "Review your enquiry" }).waitFor();
await page.getByText("C-Systems", { exact: true }).first().waitFor();
await page.getByText("Help me choose", { exact: true }).first().waitFor();
await page.getByText("Krevix", { exact: true }).first().waitFor();
const reviewText = await page.locator(".review-stack").innerText();
assert.match(reviewText, /EUR 5,000–10,000/);
assert.match(reviewText, /01 Dec 2026/);
assert.match(reviewText, /Rooms \/ stages\s+2/i);
assert.match(reviewText, /Terrace · Support · 21:00–22:15/i);
assert.match(reviewText, /Headline · Driving/i);

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.screenshot({ path: ".impeccable/review/prototype-review-dark.png", fullPage: true });
await page.locator('[data-action="submit-demo"]').click();
await page.getByRole("heading", { name: "Prototype complete" }).waitFor();
assert.match(await page.locator(".success-state").innerText(), /No enquiry was sent/);

await context.close();
await browser.close();

console.log("Booking Concierge prototype verification passed.");
