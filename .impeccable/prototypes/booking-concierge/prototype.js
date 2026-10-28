const ARTISTS = [
  "C-Systems",
  "FROGR",
  "Krevix",
  "Mr B",
  "SAGO",
  "Thiago Genez",
  "Xijaro & Pitch",
];

const STEPS = [
  { id: "artists", label: "Artists" },
  { id: "event", label: "Event" },
  { id: "timings", label: "Running order" },
  { id: "budget", label: "Budget" },
  { id: "contact", label: "Contact" },
  { id: "review", label: "Review" },
];

const ROLE_TIMING_SUGGESTIONS = {
  Opening: { duration: 60, order: 1 },
  Support: { duration: 75, order: 2 },
  Headline: { duration: 90, order: 3 },
  Closing: { duration: 90, order: 4 },
};

const BPM_VALUES = Array.from({ length: 17 }, (_, index) => String(100 + index * 5));
const DEFAULT_TIMELINE_STEP = 15;
const TIMELINE_MIN_DURATION = 30;
const MAX_TIMELINE_STAGES = 4;
const NEW_STAGE_GROUP_ID = "__new-stage__";
const TIMELINE_ENGINE = new URLSearchParams(window.location.search).get("engine") === "vis"
  ? "vis"
  : "native";

const initialState = () => ({
  step: 0,
  activeSlotId: 2,
  nextSlotId: 3,
  slots: [
    {
      id: 1,
      mode: "known",
      artist: "C-Systems",
      role: "Headline",
      energy: "Driving",
      bpmMin: "",
      bpmMax: "",
      stageIndex: 0,
      timelineOffset: 0,
      timingMode: "duration",
      preferredDuration: "",
      duration: "",
      start: "",
      finish: "",
      timingSource: "suggested",
    },
    {
      id: 2,
      mode: "help",
      artist: "",
      role: "Opening",
      energy: "Any",
      bpmMin: "",
      bpmMax: "",
      stageIndex: 0,
      timelineOffset: 0,
      timingMode: "duration",
      preferredDuration: "",
      duration: "",
      start: "",
      finish: "",
      timingSource: "suggested",
    },
  ],
  activeTimingSlotId: 2,
  stageNames: [],
  nextStageNumber: 1,
  timingComposer: null,
  timingQuickOpen: false,
  timelineStep: DEFAULT_TIMELINE_STEP,
  timelineDuration: 360,
  timeFormat: "24",
  agendaMode: "aaa",
  timelineNotice: "",
  timelineUndo: null,
  event: {
    dateMode: "tbc",
    date: "",
    timeMode: "tbc",
    name: "",
    type: "",
    venue: "",
    roomsStages: "",
    country: "",
    city: "",
    capacity: "",
    ticketing: "",
    start: "",
    end: "",
  },
  timingsStatus: "unstarted",
  budget: {
    currency: "EUR",
    range: "",
  },
  contact: {
    name: "",
    email: "",
    company: "",
    phoneCode: "",
    phone: "",
    whatsappMode: "none",
    whatsapp: "",
    message: "",
  },
  error: "",
  submitted: false,
});

let state = initialState();
let visTimelineInstance = null;
let visItemsData = null;
let visGroupsData = null;
let visMountFrame = null;

const progress = document.querySelector("#progress");
const workArea = document.querySelector("#workArea");
const liveRegion = document.querySelector("#liveRegion");
const themeToggle = document.querySelector("#themeToggle");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function option(value, label, selectedValue) {
  return `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function bpmOptions(selectedValue, { minimum = 100, maximum = 180 } = {}) {
  return [option("", "Any", selectedValue)]
    .concat(
      BPM_VALUES.map((value) => {
        const numericValue = Number(value);
        const disabled = numericValue < minimum || numericValue > maximum;
        return `<option value="${value}"${value === selectedValue ? " selected" : ""}${disabled ? " disabled" : ""}>${value}</option>`;
      })
    )
    .join("");
}

function announce(message) {
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 20);
}

function queueFocus(selector) {
  window.requestAnimationFrame(() => {
    document.querySelector(selector)?.focus({ preventScroll: true });
  });
}

function stableControlSelector(target) {
  const attributes = [
    "data-bind",
    "data-slot-bind",
    "data-slot-schedule",
    "data-timing-bind",
    "data-composer-bind",
    "data-agenda-bind",
    "data-stage-name",
    "data-slot-id",
    "name",
  ];
  const selector = attributes
    .filter((attribute) => target.hasAttribute(attribute))
    .map((attribute) => `[${attribute}="${CSS.escape(target.getAttribute(attribute))}"]`)
    .join("");
  const value = target.getAttribute("value");
  return `${target.tagName.toLowerCase()}${selector}${value === null ? "" : `[value="${CSS.escape(value)}"]`}`;
}

function revealActiveProgress(behavior = "smooth") {
  const navigation = document.querySelector(".step-navigation");
  const active = navigation?.querySelector('[aria-current="step"]');
  if (!navigation || !active || navigation.scrollWidth <= navigation.clientWidth) return;
  navigation.scrollTo({
    left: active.offsetLeft - (navigation.clientWidth - active.offsetWidth) / 2,
    behavior,
  });
}

function setNested(path, value) {
  const keys = path.split(".");
  let target = state;
  for (const key of keys.slice(0, -1)) target = target[key];
  target[keys.at(-1)] = value;
}

function activeSlot() {
  return state.slots.find((slot) => slot.id === state.activeSlotId) ?? state.slots[0] ?? null;
}

function slotName(slot) {
  if (slot.mode === "known") return slot.artist || "Choose an artist";
  if (slot.mode === "help") return "Help me choose";
  return "Choose how to continue";
}

function durationLabel(slot) {
  if (slot.timingMode === "times" && slot.start && slot.finish) {
    return `${slot.start}–${slot.finish}`;
  }
  if (slot.duration) return `${slot.duration} min`;
  return "Duration TBC";
}

function timingLabel(slot) {
  if (slot.timingMode === "times" && slot.start && slot.finish) return "Exact times";
  return "Time TBC";
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 720px)").matches;
}

function timingSlots() {
  return [...state.slots].sort((left, right) => {
    const leftOrder = ROLE_TIMING_SUGGESTIONS[left.role]?.order ?? 99;
    const rightOrder = ROLE_TIMING_SUGGESTIONS[right.role]?.order ?? 99;
    return leftOrder - rightOrder || state.slots.indexOf(left) - state.slots.indexOf(right);
  });
}

function timeToMinutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function eventWindowMinutes() {
  const start = timeToMinutes(state.event.start);
  let end = timeToMinutes(state.event.end);
  if (start === null || end === null) return null;
  if (end <= start) end += 1440;
  return end - start;
}

function timelineStepMinutes() {
  return [15, 30, 60].includes(Number(state.timelineStep))
    ? Number(state.timelineStep)
    : DEFAULT_TIMELINE_STEP;
}

function requestedStageCount() {
  const count = Number(state.event.roomsStages);
  return Number.isInteger(count) && count > 0 ? count : 1;
}

function nextStageName() {
  const name = `Stage ${state.nextStageNumber}`;
  state.nextStageNumber += 1;
  return name;
}

function ensureStageNames() {
  const count = requestedStageCount();
  while (state.stageNames.length < count) {
    state.stageNames.push(nextStageName());
  }
  return state.stageNames.slice(0, count);
}

function stageToneClass(stageIndex) {
  return `stage-tone-${Number(stageIndex) % 6}`;
}

function setStageCount(count) {
  const safeCount = Math.max(1, Math.min(MAX_TIMELINE_STAGES, Number(count) || 1));
  state.event.roomsStages = String(safeCount);
  return safeCount;
}

function removeEmptyStages() {
  const names = ensureStageNames();
  const usedStageIndexes = [...new Set(state.slots.map((slot) => Number(slot.stageIndex) || 0))]
    .filter((index) => index >= 0 && index < names.length)
    .sort((left, right) => left - right);
  if (!usedStageIndexes.length) usedStageIndexes.push(0);
  const remap = new Map(usedStageIndexes.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  const removed = names.filter((_, index) => !remap.has(index));
  for (const slot of state.slots) {
    slot.stageIndex = remap.get(Number(slot.stageIndex) || 0) ?? 0;
  }
  state.stageNames = usedStageIndexes.map((index, position) => names[index] || `Stage ${position + 1}`);
  setStageCount(state.stageNames.length);
  return removed;
}

function slotDurationMinutes(slot) {
  const duration = Number(slot.duration);
  if (Number.isFinite(duration) && duration > 0) return duration;
  const start = timeToMinutes(slot.start);
  let finish = timeToMinutes(slot.finish);
  if (start === null || finish === null) return 60;
  if (finish <= start) finish += 1440;
  return finish - start;
}

function timelineWindowMinutes() {
  const configuredDuration = Number(state.timelineDuration);
  if (Number.isFinite(configuredDuration) && configuredDuration >= 120) {
    return configuredDuration;
  }
  const eventMinutes = eventWindowMinutes();
  if (eventMinutes !== null) return Math.max(120, eventMinutes);
  const latestFinish = state.slots.reduce(
    (latest, slot) => Math.max(latest, Number(slot.timelineOffset) + slotDurationMinutes(slot)),
    0
  );
  return Math.max(360, Math.ceil(latestFinish / 60) * 60);
}

function timelineDisplayMinutes() {
  const latestFinish = state.slots.reduce(
    (latest, slot) => Math.max(latest, Number(slot.timelineOffset) + slotDurationMinutes(slot)),
    0
  );
  return Math.max(timelineWindowMinutes(), Math.ceil(latestFinish / 60) * 60);
}

function formatClock(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  if (state.timeFormat === "24") return minutesToTime(normalized);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function timelineLabel(offset) {
  const eventStart = timeToMinutes(state.event.start);
  if (state.event.timeMode === "confirmed" && eventStart !== null) {
    return formatClock(eventStart + offset);
  }
  if (offset === 0) return "T+0";
  const hours = Math.floor(offset / 60);
  const minutes = offset % 60;
  return `T+${hours ? `${hours}h` : ""}${minutes ? `${minutes}m` : ""}`;
}

function updateSlotTimeline(slot, offset, duration, limitMinutes = timelineWindowMinutes()) {
  const windowMinutes = Math.max(TIMELINE_MIN_DURATION, Number(limitMinutes));
  const step = timelineStepMinutes();
  const snappedDuration = Math.round(Number(duration) / step) * step;
  const safeDuration = Math.max(
    TIMELINE_MIN_DURATION,
    Math.min(snappedDuration, windowMinutes)
  );
  const snappedOffset = Math.round(Number(offset) / step) * step;
  const safeOffset = Math.max(0, Math.min(snappedOffset, windowMinutes - safeDuration));
  slot.timelineOffset = safeOffset;
  slot.duration = String(safeDuration);
  const eventStart = timeToMinutes(state.event.start);
  if (state.event.timeMode === "confirmed" && eventStart !== null) {
    slot.timingMode = "times";
    slot.start = minutesToTime(eventStart + safeOffset);
    slot.finish = minutesToTime(eventStart + safeOffset + safeDuration);
  } else {
    slot.timingMode = "duration";
    slot.start = "";
    slot.finish = "";
  }
}

function captureTimelineState() {
  return {
    slots: state.slots.map((slot) => ({ ...slot })),
    nextSlotId: state.nextSlotId,
    activeSlotId: state.activeSlotId,
    activeTimingSlotId: state.activeTimingSlotId,
    roomsStages: state.event.roomsStages,
    stageNames: [...state.stageNames],
    timingsStatus: state.timingsStatus,
    timelineStep: state.timelineStep,
    timelineDuration: state.timelineDuration,
    timeFormat: state.timeFormat,
    agendaMode: state.agendaMode,
    nextStageNumber: state.nextStageNumber,
  };
}

function restoreTimelineState(snapshot) {
  state.slots = snapshot.slots.map((slot) => ({ ...slot }));
  state.nextSlotId = snapshot.nextSlotId;
  state.activeSlotId = snapshot.activeSlotId;
  state.activeTimingSlotId = snapshot.activeTimingSlotId;
  state.event.roomsStages = snapshot.roomsStages;
  state.stageNames = [...snapshot.stageNames];
  state.timingsStatus = snapshot.timingsStatus;
  state.timelineStep = snapshot.timelineStep ?? DEFAULT_TIMELINE_STEP;
  state.timelineDuration = snapshot.timelineDuration ?? 360;
  state.timeFormat = snapshot.timeFormat ?? "24";
  state.agendaMode = snapshot.agendaMode ?? "aaa";
  state.nextStageNumber = snapshot.nextStageNumber ?? (
    Math.max(0, ...state.stageNames.map((name) => Number(name.match(/^Stage (\d+)$/)?.[1]) || 0)) + 1
  );
  state.timingComposer = null;
  state.timingQuickOpen = false;
}

function intervalsOverlap(leftOffset, leftDuration, rightOffset, rightDuration) {
  return leftOffset < rightOffset + rightDuration && rightOffset < leftOffset + leftDuration;
}

function closestAvailableOffset(desiredOffset, duration, occupied) {
  const step = timelineStepMinutes();
  const lastStart = Math.max(0, timelineWindowMinutes() - duration);
  const candidates = [];
  for (let offset = 0; offset <= lastStart; offset += step) candidates.push(offset);
  candidates.sort((left, right) => {
    const distance = Math.abs(left - desiredOffset) - Math.abs(right - desiredOffset);
    if (distance !== 0) return distance;
    const pushPreference = Number(left < desiredOffset) - Number(right < desiredOffset);
    return pushPreference || left - right;
  });
  return candidates.find((offset) =>
    occupied.every(
      (interval) => !intervalsOverlap(offset, duration, interval.offset, interval.duration)
    )
  );
}

function autoArrangeAround(activeSlot, snapshot, actionLabel = "Set updated") {
  const step = timelineStepMinutes();
  const stageIndex = Number(activeSlot.stageIndex) || 0;
  const occupied = [
    { offset: Number(activeSlot.timelineOffset) || 0, duration: slotDurationMinutes(activeSlot) },
  ];
  const others = state.slots
    .filter((slot) => slot.id !== activeSlot.id && Number(slot.stageIndex) === stageIndex)
    .sort((left, right) => {
      const sourcePriority = Number(left.timingSource !== "customised") - Number(right.timingSource !== "customised");
      return sourcePriority || Number(left.timelineOffset) - Number(right.timelineOffset);
    });
  const plannedDurations = new Map(
    others.map((slot) => [slot.id, slotDurationMinutes(slot)])
  );
  let excessDuration =
    slotDurationMinutes(activeSlot) +
    [...plannedDurations.values()].reduce((total, duration) => total + duration, 0) -
    timelineWindowMinutes();
  while (excessDuration > 0) {
    const reducible = [...others]
      .filter(
        (slot) =>
          slot.timingSource !== "customised" &&
          plannedDurations.get(slot.id) - step >= TIMELINE_MIN_DURATION
      )
      .sort(
        (left, right) =>
          plannedDurations.get(right.id) - plannedDurations.get(left.id)
      )[0];
    if (!reducible) break;
    plannedDurations.set(reducible.id, plannedDurations.get(reducible.id) - step);
    excessDuration -= step;
  }
  let shifted = 0;
  let squeezed = 0;
  let unresolved = 0;

  for (const slot of others) {
    const originalOffset = Number(slot.timelineOffset) || 0;
    const originalDuration = slotDurationMinutes(slot);
    let duration = plannedDurations.get(slot.id);
    let offset = closestAvailableOffset(originalOffset, duration, occupied);

    while (
      offset === undefined &&
      slot.timingSource !== "customised" &&
      duration - step >= TIMELINE_MIN_DURATION
    ) {
      duration -= step;
      offset = closestAvailableOffset(originalOffset, duration, occupied);
    }

    if (offset === undefined) {
      unresolved += 1;
      occupied.push({ offset: originalOffset, duration: originalDuration });
      continue;
    }

    updateSlotTimeline(slot, offset, duration);
    occupied.push({ offset, duration });
    if (offset !== originalOffset) shifted += 1;
    if (duration !== originalDuration) squeezed += 1;
  }

  activeSlot.timingSource = "customised";
  state.timelineUndo = snapshot;
  state.timingsStatus = "customised";
  if (unresolved) {
    state.timelineNotice = `${actionLabel}. ${unresolved} customised set could not be moved safely; the overlap remains visible.`;
    return;
  }
  const adjustments = [
    shifted ? `${shifted} neighbouring ${shifted === 1 ? "set was" : "sets were"} shifted` : "",
    squeezed ? `${squeezed} suggested ${squeezed === 1 ? "set was" : "sets were"} shortened` : "",
  ].filter(Boolean);
  state.timelineNotice = adjustments.length
    ? `${actionLabel}. ${adjustments.join(" and ")} automatically.`
    : `${actionLabel}. No other set needed adjustment.`;
}

function firstAvailableOffsetForStage(stageIndex, duration) {
  const occupied = state.slots
    .filter((slot) => Number(slot.stageIndex) === stageIndex)
    .map((slot) => ({
      offset: Number(slot.timelineOffset) || 0,
      duration: slotDurationMinutes(slot),
    }));
  return closestAvailableOffset(0, duration, occupied) ?? 0;
}

function timingConflicts() {
  const conflicts = new Set();
  for (let stageIndex = 0; stageIndex < requestedStageCount(); stageIndex += 1) {
    const stageSlots = state.slots
      .filter((slot) => Number(slot.stageIndex) === stageIndex)
      .sort((left, right) => Number(left.timelineOffset) - Number(right.timelineOffset));
    for (let index = 1; index < stageSlots.length; index += 1) {
      const previous = stageSlots[index - 1];
      const current = stageSlots[index];
      if (Number(current.timelineOffset) < Number(previous.timelineOffset) + slotDurationMinutes(previous)) {
        conflicts.add(previous.id);
        conflicts.add(current.id);
      }
    }
  }
  return conflicts;
}

function applyTimingSuggestions({ shouldAnnounce = true } = {}) {
  const step = timelineStepMinutes();
  const stages = ensureStageNames();

  timingSlots().forEach((slot, index) => {
    const suggestion = ROLE_TIMING_SUGGESTIONS[slot.role];
    const duration = Number(slot.preferredDuration) || suggestion?.duration || 60;
    const stageIndex = index % stages.length;
    slot.stageIndex = stageIndex;
    slot.duration = String(duration);
    slot.timingSource = "suggested";
  });

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
    const stageSlots = timingSlots().filter((slot) => Number(slot.stageIndex) === stageIndex);
    let totalDuration = stageSlots.reduce((total, slot) => total + slotDurationMinutes(slot), 0);
    while (totalDuration > timelineWindowMinutes()) {
      const reducible = [...stageSlots]
        .filter((slot) => slotDurationMinutes(slot) - step >= TIMELINE_MIN_DURATION)
        .sort((left, right) => slotDurationMinutes(right) - slotDurationMinutes(left))[0];
      if (!reducible) break;
      reducible.duration = String(slotDurationMinutes(reducible) - step);
      totalDuration -= step;
    }
    let cursor = 0;
    for (const slot of stageSlots) {
      updateSlotTimeline(slot, cursor, slotDurationMinutes(slot));
      cursor += slotDurationMinutes(slot);
    }
  }

  removeEmptyStages();

  state.activeTimingSlotId = timingSlots()[0]?.id ?? null;
  state.timingsStatus = "suggested";
  state.timelineNotice = "Suggested agenda rebuilt from the lineup roles.";
  state.timelineUndo = null;
  state.error = "";
  if (shouldAnnounce) announce("Suggested timings applied from the lineup roles.");
}

function renderProgress() {
  progress.innerHTML = STEPS.map(
    (step, index) => `
      <li>
        <button
          class="step-button"
          type="button"
          data-action="go-step"
          data-step="${index}"
          ${index === state.step ? 'aria-current="step"' : ""}
        >
          <span class="step-number">${String(index + 1).padStart(2, "0")}</span>${step.label}
        </button>
      </li>`
  ).join("");
}

function renderStepHeader(title, copy, prototypeNote = "") {
  return `
    <header class="step-header">
      <h1 tabindex="-1">${title}</h1>
      <p>${copy}</p>
      ${prototypeNote ? `<span class="prototype-flag">${prototypeNote}</span>` : ""}
    </header>`;
}

function renderError() {
  return state.error ? `<p class="form-error" role="alert" tabindex="-1">${escapeHtml(state.error)}</p>` : "";
}

function renderPathChoice(slot, mode, title, copy) {
  const selected = slot?.mode === mode;
  return `
    <button
      class="path-choice${mode === "help" ? " is-help-choice" : ""}${selected ? " is-selected" : ""}"
      type="button"
      data-action="set-slot-mode"
      data-mode="${mode}"
      aria-pressed="${selected}"
    >
      <span class="choice-indicator" aria-hidden="true"></span>
      <span>
        <span class="choice-title">${title}</span>
        <span class="choice-copy">${copy}</span>
      </span>
    </button>`;
}

function renderPreferenceFields(slot) {
  return `
    <label class="field">
      <span class="field-label">Role in lineup <span class="field-hint">(optional)</span></span>
      <select class="select" data-slot-bind="role" data-slot-id="${slot.id}">
        ${["", "Opening", "Support", "Headline", "Closing"].map((value) => option(value, value || "Leave open", slot.role)).join("")}
      </select>
    </label>
    <label class="field">
      <span class="field-label">Preferred set length <span class="field-hint">(optional)</span></span>
      <select class="select" data-slot-bind="preferredDuration" data-slot-id="${slot.id}">
        ${option("", "Not specified", slot.preferredDuration)}
        ${[30, 45, 60, 75, 90, 120].map((minutes) => option(String(minutes), `${minutes} minutes`, slot.preferredDuration)).join("")}
      </select>
    </label>
    <label class="field">
      <span class="field-label">Style / energy <span class="field-hint">(optional)</span></span>
      <select class="select" data-slot-bind="energy" data-slot-id="${slot.id}">
        ${["Any", "Warm-up", "Driving", "Uplifting", "Peak-time", "Deep / progressive"].map((value) => option(value, value, slot.energy)).join("")}
      </select>
    </label>
    <div class="bpm-fields">
      <label class="field">
        <span class="field-label">Minimum BPM <span class="field-hint">(optional)</span></span>
        <select class="select" data-slot-bind="bpmMin" data-slot-id="${slot.id}">
          ${bpmOptions(slot.bpmMin, { maximum: Number(slot.bpmMax) || 180 })}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Maximum BPM <span class="field-hint">(optional)</span></span>
        <select class="select" data-slot-bind="bpmMax" data-slot-id="${slot.id}">
          ${bpmOptions(slot.bpmMax, { minimum: Number(slot.bpmMin) || 100 })}
        </select>
      </label>
    </div>`;
}

function renderSlotEditor({ inline = false } = {}) {
  const slot = activeSlot();
  if (!slot) {
    return `
      <aside class="panel slot-editor${inline ? " is-inline" : ""}" tabindex="-1">
        <header class="panel-header">
          <h2 class="panel-title">Editing artist slot</h2>
        </header>
        <div class="slot-editor-body">
          <h3 class="editor-heading">Start your lineup</h3>
          <p class="editor-copy">Add a slot, then choose an artist or ask us to help fill it.</p>
          <button class="button button-primary" type="button" data-action="add-slot">Add first artist slot</button>
        </div>
      </aside>`;
  }

  const artistOptions = [option("", "Select an artist…", slot.artist)]
    .concat(ARTISTS.map((artist) => option(artist, artist, slot.artist)))
    .join("");

  const knownFields = `
    <div class="editor-fields">
      <label class="field">
        <span class="field-label">Artist</span>
        <select class="select" data-slot-bind="artist" data-slot-id="${slot.id}">
          ${artistOptions}
        </select>
      </label>
      ${renderPreferenceFields(slot)}
      <p class="helper-copy">Preferences describe the requested set and help shape the timing suggestion.</p>
    </div>`;

  const helpFields = `
    <div class="editor-fields open-preferences">
      ${renderPreferenceFields(slot)}
      <p class="helper-copy">You can leave these open and discuss them with us.</p>
    </div>`;

  return `
    <aside class="panel slot-editor${inline ? " is-inline" : ""}" aria-label="Editing artist slot ${slot.id}" tabindex="-1">
      <header class="panel-header">
        <h2 class="panel-title">Editing artist slot</h2>
        <span class="panel-meta">${String(state.slots.indexOf(slot) + 1).padStart(2, "0")}</span>
      </header>
      <div class="slot-editor-body">
        <h3 class="editor-heading">Who should fill this slot?</h3>
        <p class="editor-copy">Choose an artist or describe the slot. No matches are generated here.</p>
        <div class="path-grid">
          ${renderPathChoice(slot, "known", "Choose an artist", "Browse the AAA Artists roster and pick someone.")}
          ${renderPathChoice(slot, "help", "Help me choose", "Share the role and sound; discuss the fit with us.")}
        </div>
        ${slot.mode === "known" ? knownFields : slot.mode === "help" ? helpFields : ""}
      </div>
    </aside>`;
}

function renderLineup() {
  if (state.slots.length === 0) {
    return `
      <div class="empty-lineup">
        <strong>No artist slots yet</strong>
        Add one known artist or create an open recommendation slot.
      </div>`;
  }

  return `
    <ol class="running-order">
      ${state.slots
        .map(
          (slot, index) => `
            <li class="slot-item">
              <div class="slot-row${slot.mode === "help" ? " is-open" : ""}${slot.id === state.activeSlotId ? " is-active" : ""}">
                <button class="slot-select" type="button" data-action="select-slot" data-slot-id="${slot.id}" aria-label="Edit slot ${index + 1}, ${escapeHtml(slotName(slot))}" aria-expanded="${isMobileViewport() && slot.id === state.activeSlotId}">
                  <span class="slot-index">${String(index + 1).padStart(2, "0")}</span>
                  <span class="slot-copy">
                  <span class="slot-name">${escapeHtml(slotName(slot))}</span>
                    <span class="slot-summary">${escapeHtml([slot.role || "Role open", slot.preferredDuration ? `${slot.preferredDuration} min preferred` : ""].filter(Boolean).join(" · "))}</span>
                  </span>
                </button>
                <button class="slot-remove" type="button" data-action="remove-slot" data-slot-id="${slot.id}" aria-label="Remove ${escapeHtml(slotName(slot))}">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5 19 19M19 5 5 19"></path></svg>
                </button>
              </div>
              ${isMobileViewport() && slot.id === state.activeSlotId ? `<div class="mobile-slot-editor">${renderSlotEditor({ inline: true })}</div>` : ""}
            </li>`
        )
        .join("")}
    </ol>`;
}

function renderActionDock(nextLabel, { final = false } = {}) {
  return `
    <footer class="action-dock action-dock-simple">
      <div class="dock-actions">
        <button class="button" type="button" data-action="back"${state.step === 0 ? " disabled" : ""}>Back</button>
        <button class="button button-primary" type="button" data-action="${final ? "submit-demo" : "next"}">${nextLabel}</button>
      </div>
    </footer>`;
}

function renderArtistsStep() {
  return `
    ${renderStepHeader(
      "Build your lineup",
      "Add known artists, then leave any remaining slots open for a recommendation."
    )}
    ${renderError()}
    <div class="artist-layout">
      <section class="panel" aria-labelledby="lineupTitle">
        <header class="panel-header">
          <h2 class="panel-title" id="lineupTitle">Your artist lineup</h2>
          <span class="panel-meta">${state.slots.length} / 12 slots</span>
        </header>
        ${renderLineup()}
        <button class="add-slot" type="button" data-action="add-slot"${state.slots.length >= 12 ? " disabled" : ""}>
          <span class="add-slot-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"></path></svg></span>
          Add another artist
        </button>
      </section>
      ${isMobileViewport() ? "" : renderSlotEditor()}
    </div>
    ${renderActionDock("Next: event")}`;
}

function formatEventDate() {
  if (state.event.dateMode === "tbc") return "TBC";
  if (!state.event.date) return "—";
  const date = new Date(`${state.event.date}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? state.event.date
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatEventHours() {
  if (state.event.timeMode === "tbc") return "TBC";
  if (state.event.start && state.event.end) return `${state.event.start}–${state.event.end}`;
  if (state.event.start) return `From ${state.event.start}`;
  if (state.event.end) return `Until ${state.event.end}`;
  return "Not added";
}

function renderEventStep() {
  const dateConfirmed = state.event.dateMode === "confirmed";
  const timeConfirmed = state.event.timeMode === "confirmed";
  return `
    ${renderStepHeader("Tell us about the event", "One shared event brief applies to every artist in the lineup.")}
    ${renderError()}
    <div class="event-layout">
      <section class="panel event-panel" aria-labelledby="eventDateTimeTitle">
          <header class="panel-header">
            <h2 class="panel-title" id="eventDateTimeTitle">Date &amp; time</h2>
            <span class="panel-meta">Shared across lineup</span>
          </header>
          <div class="event-panel-body">
            <div class="field">
              <span class="field-label">Event date</span>
              <div class="date-paths">
                <label><input type="radio" name="dateMode" value="confirmed" data-bind="event.dateMode"${dateConfirmed ? " checked" : ""} /> Choose a date</label>
                <label><input type="radio" name="dateMode" value="tbc" data-bind="event.dateMode"${!dateConfirmed ? " checked" : ""} /> Date not confirmed yet</label>
              </div>
            </div>
            ${
              dateConfirmed
                ? `<label class="field"><span class="field-label">Date *</span><input class="input" type="date" data-bind="event.date" value="${escapeHtml(state.event.date)}" aria-invalid="${Boolean(state.error && !state.event.date)}" /></label>`
                : `<p class="helper-copy">The exact date can be confirmed with the booking team later.</p>`
            }
            <div class="field event-time-field">
              <span class="field-label">Event time</span>
              <div class="date-paths">
                <label><input type="radio" name="timeMode" value="confirmed" data-bind="event.timeMode"${timeConfirmed ? " checked" : ""} /> Choose event times</label>
                <label><input type="radio" name="timeMode" value="tbc" data-bind="event.timeMode"${!timeConfirmed ? " checked" : ""} /> Time not confirmed yet</label>
              </div>
            </div>
            ${
              timeConfirmed
                ? `<div class="field event-hours-field"><span class="inline-fields"><label class="field"><span class="field-label">Starts *</span><input class="input" type="time" data-bind="event.start" value="${escapeHtml(state.event.start)}" aria-invalid="${Boolean(state.error && !state.event.start)}" /></label><label class="field"><span class="field-label">Ends *</span><input class="input" type="time" data-bind="event.end" value="${escapeHtml(state.event.end)}" aria-invalid="${Boolean(state.error && !state.event.end)}" /></label></span><span class="helper-copy">Used to create a first timing proposal. Overnight ranges are supported.</span></div>`
                : `<p class="helper-copy">The exact event hours can be confirmed with the booking team later.</p>`
            }
          </div>
      </section>
      <section class="panel event-panel" aria-labelledby="eventIdentityTitle">
        <header class="panel-header"><h2 class="panel-title" id="eventIdentityTitle">Event identity</h2></header>
        <div class="event-panel-body event-fields">
          <label class="field"><span class="field-label">Event name</span><input class="input" data-bind="event.name" value="${escapeHtml(state.event.name)}" placeholder="e.g. Saturday Sessions" /></label>
          <label class="field"><span class="field-label">Event type</span><select class="select" data-bind="event.type">${["", "Club Night", "Festival", "Open Air / Day Party", "Other"].map((value) => option(value, value || "Select type…", state.event.type)).join("")}</select></label>
        </div>
      </section>
      <section class="panel event-panel" aria-labelledby="eventLocationTitle">
        <header class="panel-header"><h2 class="panel-title" id="eventLocationTitle">Location</h2></header>
        <div class="event-panel-body event-fields">
          <label class="field"><span class="field-label">Venue / location name</span><input class="input" data-bind="event.venue" value="${escapeHtml(state.event.venue)}" placeholder="e.g. Fabric" /></label>
          <label class="field"><span class="field-label">Rooms / stages *</span><select class="select" data-bind="event.roomsStages" aria-invalid="${Boolean(state.error && !state.event.roomsStages)}">${["", "1", "2", "3", "4", "Not confirmed yet"].map((value) => option(value, value || "Select…", state.event.roomsStages)).join("")}</select></label>
          <label class="field"><span class="field-label">City</span><input class="input" data-bind="event.city" value="${escapeHtml(state.event.city)}" placeholder="City" /></label>
          <label class="field"><span class="field-label">Country</span><input class="input" data-bind="event.country" value="${escapeHtml(state.event.country)}" placeholder="Start typing a country…" /></label>
        </div>
      </section>
      <section class="panel event-panel" aria-labelledby="eventAudienceTitle">
        <header class="panel-header"><h2 class="panel-title" id="eventAudienceTitle">Audience and access</h2></header>
        <div class="event-panel-body event-fields">
          <label class="field"><span class="field-label">Expected capacity</span><select class="select" data-bind="event.capacity">${["", "Under 100", "100–300", "300–500", "500–1,000", "1,000–3,000", "3,000–5,000", "5,000–10,000", "10,000+"].map((value) => option(value, value || "Select capacity…", state.event.capacity)).join("")}</select></label>
          <label class="field"><span class="field-label">Ticketing</span><select class="select" data-bind="event.ticketing">${["", "Ticketed", "Free entry", "Private / guestlist"].map((value) => option(value, value || "Select…", state.event.ticketing)).join("")}</select></label>
        </div>
      </section>
    </div>
    ${renderActionDock("Next: timings")}`;
}

function timingOffsetOptions(selectedOffset, duration) {
  const step = timelineStepMinutes();
  const lastStart = Math.max(0, timelineDisplayMinutes() - duration);
  const values = [];
  for (let offset = 0; offset <= lastStart; offset += step) values.push(offset);
  if (!values.includes(selectedOffset)) values.push(selectedOffset);
  return values
    .sort((left, right) => left - right)
    .map((offset) => option(String(offset), timelineLabel(offset), String(selectedOffset)))
    .join("");
}

function timingDurationOptions(selectedDuration, offset) {
  const step = timelineStepMinutes();
  const maximum = Math.max(30, timelineDisplayMinutes() - offset);
  const values = [];
  for (let duration = Math.max(TIMELINE_MIN_DURATION, step); duration <= maximum; duration += step) {
    values.push(duration);
  }
  if (!values.includes(selectedDuration)) values.push(selectedDuration);
  return values
    .sort((left, right) => left - right)
    .map((duration) => option(String(duration), `${duration} minutes`, String(selectedDuration)))
    .join("");
}

function timingEndOptions(offset, duration) {
  const step = timelineStepMinutes();
  const selectedEnd = offset + duration;
  const values = [];
  for (
    let end = offset + TIMELINE_MIN_DURATION;
    end <= timelineDisplayMinutes();
    end += step
  ) {
    values.push(end);
  }
  if (!values.includes(selectedEnd)) values.push(selectedEnd);
  return values
    .sort((left, right) => left - right)
    .map((end) => option(String(end), timelineLabel(end), String(selectedEnd)))
    .join("");
}

function formatDurationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours ? `${hours}h ` : ""}${remainder}m`;
}

function agendaDurationOptions() {
  const selected = timelineWindowMinutes();
  const values = [];
  for (let duration = 120; duration <= 720; duration += 30) values.push(duration);
  if (!values.includes(selected)) values.push(selected);
  return values
    .sort((left, right) => left - right)
    .map((duration) => option(String(duration), formatDurationLabel(duration), String(selected)))
    .join("");
}

function timelineEndLabel() {
  const start = timeToMinutes(state.event.start);
  return start === null
    ? timelineLabel(timelineWindowMinutes())
    : formatClock(start + timelineWindowMinutes());
}

function renderTimelineToolbar() {
  return `
    <div class="timeline-toolbar" aria-label="Agenda time settings">
      <label class="timeline-toolbar-control"><span>Start (T)</span><input class="timeline-toolbar-input" type="time" data-agenda-bind="start" value="${escapeHtml(state.event.start)}" /></label>
      <label class="timeline-toolbar-control"><span>Duration (D)</span><select class="timeline-toolbar-input" data-agenda-bind="duration">${agendaDurationOptions()}</select></label>
      <span class="timeline-toolbar-readout"><span>End (T+D)</span><strong>${escapeHtml(timelineEndLabel())}</strong></span>
      <div class="timeline-format-control" role="group" aria-label="Time display format">
        <span>Clock</span>
        <div>${["12", "24"].map((value) => `<button type="button" data-action="set-time-format" data-format="${value}" aria-pressed="${value === state.timeFormat}">${value}h</button>`).join("")}</div>
      </div>
    </div>`;
}

function renderSnapControl() {
  const step = timelineStepMinutes();
  return `
    <div class="timeline-grid-control" role="group" aria-label="Timeline snap interval">
      <span>${isMobileViewport() ? "Adjust by" : "Snap to grid"}</span>
      <div>${[15, 30, 60].map((value) => `<button type="button" data-action="set-timeline-grid" data-step="${value}" aria-pressed="${value === step}">${value === 60 ? "1h" : `${value}m`}</button>`).join("")}</div>
    </div>`;
}

function renderAgendaModeChooser() {
  return `
    <div class="agenda-mode" role="group" aria-label="Choose how to plan the running order">
      <button class="agenda-mode-option${state.agendaMode === "aaa" ? " is-selected" : ""}" type="button" data-action="set-agenda-mode" data-mode="aaa" aria-pressed="${state.agendaMode === "aaa"}">
        <span class="agenda-mode-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"></path></svg></span>
        <span><strong>Let AAA arrange it</strong><small>Tell us what you know. We will propose the artists, set lengths and running order.</small></span>
        <em>Recommended</em>
      </button>
      <button class="agenda-mode-option${state.agendaMode === "custom" ? " is-selected" : ""}" type="button" data-action="set-agenda-mode" data-mode="custom" aria-pressed="${state.agendaMode === "custom"}">
        <span class="agenda-mode-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"></path></svg></span>
        <span><strong>Customise timings</strong><small>Fine-tune stages, start times and set lengths on the agenda.</small></span>
      </button>
    </div>`;
}

function timelineSlotName(slot) {
  return slot.mode === "help" ? "AAA recommendation" : slotName(slot);
}

function renderConciergePlan() {
  const stages = ensureStageNames();
  const orderedSlots = [...state.slots].sort(
    (left, right) => Number(left.timelineOffset) - Number(right.timelineOffset)
  );
  const openSlots = orderedSlots.filter((slot) => slot.mode === "help").length;
  return `
    <section class="concierge-plan" aria-labelledby="conciergePlanTitle">
      <header class="concierge-plan-intro">
        <span class="concierge-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"></path><circle cx="12" cy="12" r="4"></circle></svg></span>
        <div>
          <h3 id="conciergePlanTitle">You set the direction. We build the night.</h3>
          <p>${openSlots ? `${openSlots} ${openSlots === 1 ? "place in the lineup is" : "places in the lineup are"} open for an AAA recommendation.` : "Your requested artists are noted. AAA will propose the most suitable order and set lengths."}</p>
        </div>
        <button class="text-action" type="button" data-action="go-step" data-step="0">Edit artist preferences</button>
      </header>
      <ol class="concierge-order">
        ${orderedSlots.map((slot) => {
          const offset = Number(slot.timelineOffset) || 0;
          const duration = slotDurationMinutes(slot);
          const bpm = slot.bpmMin || slot.bpmMax
            ? `${slot.bpmMin || "Any"}–${slot.bpmMax || "Any"} BPM`
            : "BPM open";
          const preference = slot.mode === "help"
            ? `${slot.energy && slot.energy !== "Any" ? slot.energy : "Style open"} · ${bpm}`
            : `${slot.role || "Role open"} · requested artist`;
          return `
            <li class="${stageToneClass(slot.stageIndex)}${slot.mode === "help" ? " is-recommendation" : ""}">
              <span class="concierge-time">${escapeHtml(timelineLabel(offset))}</span>
              <span class="concierge-stage-dot" aria-hidden="true"></span>
              <span><strong>${escapeHtml(timelineSlotName(slot))}</strong><small>${escapeHtml(preference)}</small></span>
              <span class="concierge-order-meta">${escapeHtml(stages[Number(slot.stageIndex)] || `Stage ${Number(slot.stageIndex) + 1}`)} · ${duration} min suggestion</span>
            </li>`;
        }).join("")}
      </ol>
      <p class="concierge-note">This is a starting point, not a commitment. Our booking team will match availability, budget and the energy you want for the event.</p>
    </section>`;
}

function renderAgendaToolbar() {
  const stageCount = ensureStageNames().length;
  return `
    <div class="schedule-grid-bar">
      <span><strong>Agenda</strong><small>Drag to move · use the edges to resize</small></span>
      <div class="agenda-toolbar-actions">
        <button class="button button-primary timeline-add-artist" type="button" data-action="begin-add-timing-artist"><span class="button-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"></path></svg></span>Add artist</button>
        ${stageCount < MAX_TIMELINE_STAGES ? '<button class="button agenda-add-stage" type="button" data-action="add-timing-stage">+ Stage</button>' : ""}
        ${renderSnapControl()}
      </div>
    </div>`;
}

function slotsOutsideTimeline() {
  const windowMinutes = timelineWindowMinutes();
  return state.slots.filter(
    (slot) => Number(slot.timelineOffset) + slotDurationMinutes(slot) > windowMinutes
  );
}

function renderTimelineBlock(slot, conflicts) {
  const windowMinutes = timelineWindowMinutes();
  const offset = Number(slot.timelineOffset) || 0;
  const duration = slotDurationMinutes(slot);
  const startPercent = (offset / windowMinutes) * 100;
  const widthPercent = (duration / windowMinutes) * 100;
  const selected = slot.id === state.activeTimingSlotId;
  const hasConflict = conflicts.has(slot.id);
  return `
    <article
      class="timeline-block ${stageToneClass(slot.stageIndex)}${selected ? " is-selected" : ""}${hasConflict ? " has-conflict" : ""}${slot.mode === "help" ? " is-open" : ""}"
      style="--block-start:${startPercent}%;--block-width:${widthPercent}%"
      data-slot-id="${slot.id}"
    >
      <button class="timeline-resize timeline-resize-start" type="button" data-timeline-drag="resize-start" data-slot-id="${slot.id}" aria-label="Adjust the start of ${escapeHtml(timelineSlotName(slot))}"><span class="timeline-grip-label"><b>T</b><small>${escapeHtml(timelineLabel(offset))}</small></span></button>
      <button class="timeline-block-main" type="button" data-action="select-timing-slot" data-timeline-drag="move" data-slot-id="${slot.id}" aria-pressed="${selected}">
        <strong>${escapeHtml(timelineSlotName(slot))}</strong>
        <span>${escapeHtml(timelineLabel(offset))}–${escapeHtml(timelineLabel(offset + duration))} · ${duration} min</span>
      </button>
      <button class="timeline-resize timeline-resize-end" type="button" data-timeline-drag="resize-end" data-slot-id="${slot.id}" aria-label="Adjust the end of ${escapeHtml(timelineSlotName(slot))}"><span class="timeline-grip-label"><b>T+D</b><small>${escapeHtml(timelineLabel(offset + duration))}</small></span></button>
    </article>`;
}

function renderVerticalTimelineBlock(slot, conflicts, displayMinutes) {
  const offset = Number(slot.timelineOffset) || 0;
  const duration = slotDurationMinutes(slot);
  const selected = slot.id === state.activeTimingSlotId;
  const hasConflict = conflicts.has(slot.id);
  return `
    <article
      class="vertical-timeline-block ${stageToneClass(slot.stageIndex)}${selected ? " is-selected" : ""}${hasConflict ? " has-conflict" : ""}${slot.mode === "help" ? " is-open" : ""}"
      style="--block-start:${(offset / displayMinutes) * 100}%;--block-size:${(duration / displayMinutes) * 100}%"
      data-timeline-slot
      data-slot-id="${slot.id}"
    >
      <button class="vertical-resize vertical-resize-start" type="button" data-timeline-drag="resize-start" data-slot-id="${slot.id}" aria-label="Adjust the start of ${escapeHtml(timelineSlotName(slot))}"><span><b>T</b><small>${escapeHtml(timelineLabel(offset))}</small></span></button>
      <button class="vertical-block-main" type="button" data-action="select-timing-slot" data-timeline-drag="move" data-slot-id="${slot.id}" aria-pressed="${selected}">
        <span class="vertical-slot-heading"><i aria-hidden="true"></i><strong>${escapeHtml(timelineSlotName(slot))}</strong></span>
        <span class="vertical-block-time">${escapeHtml(timelineLabel(offset))}–${escapeHtml(timelineLabel(offset + duration))}</span>
        <small class="vertical-block-detail">${escapeHtml(slot.role || "Role open")} · ${duration} min</small>
      </button>
      <button class="vertical-resize vertical-resize-end" type="button" data-timeline-drag="resize-end" data-slot-id="${slot.id}" aria-label="Adjust the end of ${escapeHtml(timelineSlotName(slot))}"><span><b>T+D</b><small>${escapeHtml(timelineLabel(offset + duration))}</small></span></button>
    </article>`;
}

function visTimelineOrigin() {
  const eventStart = timeToMinutes(state.event.start) ?? 0;
  return new Date(2026, 0, 1, Math.floor(eventStart / 60), eventStart % 60, 0, 0);
}

function visTimelineDate(offset) {
  return new Date(visTimelineOrigin().getTime() + offset * 60_000);
}

function visTimelineOffset(value) {
  return Math.round((new Date(value).getTime() - visTimelineOrigin().getTime()) / 60_000);
}

function createVisGroupContent(stageName, stageIndex) {
  const content = document.createElement("div");
  content.className = `vis-stage-label ${stageToneClass(stageIndex)}`;
  const identity = document.createElement("div");
  identity.className = "vis-stage-identity";
  const colorKey = document.createElement("span");
  colorKey.className = "stage-color-key";
  colorKey.setAttribute("aria-hidden", "true");
  const label = document.createElement("label");
  const hiddenLabel = document.createElement("span");
  hiddenLabel.className = "sr-only";
  hiddenLabel.textContent = `Name for room or stage ${stageIndex + 1}`;
  const input = document.createElement("input");
  input.className = "stage-name-input";
  input.dataset.stageName = String(stageIndex);
  input.value = stageName;
  input.setAttribute("aria-label", hiddenLabel.textContent);
  label.append(hiddenLabel, input);
  identity.append(colorKey, label);
  content.append(identity);
  return content;
}

function createVisNewStageContent() {
  const content = document.createElement("div");
  content.className = "vis-new-stage-label";
  content.innerHTML = '<span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"></path></svg></span><strong>New stage</strong><small>Drop an artist here</small>';
  return content;
}

function createVisItemContent(slot) {
  const content = document.createElement("div");
  content.className = "vis-artist-content";
  content.dataset.visSlotId = String(slot.id);
  const name = document.createElement("strong");
  name.textContent = timelineSlotName(slot);
  const timing = document.createElement("span");
  const offset = Number(slot.timelineOffset) || 0;
  const duration = slotDurationMinutes(slot);
  timing.textContent = `${timelineLabel(offset)}–${timelineLabel(offset + duration)} · ${duration} min`;
  content.append(name, timing);
  return content;
}

function visGroupRecords() {
  const records = ensureStageNames().map((stageName, stageIndex) => ({
    id: stageIndex,
    content: createVisGroupContent(stageName, stageIndex),
    order: stageIndex,
    className: stageToneClass(stageIndex),
  }));
  if (records.length < MAX_TIMELINE_STAGES) {
    records.push({
      id: NEW_STAGE_GROUP_ID,
      content: createVisNewStageContent(),
      order: MAX_TIMELINE_STAGES + 1,
      className: "vis-new-stage-group",
    });
  }
  return records;
}

function visItemRecords() {
  return state.slots.map((slot) => ({
    id: slot.id,
    group: Number(slot.stageIndex) || 0,
    start: visTimelineDate(Number(slot.timelineOffset) || 0),
    end: visTimelineDate((Number(slot.timelineOffset) || 0) + slotDurationMinutes(slot)),
    content: createVisItemContent(slot),
    className: `${slot.mode === "help" ? "vis-open-slot " : ""}${stageToneClass(slot.stageIndex)}`,
    editable: { updateGroup: true, updateTime: true, remove: false },
    title: `${timelineSlotName(slot)} · ${slot.role || "Role open"}`,
  }));
}

function syncDataSet(dataSet, records) {
  if (!dataSet) return;
  const desiredIds = new Set(records.map((record) => record.id));
  const obsoleteIds = dataSet.getIds().filter((id) => !desiredIds.has(id));
  if (obsoleteIds.length) dataSet.remove(obsoleteIds);
  dataSet.update(records);
}

function visTimelineOptions() {
  const origin = visTimelineOrigin();
  const windowMinutes = timelineDisplayMinutes();
  return {
    min: origin,
    max: new Date(origin.getTime() + windowMinutes * 60_000),
    height: Math.max(224, ensureStageNames().length * 108 + 102),
    timeAxis: { scale: "minute", step: timelineStepMinutes() },
    snap(date) {
      const step = timelineStepMinutes();
      const currentOrigin = visTimelineOrigin();
      const offset = Math.round((date.getTime() - currentOrigin.getTime()) / 60_000 / step) * step;
      return new Date(currentOrigin.getTime() + offset * 60_000);
    },
    format: {
      minorLabels(date) {
        const currentOrigin = visTimelineOrigin();
        const offset = Math.round((date.valueOf() - currentOrigin.getTime()) / 60_000);
        return offset % 60 === 0 ? timelineLabel(offset) : "";
      },
    },
  };
}

function syncVisTimeline({ data = true, groups = false, window = false } = {}) {
  if (!visTimelineInstance || !visItemsData || !visGroupsData) return false;
  if (groups) syncDataSet(visGroupsData, visGroupRecords());
  if (data) syncDataSet(visItemsData, visItemRecords());
  if (window || groups) {
    const origin = visTimelineOrigin();
    const end = new Date(origin.getTime() + timelineDisplayMinutes() * 60_000);
    visTimelineInstance.setOptions(visTimelineOptions());
    visTimelineInstance.setWindow(origin, end, { animation: false });
  }
  if (state.activeTimingSlotId) {
    visTimelineInstance.setSelection([state.activeTimingSlotId], { focus: false });
  }
  return true;
}

function mountVisTimeline() {
  const container = document.querySelector("#visTimeline");
  if (!container || !window.vis?.Timeline || !window.vis?.DataSet) return;
  const origin = visTimelineOrigin();
  const windowMinutes = timelineDisplayMinutes();
  visGroupsData = new window.vis.DataSet(visGroupRecords());
  visItemsData = new window.vis.DataSet(visItemRecords());
  const options = {
    start: origin,
    end: new Date(origin.getTime() + windowMinutes * 60_000),
    min: origin,
    max: new Date(origin.getTime() + windowMinutes * 60_000),
    height: Math.max(224, ensureStageNames().length * 108 + 102),
    orientation: { axis: "top", item: "top" },
    editable: { add: false, remove: false, updateGroup: true, updateTime: true },
    itemsAlwaysDraggable: { item: true, range: true },
    margin: { axis: 10, item: { horizontal: 0, vertical: 20 } },
    stack: false,
    selectable: true,
    showCurrentTime: false,
    showMajorLabels: false,
    showMinorLabels: true,
    moveable: false,
    zoomable: false,
    ...visTimelineOptions(),
    onMove(item, callback) {
      const slot = state.slots.find((candidate) => candidate.id === Number(item.id));
      if (!slot) {
        callback(null);
        return;
      }
      const snapshot = captureTimelineState();
      const nextOffset = visTimelineOffset(item.start);
      const nextDuration = visTimelineOffset(item.end) - nextOffset;
      const createsStage = item.group === NEW_STAGE_GROUP_ID;
      if (createsStage) {
        const nextStageIndex = ensureStageNames().length;
        if (nextStageIndex >= MAX_TIMELINE_STAGES) {
          callback(null);
          return;
        }
        state.stageNames.push(nextStageName());
        setStageCount(state.stageNames.length);
        slot.stageIndex = nextStageIndex;
      } else {
        slot.stageIndex = Number(item.group) || 0;
      }
      updateSlotTimeline(slot, nextOffset, nextDuration, timelineDisplayMinutes());
      const removedStages = removeEmptyStages();
      state.activeTimingSlotId = slot.id;
      state.timingQuickOpen = true;
      const stageChanges = [
        createsStage ? `${ensureStageNames()[slot.stageIndex]} created` : "",
        removedStages.length ? `${removedStages.join(", ")} removed` : "",
      ].filter(Boolean);
      autoArrangeAround(
        slot,
        snapshot,
        `${slotName(slot)} placed on ${ensureStageNames()[slot.stageIndex]}${stageChanges.length ? `. ${stageChanges.join(" · ")}` : ""}`
      );
      item.group = slot.stageIndex;
      callback(item);
      window.setTimeout(() => {
        updateTimingsInPlace({ groups: true });
      }, 0);
    },
  };
  visTimelineInstance = new window.vis.Timeline(container, visItemsData, visGroupsData, options);
  visTimelineInstance.setWindow(origin, new Date(origin.getTime() + windowMinutes * 60_000), {
    animation: false,
  });
  visTimelineInstance.redraw();
  visTimelineInstance.setSelection([state.activeTimingSlotId]);
  visTimelineInstance.on("select", ({ items: selectedItems }) => {
    const slotId = Number(selectedItems[0]);
    if (!slotId) return;
    state.activeTimingSlotId = slotId;
    state.timingComposer = null;
    state.timingQuickOpen = true;
    refreshTimingChrome();
  });
}

function renderTimelineBoard() {
  const stages = ensureStageNames();
  const windowMinutes = timelineDisplayMinutes();
  const markers = [];
  for (let offset = 0; offset <= windowMinutes; offset += timelineStepMinutes()) markers.push(offset);
  if (markers.at(-1) !== windowMinutes) markers.push(windowMinutes);
  const conflicts = timingConflicts();

  if (state.slots.length <= 1 && !state.timingComposer) {
    return `
      <section class="single-artist-timing" aria-label="Artist timing">
        <div class="single-artist-intro">
          <strong>One artist request</strong>
          <p>Set the stage, start and duration directly. The visual planner appears when the enquiry contains more than one artist.</p>
        </div>
        ${renderTimingEditor()}
      </section>`;
  }

  if (isMobileViewport()) {
    return `
      <div class="agenda-mobile">
        ${stages
          .map((stageName, stageIndex) => {
            const stageSlots = state.slots
              .filter((slot) => Number(slot.stageIndex) === stageIndex)
              .sort((left, right) => Number(left.timelineOffset) - Number(right.timelineOffset));
            return `
              <section class="agenda-stage ${stageToneClass(stageIndex)}">
                <header class="agenda-stage-header">
                  <label class="field"><span class="field-label">Room / stage ${stageIndex + 1}</span><input class="stage-name-input" data-stage-name="${stageIndex}" value="${escapeHtml(stageName)}" aria-label="Name for room or stage ${stageIndex + 1}" /></label>
                </header>
                <div class="agenda-list">
                  ${stageSlots
                    .map((slot) => {
                      const offset = Number(slot.timelineOffset) || 0;
                      const duration = slotDurationMinutes(slot);
                      return `<button class="agenda-item${slot.id === state.activeTimingSlotId ? " is-selected" : ""}${conflicts.has(slot.id) ? " has-conflict" : ""}" type="button" data-action="select-timing-slot" data-slot-id="${slot.id}"><span class="agenda-time">${escapeHtml(timelineLabel(offset))}</span><span><strong>${escapeHtml(timelineSlotName(slot))}</strong><small>${escapeHtml(slot.role || "Role open")} · ${duration} min</small></span><span class="agenda-end">${escapeHtml(timelineLabel(offset + duration))}</span></button>`;
                    })
                    .join("") || `<p class="agenda-empty">No artist assigned to this stage.</p>`}
                </div>
              </section>`;
          })
          .join("")}
      </div>`;
  }

  if (TIMELINE_ENGINE === "vis") {
    const minimumWidth = Math.max(760, 150 + (windowMinutes / 60) * 128);
    return `<div class="vis-timeline-shell"><div id="visTimeline" style="--timeline-canvas-width:${minimumWidth}px" aria-label="Artist stage timeline powered by vis-timeline"></div></div>`;
  }

  const gridHeight = Math.max(360, Math.round(windowMinutes / timelineStepMinutes()) * 18);
  const eventEndPercent = Math.min(100, (timelineWindowMinutes() / windowMinutes) * 100);
  const showsNewStage = stages.length < MAX_TIMELINE_STAGES;
  const columnCount = stages.length + Number(showsNewStage);
  return `
    <div class="vertical-schedule-shell">
      <div class="vertical-schedule" style="--stage-count:${columnCount};--schedule-height:${gridHeight}px;--minor-step:${(timelineStepMinutes() / windowMinutes) * 100}%;--hour-step:${(60 / windowMinutes) * 100}%;--event-end:${eventEndPercent}%">
        <div class="vertical-schedule-header">
          <span class="vertical-axis-title">Time</span>
          ${stages.map((stageName, stageIndex) => `<label class="vertical-stage-header ${stageToneClass(stageIndex)}"><span class="stage-color-key" aria-hidden="true"></span><span class="sr-only">Name for room or stage ${stageIndex + 1}</span><input class="stage-name-input" data-stage-name="${stageIndex}" value="${escapeHtml(stageName)}" aria-label="Name for room or stage ${stageIndex + 1}" /></label>`).join("")}
          ${showsNewStage ? '<span class="vertical-new-stage-header"><strong>New stage</strong><small>Drop an artist here</small></span>' : ""}
        </div>
        <div class="vertical-schedule-body">
          <div class="vertical-time-ruler" aria-hidden="true">${markers.map((offset) => `<span class="${offset % 60 === 0 ? "is-hour" : "is-minute"}" style="top:${(offset / windowMinutes) * 100}%">${escapeHtml(timelineLabel(offset))}</span>`).join("")}</div>
          ${stages.map((_, stageIndex) => `
            <div class="vertical-stage-track ${stageToneClass(stageIndex)}" data-stage-track data-stage-index="${stageIndex}">
              ${eventEndPercent < 100 ? '<span class="vertical-overflow-region" aria-hidden="true"></span>' : ""}
              ${state.slots.filter((slot) => Number(slot.stageIndex) === stageIndex).map((slot) => renderVerticalTimelineBlock(slot, conflicts, windowMinutes)).join("")}
            </div>`).join("")}
          ${showsNewStage ? '<div class="vertical-stage-track vertical-new-stage-track" data-stage-track data-new-stage="true"><span>+</span></div>' : ""}
          <span class="vertical-event-end" style="top:${eventEndPercent}%"><b>T+D</b><small>${escapeHtml(timelineEndLabel())}</small></span>
        </div>
      </div>
    </div>`;
}

function renderTimingComposer() {
  const composer = state.timingComposer;
  if (!composer) return "";
  const usedArtists = new Set(
    state.slots.filter((slot) => slot.mode === "known").map((slot) => slot.artist)
  );
  return `
    <div class="timing-inline-editor timing-composer" role="group" aria-label="Add artist to the agenda">
      <div class="timing-inline-heading">
        <span><strong>Add artist</strong><small>Placed at the first available ${timelineStepMinutes()}-minute position.</small></span>
      </div>
      <div class="timing-inline-fields timing-composer-fields">
        <label><span>Artist request</span><select data-composer-bind="artist">
          ${option("", "Choose artist…", composer.artist)}
          ${option("__help", "AAA recommendation", composer.artist)}
          ${ARTISTS.filter((artist) => !usedArtists.has(artist)).map((artist) => option(artist, artist, composer.artist)).join("")}
        </select></label>
        <label><span>Role in lineup</span><select data-composer-bind="role">${["Opening", "Support", "Headline", "Closing"].map((role) => option(role, role, composer.role)).join("")}</select></label>
        <label><span>Stage</span><select data-composer-bind="stageIndex">${ensureStageNames().map((stageName, index) => option(String(index), stageName, String(composer.stageIndex))).join("")}</select></label>
      </div>
      <div class="composer-actions">
        <button class="button" type="button" data-action="cancel-add-timing-artist">Cancel</button>
        <button class="button button-primary" type="button" data-action="confirm-add-timing-artist"${composer.artist ? "" : " disabled"}>Add to agenda</button>
      </div>
    </div>`;
}

function renderTimingEditor() {
  if (state.timingComposer) return renderTimingComposer();
  const slot = state.slots.find((item) => item.id === state.activeTimingSlotId) ?? state.slots[0];
  if (!slot) return `<div class="timing-editor-body"><p class="helper-copy">Add an artist slot before building the agenda.</p></div>`;
  const stages = ensureStageNames();
  const offset = Number(slot.timelineOffset) || 0;
  const duration = slotDurationMinutes(slot);
  const hasConflict = timingConflicts().has(slot.id);
  return `
    <div class="timing-editor-body">
      <div class="timing-editor-artist">
        <strong>${escapeHtml(timelineSlotName(slot))}</strong>
        <span>${escapeHtml(slot.role || "Role open")}</span>
      </div>
      ${hasConflict ? `<p class="timing-warning" role="status">This set overlaps another artist on the same stage. Adjust it or keep the conflict in the draft.</p>` : ""}
      <label class="field"><span class="field-label">Room / stage</span><select class="select" data-timing-bind="stageIndex" data-slot-id="${slot.id}">${stages.map((stageName, index) => option(String(index), stageName, String(slot.stageIndex))).join("")}</select></label>
      <div class="timing-editor-grid">
        <label class="field"><span class="field-label">Start (T)</span><select class="select" data-timing-bind="timelineOffset" data-slot-id="${slot.id}">${timingOffsetOptions(offset, duration)}</select></label>
        <label class="field"><span class="field-label">End (T+D)</span><select class="select" data-timing-bind="timelineEnd" data-slot-id="${slot.id}">${timingEndOptions(offset, duration)}</select></label>
      </div>
      <label class="field"><span class="field-label">Duration (D)</span><select class="select" data-timing-bind="duration" data-slot-id="${slot.id}">${timingDurationOptions(duration, offset)}</select></label>
      <div class="timing-nudge-actions">
        <button class="button" type="button" data-action="nudge-timing" data-direction="-${timelineStepMinutes()}" data-slot-id="${slot.id}">Earlier ${timelineStepMinutes()} min</button>
        <button class="button" type="button" data-action="nudge-timing" data-direction="${timelineStepMinutes()}" data-slot-id="${slot.id}">Later ${timelineStepMinutes()} min</button>
      </div>
    </div>`;
}

function renderTimingQuickEditor() {
  if (!state.timingQuickOpen || state.timingComposer || isMobileViewport()) return "";
  const slot = state.slots.find((item) => item.id === state.activeTimingSlotId);
  if (!slot) return "";
  const offset = Number(slot.timelineOffset) || 0;
  const duration = slotDurationMinutes(slot);
  return `
    <div class="timing-inline-editor" role="group" aria-label="Timing controls for ${escapeHtml(timelineSlotName(slot))}">
      <div class="timing-inline-heading">
        <span class="stage-color-key ${stageToneClass(slot.stageIndex)}" aria-hidden="true"></span>
        <span><strong>${escapeHtml(timelineSlotName(slot))}</strong><small>${escapeHtml(timelineLabel(offset))}–${escapeHtml(timelineLabel(offset + duration))} · ${duration} min</small></span>
        <button class="timing-inline-close" type="button" data-action="close-timing-quick" aria-label="Close timing controls"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button>
      </div>
      <div class="timing-inline-fields">
        <label><span>Stage</span><select data-timing-bind="stageIndex" data-slot-id="${slot.id}">${ensureStageNames().map((stageName, index) => option(String(index), stageName, String(slot.stageIndex))).join("")}</select></label>
        <label><span>Start</span><select data-timing-bind="timelineOffset" data-slot-id="${slot.id}">${timingOffsetOptions(offset, duration)}</select></label>
        <label><span>Duration</span><select data-timing-bind="duration" data-slot-id="${slot.id}">${timingDurationOptions(duration, offset)}</select></label>
      </div>
      <div class="timing-inline-actions">
        <button type="button" data-action="nudge-timing" data-direction="-${timelineStepMinutes()}" data-slot-id="${slot.id}">− ${timelineStepMinutes()} min</button>
        <button type="button" data-action="nudge-timing" data-direction="${timelineStepMinutes()}" data-slot-id="${slot.id}">+ ${timelineStepMinutes()} min</button>
      </div>
    </div>`;
}

function renderTimingMessages() {
  const conflicts = timingConflicts();
  const outsideSlots = slotsOutsideTimeline();
  return `
    ${conflicts.size ? `<p class="timing-warning timeline-conflict" role="status">${conflicts.size} artist blocks are involved in a same-stage overlap.</p>` : ""}
    ${outsideSlots.length ? `<p class="timing-warning timeline-conflict" role="status">${outsideSlots.length} ${outsideSlots.length === 1 ? "set extends" : "sets extend"} beyond T+D. Increase the event duration or move ${outsideSlots.length === 1 ? "it" : "them"} earlier.</p>` : ""}
    ${state.timelineNotice ? `<div class="timeline-notice" role="status"><span>${escapeHtml(state.timelineNotice)}</span>${state.timelineUndo ? `<button type="button" data-action="undo-timeline">Undo</button>` : ""}</div>` : ""}`;
}

function renderAgendaSummary() {
  const stages = ensureStageNames();
  const orderedSlots = [...state.slots].sort(
    (left, right) => Number(left.timelineOffset) - Number(right.timelineOffset)
  );
  const outsideSlots = slotsOutsideTimeline();
  return `
    <section class="agenda-summary" aria-labelledby="agendaSummaryTitle">
      <header class="agenda-summary-header">
        <div><h3 id="agendaSummaryTitle">Running order</h3><p>A compact view of the current custom plan.</p></div>
        <span>${state.slots.length} ${state.slots.length === 1 ? "artist" : "artists"} · ${stages.length} ${stages.length === 1 ? "stage" : "stages"}</span>
      </header>
      <ol class="agenda-summary-list">
        ${orderedSlots.map((slot) => {
          const offset = Number(slot.timelineOffset) || 0;
          const duration = slotDurationMinutes(slot);
          const outside = offset + duration > timelineWindowMinutes();
          return `<li${outside ? ' class="is-outside"' : ""}><time>${escapeHtml(timelineLabel(offset))}</time><span><strong>${escapeHtml(timelineSlotName(slot))}</strong><small>${escapeHtml(stages[Number(slot.stageIndex)] || `Stage ${Number(slot.stageIndex) + 1}`)} · ${escapeHtml(slot.role || "Role open")} · ${duration} min</small></span>${outside ? "<em>Outside T+D</em>" : ""}</li>`;
        }).join("")}
      </ol>
    </section>`;
}

function renderTimingInlinePanel() {
  if (state.timingComposer) return renderTimingComposer();
  if (state.slots.length <= 1) return "";
  if (isMobileViewport()) return renderTimingEditor();
  return renderTimingQuickEditor();
}

function timingStatusLabel() {
  return {
    unstarted: "Not generated",
    suggested: "Suggested",
    customised: "Customised",
    stale: "Needs refresh",
  }[state.timingsStatus];
}

function agendaStatusLabel() {
  if (state.agendaMode === "aaa") return "AAA arranges";
  if (state.timingsStatus === "suggested") return "Custom draft";
  return timingStatusLabel();
}

function refreshTimingChrome() {
  const messages = document.querySelector("#timingMessages");
  const inlinePanel = document.querySelector("#timingInlinePanel");
  const status = document.querySelector("#timingStatus");
  const endReadout = document.querySelector(".timeline-toolbar-readout strong");
  const summary = document.querySelector("#agendaSummary");
  if (messages) messages.innerHTML = renderTimingMessages();
  if (inlinePanel) {
    inlinePanel.innerHTML = renderTimingInlinePanel();
    inlinePanel.classList.toggle("is-open", Boolean(inlinePanel.innerHTML.trim()));
  }
  if (status) status.textContent = agendaStatusLabel();
  if (endReadout) endReadout.textContent = timelineEndLabel();
  if (summary) summary.innerHTML = renderAgendaSummary();
  document.querySelectorAll('[data-action="set-timeline-grid"]').forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.step) === timelineStepMinutes()));
  });
  document.querySelectorAll('[data-action="set-time-format"]').forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.format === state.timeFormat));
  });
}

function syncVerticalTimeline({ data = true, groups = false, window = false } = {}) {
  const board = document.querySelector("#timelineBoard");
  if (!board) return false;
  if (isMobileViewport() || state.slots.length <= 1) {
    board.innerHTML = renderTimelineBoard();
    return true;
  }
  if (groups || window) {
    const existingBlocks = new Map(
      [...board.querySelectorAll("[data-timeline-slot]")].map((block) => [block.dataset.slotId, block])
    );
    const template = document.createElement("template");
    template.innerHTML = renderTimelineBoard();
    template.content.querySelectorAll("[data-timeline-slot]").forEach((placeholder) => {
      const existingBlock = existingBlocks.get(placeholder.dataset.slotId);
      if (existingBlock) placeholder.replaceWith(existingBlock);
    });
    board.replaceChildren(template.content);
  }
  if (data) {
    const displayMinutes = timelineDisplayMinutes();
    for (const slot of state.slots) {
      const block = board.querySelector(`[data-timeline-slot][data-slot-id="${slot.id}"]`);
      if (!block) continue;
      const offset = Number(slot.timelineOffset) || 0;
      const duration = slotDurationMinutes(slot);
      const targetTrack = board.querySelector(`[data-stage-track][data-stage-index="${Number(slot.stageIndex) || 0}"]`);
      if (targetTrack && block.parentElement !== targetTrack) targetTrack.append(block);
      block.style.removeProperty("transform");
      block.style.setProperty("--block-start", `${(offset / displayMinutes) * 100}%`);
      block.style.setProperty("--block-size", `${(duration / displayMinutes) * 100}%`);
      for (let stageIndex = 0; stageIndex < 6; stageIndex += 1) {
        block.classList.remove(stageToneClass(stageIndex));
      }
      block.classList.add(stageToneClass(slot.stageIndex));
      block.classList.toggle("is-selected", slot.id === state.activeTimingSlotId);
      block.classList.toggle("has-conflict", timingConflicts().has(slot.id));
      block.querySelector(".vertical-block-time").textContent = `${timelineLabel(offset)}–${timelineLabel(offset + duration)}`;
      block.querySelector(".vertical-block-detail").textContent = `${slot.role || "Role open"} · ${duration} min`;
      block.querySelector(".vertical-resize-start small").textContent = timelineLabel(offset);
      block.querySelector(".vertical-resize-end small").textContent = timelineLabel(offset + duration);
    }
  } else {
    board.querySelectorAll("[data-timeline-slot]").forEach((block) => {
      block.classList.toggle("is-selected", Number(block.dataset.slotId) === state.activeTimingSlotId);
    });
  }
  return true;
}

function updateTimingsInPlace({ data = true, groups = false, window = false } = {}) {
  if (
    state.step === 2 &&
    TIMELINE_ENGINE === "vis" &&
    !isMobileViewport() &&
    syncVisTimeline({ data, groups, window })
  ) {
    refreshTimingChrome();
    return;
  }
  if (state.step === 2 && TIMELINE_ENGINE !== "vis" && syncVerticalTimeline({ data, groups, window })) {
    refreshTimingChrome();
    return;
  }
  render();
}

function renderTimingsStep() {
  const hasPlanner = state.slots.length > 1;
  const customAgenda = state.agendaMode === "custom";
  return `
    ${renderStepHeader("Plan the night", "Share as much or as little as you know. AAA can shape the running order, or you can fine-tune it yourself.")}
    ${renderError()}
    <div class="timing-layout">
      <section class="panel timeline-panel">
        <header class="panel-header timeline-panel-header">
          <h2 class="panel-title">Running order</h2>
          <div class="timeline-header-status">${TIMELINE_ENGINE === "vis" ? `<span class="engine-chip">${isMobileViewport() ? "MOBILE FALLBACK" : "VIS-TIMELINE SPIKE"}</span>` : ""}<span class="timing-status" id="timingStatus">${escapeHtml(agendaStatusLabel())}</span></div>
        </header>
        <div class="timeline-panel-body">
          ${renderAgendaModeChooser()}
          ${customAgenda ? `
            <div class="custom-agenda">
              ${renderTimelineToolbar()}
              <div id="timingMessages">${renderTimingMessages()}</div>
              <div class="schedule-workspace">
                ${renderAgendaToolbar()}
                ${state.timingComposer ? `<div class="timing-inline-panel is-open" id="timingInlinePanel">${renderTimingInlinePanel()}</div>` : ""}
                <div id="timelineBoard">${renderTimelineBoard()}</div>
                ${!state.timingComposer ? `<div class="timing-inline-panel${renderTimingInlinePanel() ? " is-open" : ""}" id="timingInlinePanel">${renderTimingInlinePanel()}</div>` : ""}
              </div>
              <p class="timeline-help">${!hasPlanner ? "Add another artist when you need to coordinate several sets." : isMobileViewport() ? "Select an artist to adjust its stage, start and duration." : TIMELINE_ENGINE === "vis" ? "Drag a block to move it. Use either edge for T or T+D, or drop it on New stage to create another lane." : "Drag a set vertically to change its time, across to change stage, or onto New stage to create a column. Use the top and bottom edges to resize."}</p>
              <div id="agendaSummary">${renderAgendaSummary()}</div>
            </div>` : renderConciergePlan()}
          <button class="timeline-edit-event" type="button" data-action="go-step" data-step="1">Edit event details</button>
          ${customAgenda && TIMELINE_ENGINE === "vis" ? '<p class="timeline-engine-note">Dependency prototype · <a href="./#timings">Compare handmade timeline</a></p>' : ""}
        </div>
      </section>
    </div>
    ${renderActionDock("Next: budget")}`;
}

function renderBudgetStep() {
  const openSlots = state.slots.filter((slot) => slot.mode === "help").length;
  return `
    ${renderStepHeader("Set the total budget", "Give one total fee range for every AAA artist in this enquiry — never an amount per slot.")}
    ${renderError()}
    <div class="content-layout">
      <section class="panel">
        <div class="budget-editor">
          <p class="budget-value">${escapeHtml(state.budget.currency)} ${escapeHtml(state.budget.range || "—")}</p>
          <div class="editor-fields">
            <label class="field"><span class="field-label">Currency</span><select class="select" data-bind="budget.currency">${["EUR", "GBP", "USD"].map((value) => option(value, value, state.budget.currency)).join("")}</select></label>
            <label class="field"><span class="field-label">Total budget / fee offer <span class="field-hint">(optional)</span></span><select class="select" data-bind="budget.range">${["", "Under 1,000", "1,000–2,500", "2,500–5,000", "5,000–10,000", "10,000–25,000", "25,000–50,000", "50,000+", "Prefer to discuss"].map((value) => option(value, value || "Select total range…", state.budget.range)).join("")}</select></label>
          </div>
        </div>
      </section>
      <aside class="panel summary-panel">
        <header class="panel-header"><h2 class="panel-title">Budget applies to</h2></header>
        <div class="summary-body">
          <div class="summary-row"><span class="summary-label">All artist slots</span><span class="summary-value">${state.slots.length}</span></div>
          <div class="summary-row"><span class="summary-label">Selected artists</span><span class="summary-value">${state.slots.length - openSlots}</span></div>
          <div class="summary-row"><span class="summary-label">Help me choose</span><span class="summary-value">${openSlots}</span></div>
          <div class="summary-row"><span class="summary-value">Final fees and artist availability are discussed by the booking team.</span></div>
        </div>
      </aside>
    </div>
    ${renderActionDock("Next: contact")}`;
}

function renderContactStep() {
  const whatsapp = state.contact.whatsappMode;
  return `
    ${renderStepHeader("Who should we contact?", "Add the organiser’s details after the artist request and event brief are clear.")}
    ${renderError()}
    <div class="content-layout">
      <section class="panel">
        <div class="form-grid">
          <label class="field"><span class="field-label">Your name *</span><input class="input" data-bind="contact.name" value="${escapeHtml(state.contact.name)}" placeholder="Jane Smith" autocomplete="name" aria-invalid="${Boolean(state.error && !state.contact.name)}" /></label>
          <label class="field"><span class="field-label">Email address *</span><input class="input" type="email" data-bind="contact.email" value="${escapeHtml(state.contact.email)}" placeholder="jane@example.com" autocomplete="email" aria-invalid="${Boolean(state.error && !state.contact.email)}" /></label>
          <label class="field full"><span class="field-label">Company / promoter</span><input class="input" data-bind="contact.company" value="${escapeHtml(state.contact.company)}" placeholder="Your venue, brand or agency" autocomplete="organization" /></label>
          <label class="field full"><span class="field-label">Phone number <span class="field-hint">(optional)</span></span><span class="phone-row"><select class="select" data-bind="contact.phoneCode" aria-label="Phone country code">${[["", "Country code"], ["+31", "NL +31"], ["+44", "GB +44"], ["+49", "DE +49"], ["+55", "BR +55"], ["+358", "FI +358"]].map(([value, label]) => option(value, label, state.contact.phoneCode)).join("")}</select><input class="input" type="tel" data-bind="contact.phone" value="${escapeHtml(state.contact.phone)}" placeholder="Phone number" autocomplete="tel-national" /></span></label>
          <div class="field full"><span class="field-label">WhatsApp <span class="field-hint">(optional)</span></span><div class="contact-methods">${[["none", "None"], ["same", "Same as phone"], ["different", "Different number"], ["username", "Username"]].map(([value, label]) => `<label><input type="radio" name="whatsappMode" value="${value}" data-bind="contact.whatsappMode"${whatsapp === value ? " checked" : ""} /> ${label}</label>`).join("")}</div></div>
          ${whatsapp === "different" ? `<label class="field full"><span class="field-label">WhatsApp number</span><input class="input" type="tel" data-bind="contact.whatsapp" value="${escapeHtml(state.contact.whatsapp)}" placeholder="International WhatsApp number" /></label>` : ""}
          ${whatsapp === "username" ? `<label class="field full"><span class="field-label">WhatsApp username</span><input class="input" data-bind="contact.whatsapp" value="${escapeHtml(state.contact.whatsapp)}" placeholder="Username without @" /></label>` : ""}
          <label class="field full"><span class="field-label">Anything else? <span class="field-hint">(optional)</span></span><textarea class="textarea" data-bind="contact.message" placeholder="Add context that will help the booking conversation…">${escapeHtml(state.contact.message)}</textarea></label>
        </div>
      </section>
      <aside class="panel summary-panel">
        <header class="panel-header"><h2 class="panel-title">Why we ask</h2></header>
        <div class="summary-body">
          <div class="summary-row"><span class="summary-value">The booking team needs a name and email to continue the enquiry.</span></div>
          <div class="summary-row"><span class="summary-value">Phone and WhatsApp remain optional.</span></div>
          <div class="summary-row"><span class="summary-value">This prototype stores nothing and sends nothing.</span></div>
        </div>
      </aside>
    </div>
    ${renderActionDock("Review enquiry")}`;
}

function renderReviewStep() {
  if (state.submitted) {
    return `
      <section class="success-state">
        <div>
          <span class="success-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"></path></svg></span>
          <h1 tabindex="-1">Prototype complete</h1>
          <p>No enquiry was sent. This confirms the proposed end-to-end interaction, including a mixed lineup and one total event budget.</p>
          <button class="button button-primary" type="button" data-action="restart">Restart prototype</button>
        </div>
      </section>`;
  }

  return `
    ${renderStepHeader("Review your enquiry", "Check the shared event and every artist slot before the intended production submission.")}
    <div class="review-stack">
      <section class="review-section">
        <header class="review-header"><h2 class="panel-title">Artist lineup</h2><button class="review-edit" type="button" data-action="go-step" data-step="0">Edit</button></header>
        <div class="review-content"><ol class="review-lineup">${state.slots.map((slot, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(slotName(slot))}</strong><span>${escapeHtml(slot.role || "Role open")} · ${escapeHtml(slot.energy || "Any energy")}</span></li>`).join("")}</ol></div>
      </section>
      <section class="review-section">
        <header class="review-header"><h2 class="panel-title">Event</h2><button class="review-edit" type="button" data-action="go-step" data-step="1">Edit</button></header>
        <div class="review-content"><p><span class="summary-label">Date</span><br />${escapeHtml(formatEventDate())}</p><p><span class="summary-label">Event hours</span><br />${escapeHtml(formatEventHours())}</p><p><span class="summary-label">Event</span><br />${escapeHtml(state.event.name || "Not added")}</p><p><span class="summary-label">Venue</span><br />${escapeHtml(state.event.venue || "Not added")}</p><p><span class="summary-label">Rooms / stages</span><br />${escapeHtml(state.event.roomsStages || "Not added")}</p><p><span class="summary-label">Location</span><br />${escapeHtml([state.event.city, state.event.country].filter(Boolean).join(", ") || "Not added")}</p></div>
      </section>
      <section class="review-section">
        <header class="review-header"><h2 class="panel-title">Timings</h2><button class="review-edit" type="button" data-action="go-step" data-step="2">Edit</button></header>
        <div class="review-content"><ol class="review-lineup">${timingSlots().map((slot, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(slotName(slot))}</strong><span>${escapeHtml(ensureStageNames()[Number(slot.stageIndex)] || `Stage ${Number(slot.stageIndex) + 1}`)} · ${escapeHtml(slot.role || "Role open")} · ${escapeHtml(durationLabel(slot))}</span></li>`).join("")}</ol></div>
      </section>
      <section class="review-section">
        <header class="review-header"><h2 class="panel-title">Total budget</h2><button class="review-edit" type="button" data-action="go-step" data-step="3">Edit</button></header>
        <div class="review-content"><p><span class="summary-label">All requested artists</span><br />${escapeHtml(state.budget.currency)} ${escapeHtml(state.budget.range || "Not added")}</p></div>
      </section>
      <section class="review-section">
        <header class="review-header"><h2 class="panel-title">Contact</h2><button class="review-edit" type="button" data-action="go-step" data-step="4">Edit</button></header>
        <div class="review-content"><p><span class="summary-label">Name</span><br />${escapeHtml(state.contact.name || "Not added")}</p><p><span class="summary-label">Email</span><br />${escapeHtml(state.contact.email || "Not added")}</p></div>
      </section>
    </div>
    <p class="prototype-disclaimer">Prototype only. The production version would apply validation, Turnstile verification, privacy handling, and the existing first-party enquiry pipeline.</p>
    ${renderActionDock("Send enquiry · prototype", { final: true })}`;
}

function render() {
  if (visMountFrame !== null) {
    window.cancelAnimationFrame(visMountFrame);
    visMountFrame = null;
  }
  visTimelineInstance?.destroy();
  visTimelineInstance = null;
  visItemsData = null;
  visGroupsData = null;
  renderProgress();
  const renderers = [
    renderArtistsStep,
    renderEventStep,
    renderTimingsStep,
    renderBudgetStep,
    renderContactStep,
    renderReviewStep,
  ];
  workArea.innerHTML = renderers[state.step]();
  workArea.classList.remove("step-reveal");
  void workArea.offsetWidth;
  workArea.classList.add("step-reveal");
  if (state.step === 2 && TIMELINE_ENGINE === "vis" && !isMobileViewport()) {
    visMountFrame = window.requestAnimationFrame(() => {
      visMountFrame = null;
      mountVisTimeline();
    });
  }
}

function validateCurrentStep() {
  state.error = "";
  if (state.step === 0) {
    if (state.slots.length === 0) {
      state.error = "Add at least one artist slot to continue.";
      return false;
    }
    const incomplete = state.slots.find(
      (slot) => slot.mode === "empty" || (slot.mode === "known" && !slot.artist)
    );
    if (incomplete) {
      state.activeSlotId = incomplete.id;
      state.error = "Choose an artist or select Help me choose for every slot.";
      return false;
    }
  }
  if (state.step === 1 && state.event.dateMode === "confirmed" && !state.event.date) {
    state.error = "Choose the event date or select Date not confirmed yet.";
    return false;
  }
  if (
    state.step === 1 &&
    state.event.timeMode === "confirmed" &&
    (!state.event.start || !state.event.end)
  ) {
    state.error = "Add the event start and end times or select Time not confirmed yet.";
    return false;
  }
  if (state.step === 1 && !state.event.roomsStages) {
    state.error = "Choose the number of rooms or stages, or select Not confirmed yet.";
    return false;
  }
  if (state.step === 4) {
    if (!state.contact.name.trim() || !state.contact.email.trim()) {
      state.error = "Add the contact name and email address to review the enquiry.";
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email)) {
      state.error = "Enter a complete email address, such as jane@example.com.";
      return false;
    }
  }
  return true;
}

function focusError() {
  window.requestAnimationFrame(() => {
    document.querySelector(".form-error")?.focus();
  });
}

function goToStep(step) {
  const nextStep = Math.max(0, Math.min(STEPS.length - 1, Number(step)));
  if (
    nextStep === 2 &&
    (state.timingsStatus === "unstarted" ||
      (state.agendaMode === "aaa" && state.timingsStatus === "stale"))
  ) {
    const confirmedDuration = eventWindowMinutes();
    if (confirmedDuration !== null) state.timelineDuration = Math.max(120, confirmedDuration);
    applyTimingSuggestions({ shouldAnnounce: false });
  }
  state.step = nextStep;
  state.error = "";
  state.submitted = false;
  history.replaceState(null, "", `#${STEPS[state.step].id}`);
  render();
  revealActiveProgress();
  queueFocus(".step-header h1");
  window.scrollTo({ top: 0, behavior: "smooth" });
  announce(`${STEPS[state.step].label} step opened.`);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "go-step") goToStep(target.dataset.step);
  if (action === "back" && state.step > 0) goToStep(state.step - 1);
  if (action === "next") {
    if (!validateCurrentStep()) {
      render();
      focusError();
      return;
    }
    goToStep(state.step + 1);
  }
  if (action === "select-slot") {
    state.activeSlotId = Number(target.dataset.slotId);
    state.error = "";
    render();
    queueFocus(".slot-editor");
    announce(`Editing ${slotName(activeSlot())}.`);
    if (isMobileViewport()) {
      window.requestAnimationFrame(() => {
        document.querySelector(".mobile-slot-editor")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    }
  }
  if (action === "add-slot") {
    if (state.slots.length >= 12) return;
    const slot = {
      id: state.nextSlotId++,
      mode: "empty",
      artist: "",
      role: "",
      energy: "Any",
      bpmMin: "",
      bpmMax: "",
      stageIndex: 0,
      timelineOffset: 0,
      timingMode: "duration",
      preferredDuration: "",
      duration: "",
      start: "",
      finish: "",
      timingSource: "suggested",
    };
    state.slots.push(slot);
    if (state.timingsStatus !== "unstarted") state.timingsStatus = "stale";
    state.activeSlotId = slot.id;
    state.activeTimingSlotId = slot.id;
    state.error = "";
    render();
    queueFocus(".slot-editor");
    announce(`Artist slot ${state.slots.length} added.`);
  }
  if (action === "remove-slot") {
    const id = Number(target.dataset.slotId);
    const removed = state.slots.find((slot) => slot.id === id);
    state.slots = state.slots.filter((slot) => slot.id !== id);
    if (state.timingsStatus !== "unstarted") state.timingsStatus = "stale";
    if (state.activeSlotId === id) state.activeSlotId = state.slots[0]?.id ?? null;
    if (state.activeTimingSlotId === id) state.activeTimingSlotId = state.slots[0]?.id ?? null;
    render();
    queueFocus(
      state.activeSlotId === null
        ? '[data-action="add-slot"]'
        : `[data-action="select-slot"][data-slot-id="${state.activeSlotId}"]`
    );
    announce(`${removed ? slotName(removed) : "Artist slot"} removed.`);
  }
  if (action === "set-slot-mode") {
    const slot = activeSlot();
    if (!slot) return;
    slot.mode = target.dataset.mode;
    if (slot.mode === "help") slot.artist = "";
    if (state.timingsStatus !== "unstarted") state.timingsStatus = "stale";
    state.error = "";
    render();
    queueFocus(`[data-action="set-slot-mode"][data-mode="${slot.mode}"]`);
    announce(slot.mode === "help" ? "Recommendation slot selected." : "Known artist slot selected.");
  }
  if (action === "select-timing-slot") {
    state.timingComposer = null;
    state.activeTimingSlotId = Number(target.dataset.slotId);
    state.timingQuickOpen = !isMobileViewport();
    updateTimingsInPlace({ data: false });
    if (isMobileViewport()) {
      window.requestAnimationFrame(() => {
        document.querySelector("#timingInlinePanel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    announce(`Editing the set for ${slotName(state.slots.find((slot) => slot.id === state.activeTimingSlotId))}.`);
  }
  if (action === "set-agenda-mode") {
    state.agendaMode = target.dataset.mode === "custom" ? "custom" : "aaa";
    state.timingComposer = null;
    state.timingQuickOpen = false;
    if (state.agendaMode === "aaa") applyTimingSuggestions({ shouldAnnounce: false });
    render();
    queueFocus(`[data-action="set-agenda-mode"][data-mode="${state.agendaMode}"]`);
    announce(state.agendaMode === "aaa" ? "AAA will propose the running order." : "Custom timing agenda opened.");
  }
  if (action === "close-timing-quick") {
    state.timingQuickOpen = false;
    updateTimingsInPlace({ data: false });
    announce("Quick timing controls closed.");
  }
  if (action === "set-timeline-grid") {
    state.timelineStep = Number(target.dataset.step);
    state.timingsStatus = "customised";
    state.timelineNotice = `Snap changed to ${timelineStepMinutes()} minutes. Existing set times were preserved.`;
    state.timelineUndo = null;
    updateTimingsInPlace({ window: true });
    queueFocus(`[data-action="set-timeline-grid"][data-step="${timelineStepMinutes()}"]`);
    announce(`Timeline now snaps every ${timelineStepMinutes()} minutes.`);
  }
  if (action === "set-time-format") {
    state.timeFormat = target.dataset.format === "12" ? "12" : "24";
    state.timelineNotice = `Times are now shown in ${state.timeFormat}-hour format.`;
    updateTimingsInPlace({ window: true });
    queueFocus(`[data-action="set-time-format"][data-format="${state.timeFormat}"]`);
    announce(`Using ${state.timeFormat}-hour time.`);
  }
  if (action === "nudge-timing") {
    const slot = state.slots.find((item) => item.id === Number(target.dataset.slotId));
    if (!slot) return;
    const snapshot = captureTimelineState();
    updateSlotTimeline(
      slot,
      Number(slot.timelineOffset) + Number(target.dataset.direction),
      slotDurationMinutes(slot),
      timelineDisplayMinutes()
    );
    autoArrangeAround(slot, snapshot, `${slotName(slot)} moved to ${timelineLabel(Number(slot.timelineOffset))}`);
    updateTimingsInPlace();
    queueFocus(`[data-action="nudge-timing"][data-direction="${target.dataset.direction}"]`);
    announce(`${slotName(slot)} moved to ${timelineLabel(Number(slot.timelineOffset))}.`);
  }
  if (action === "begin-add-timing-artist") {
    state.timingQuickOpen = false;
    const activeTimingSlot = state.slots.find((slot) => slot.id === state.activeTimingSlotId);
    state.timingComposer = {
      stageIndex: Number(activeTimingSlot?.stageIndex) || 0,
      artist: "",
      role: "Support",
    };
    updateTimingsInPlace({ data: false });
    queueFocus('select[data-composer-bind="artist"]');
    if (isMobileViewport()) {
      window.requestAnimationFrame(() => {
        document.querySelector("#timingInlinePanel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    announce(`Adding an artist to ${ensureStageNames()[state.timingComposer.stageIndex]}.`);
  }
  if (action === "cancel-add-timing-artist") {
    state.timingComposer = null;
    updateTimingsInPlace({ data: false });
    queueFocus(`[data-action="begin-add-timing-artist"]`);
    announce("Artist addition cancelled.");
  }
  if (action === "confirm-add-timing-artist") {
    const composer = state.timingComposer;
    if (!composer?.artist || state.slots.length >= 12) return;
    const snapshot = captureTimelineState();
    const duration = ROLE_TIMING_SUGGESTIONS[composer.role]?.duration ?? 60;
    const slot = {
      id: state.nextSlotId++,
      mode: composer.artist === "__help" ? "help" : "known",
      artist: composer.artist === "__help" ? "" : composer.artist,
      role: composer.role,
      energy: "Any",
      bpmMin: "",
      bpmMax: "",
      stageIndex: composer.stageIndex,
      timelineOffset: firstAvailableOffsetForStage(composer.stageIndex, duration),
      timingMode: "duration",
      preferredDuration: "",
      duration: String(duration),
      start: "",
      finish: "",
      timingSource: "suggested",
    };
    state.slots.push(slot);
    state.activeSlotId = slot.id;
    state.activeTimingSlotId = slot.id;
    state.timingComposer = null;
    state.timingQuickOpen = !isMobileViewport();
    updateSlotTimeline(slot, slot.timelineOffset, duration);
    autoArrangeAround(slot, snapshot, `${slotName(slot)} added to ${ensureStageNames()[slot.stageIndex]}`);
    updateTimingsInPlace({ groups: true });
    announce(`${slotName(slot)} added to the agenda.`);
  }
  if (action === "add-timing-stage") {
    const currentCount = requestedStageCount();
    if (currentCount >= MAX_TIMELINE_STAGES) return;
    const snapshot = captureTimelineState();
    ensureStageNames();
    state.stageNames.push(nextStageName());
    const nextCount = currentCount + 1;
    state.event.roomsStages = String(nextCount);
    state.timelineUndo = snapshot;
    state.timelineNotice = `Stage ${nextCount} added. The event now has ${nextCount} stages / rooms.`;
    state.timingsStatus = "customised";
    updateTimingsInPlace({ groups: true });
    queueFocus(`input[data-stage-name="${currentCount}"]`);
    announce(`Stage ${nextCount} added.`);
  }
  if (action === "undo-timeline") {
    if (!state.timelineUndo) return;
    const snapshot = state.timelineUndo;
    restoreTimelineState(snapshot);
    state.timelineUndo = null;
    state.timelineNotice = "Previous timeline restored.";
    updateTimingsInPlace({ groups: true, window: true });
    queueFocus(".timeline-toolbar-input");
    announce("Previous timeline restored.");
  }
  if (action === "submit-demo") {
    state.submitted = true;
    render();
    queueFocus(".success-state h1");
    window.scrollTo({ top: 0, behavior: "smooth" });
    announce("Prototype complete. No enquiry was sent.");
  }
  if (action === "restart") {
    state = initialState();
    goToStep(0);
  }
});

function updateBoundControl(target) {
  const value = target.type === "checkbox" ? String(target.checked) : target.value;
  const timelineSnapshot = target.dataset.timingBind ? captureTimelineState() : null;
  if (target.dataset.agendaBind) {
    if (target.dataset.agendaBind === "start") {
      state.event.start = value;
      state.event.timeMode = value ? "confirmed" : "tbc";
      state.event.end = value
        ? minutesToTime(timeToMinutes(value) + timelineWindowMinutes())
        : "";
    }
    if (target.dataset.agendaBind === "duration") {
      state.timelineDuration = Number(value);
      if (state.event.start) {
        state.event.timeMode = "confirmed";
        state.event.end = minutesToTime(timeToMinutes(state.event.start) + state.timelineDuration);
      }
    }
    state.timingsStatus = "customised";
    state.timelineNotice = "Event window updated. Existing set positions were preserved.";
    state.timelineUndo = null;
  }
  if (target.dataset.bind) {
    setNested(target.dataset.bind, value);
    if (target.dataset.bind === "event.roomsStages") {
      const chosenCount = Number(value) || 1;
      state.stageNames = state.stageNames.slice(0, chosenCount);
      const lastStageIndex = requestedStageCount() - 1;
      for (const item of state.slots) item.stageIndex = Math.min(Number(item.stageIndex) || 0, lastStageIndex);
      if (state.timingsStatus !== "unstarted") state.timingsStatus = "stale";
    }
    if (target.dataset.bind === "event.timeMode") {
      if (value === "tbc") {
        state.event.start = "";
        state.event.end = "";
      }
      if (state.timingsStatus !== "unstarted") state.timingsStatus = "stale";
    }
    if (
      (target.dataset.bind === "event.start" || target.dataset.bind === "event.end") &&
      state.timingsStatus !== "unstarted"
    ) {
      state.timingsStatus = "stale";
    }
  }

  const slotId = Number(target.dataset.slotId);
  const slot = state.slots.find((item) => item.id === slotId);
  if (target.dataset.stageName !== undefined) {
    ensureStageNames();
    state.stageNames[Number(target.dataset.stageName)] = value.trimStart();
  }
  if (target.dataset.composerBind && state.timingComposer) {
    state.timingComposer[target.dataset.composerBind] = target.dataset.composerBind === "stageIndex"
      ? Number(value)
      : value;
  }
  if (slot && target.dataset.slotBind) {
    slot[target.dataset.slotBind] = value;
    if (
      ["role", "preferredDuration"].includes(target.dataset.slotBind) &&
      state.timingsStatus !== "unstarted"
    ) {
      state.timingsStatus = "stale";
    }
  }
  if (slot && target.dataset.slotSchedule) {
    slot[target.dataset.slotSchedule] = value;
    state.timingsStatus = "customised";
  }
  if (slot && target.dataset.timingBind) {
    let removedStages = [];
    if (target.dataset.timingBind === "stageIndex") {
      slot.stageIndex = Number(value);
      removedStages = removeEmptyStages();
    }
    if (target.dataset.timingBind === "timelineOffset") {
      updateSlotTimeline(slot, Number(value), slotDurationMinutes(slot), timelineDisplayMinutes());
    }
    if (target.dataset.timingBind === "duration") {
      updateSlotTimeline(slot, Number(slot.timelineOffset), Number(value), timelineDisplayMinutes());
    }
    if (target.dataset.timingBind === "timelineEnd") {
      updateSlotTimeline(slot, Number(slot.timelineOffset), Number(value) - Number(slot.timelineOffset), timelineDisplayMinutes());
    }
    autoArrangeAround(
      slot,
      timelineSnapshot,
      `${slotName(slot)} updated${removedStages.length ? `. ${removedStages.join(", ")} removed` : ""}`
    );
  }
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  updateBoundControl(target);
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  const focusSelector = stableControlSelector(target);
  updateBoundControl(target);
  state.error = "";
  if (state.step === 2 && target.dataset.composerBind) {
    refreshTimingChrome();
    queueFocus(focusSelector);
    return;
  }
  if (state.step === 2 && target.dataset.timingBind) {
    updateTimingsInPlace({ groups: target.dataset.timingBind === "stageIndex" });
    queueFocus(focusSelector);
    return;
  }
  if (state.step === 2 && target.dataset.agendaBind) {
    updateTimingsInPlace({ window: true });
    queueFocus(focusSelector);
    return;
  }
  // Re-render only controls that change the visible structure or a live summary.
  // Replacing the DOM when a text/date input blurs can remove the button the
  // pointer is moving toward and swallow its click.
  if (target instanceof HTMLSelectElement || target.type === "radio") {
    render();
    queueFocus(focusSelector);
  }
});

let timelineDrag = null;

document.addEventListener("pointerdown", (event) => {
  const dragTarget = event.target.closest("[data-timeline-drag]");
  if (!dragTarget || event.button !== 0) return;
  const slot = state.slots.find((item) => item.id === Number(dragTarget.dataset.slotId));
  const track = dragTarget.closest("[data-stage-track], .timeline-track");
  const block = dragTarget.closest("[data-timeline-slot], .timeline-block");
  if (!slot || !track || !block) return;
  event.preventDefault();
  dragTarget.setPointerCapture(event.pointerId);
  state.activeTimingSlotId = slot.id;
  block.classList.add("is-selected", "is-dragging");
  timelineDrag = {
    pointerId: event.pointerId,
    mode: dragTarget.dataset.timelineDrag,
    startX: event.clientX,
    startY: event.clientY,
    vertical: block.hasAttribute("data-timeline-slot"),
    trackWidth: track.getBoundingClientRect().width,
    trackHeight: track.getBoundingClientRect().height,
    windowMinutes: timelineDisplayMinutes(),
    initialOffset: Number(slot.timelineOffset) || 0,
    initialDuration: slotDurationMinutes(slot),
    offset: Number(slot.timelineOffset) || 0,
    duration: slotDurationMinutes(slot),
    stageIndex: Number(slot.stageIndex) || 0,
    block,
    slot,
    snapshot: captureTimelineState(),
  };
});

document.addEventListener("pointermove", (event) => {
  if (!timelineDrag || timelineDrag.pointerId !== event.pointerId) return;
  const trackSelector = timelineDrag.vertical ? ".vertical-stage-track" : ".timeline-track";
  const targetLane = [...document.querySelectorAll(trackSelector)].find((track) => {
    const bounds = track.getBoundingClientRect();
    return timelineDrag.vertical
      ? event.clientX >= bounds.left && event.clientX <= bounds.right
      : event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  });
  document.querySelectorAll(trackSelector).forEach((track) => {
    track.classList.toggle("is-drop-target", track === targetLane && timelineDrag.mode === "move");
  });
  if (targetLane) {
    timelineDrag.stageIndex = targetLane.dataset.newStage === "true"
      ? NEW_STAGE_GROUP_ID
      : Number(targetLane.dataset.stageIndex);
  }
  const step = timelineStepMinutes();
  const delta = Math.round(
    ((timelineDrag.vertical
      ? (event.clientY - timelineDrag.startY) / timelineDrag.trackHeight
      : (event.clientX - timelineDrag.startX) / timelineDrag.trackWidth
    ) * timelineDrag.windowMinutes) / step
  ) * step;
  const end = timelineDrag.initialOffset + timelineDrag.initialDuration;
  if (timelineDrag.mode === "move") {
    timelineDrag.offset = Math.max(
      0,
      Math.min(timelineDrag.initialOffset + delta, timelineDrag.windowMinutes - timelineDrag.initialDuration)
    );
  }
  if (timelineDrag.mode === "resize-start") {
    timelineDrag.offset = Math.max(0, Math.min(timelineDrag.initialOffset + delta, end - 30));
    timelineDrag.duration = end - timelineDrag.offset;
  }
  if (timelineDrag.mode === "resize-end") {
    timelineDrag.duration = Math.max(
      30,
      Math.min(timelineDrag.initialDuration + delta, timelineDrag.windowMinutes - timelineDrag.initialOffset)
    );
  }
  timelineDrag.block.style.setProperty("--block-start", `${(timelineDrag.offset / timelineDrag.windowMinutes) * 100}%`);
  timelineDrag.block.style.setProperty(
    timelineDrag.vertical ? "--block-size" : "--block-width",
    `${(timelineDrag.duration / timelineDrag.windowMinutes) * 100}%`
  );
  if (timelineDrag.mode === "move") {
    timelineDrag.block.style.transform = timelineDrag.vertical
      ? `translateX(${event.clientX - timelineDrag.startX}px)`
      : `translateY(${event.clientY - timelineDrag.startY}px)`;
  }
  const startLabel = timelineDrag.block.querySelector(".timeline-resize-start small, .vertical-resize-start small");
  const endLabel = timelineDrag.block.querySelector(".timeline-resize-end small, .vertical-resize-end small");
  const timingCopy = timelineDrag.block.querySelector(".timeline-block-main span, .vertical-block-time");
  if (startLabel) startLabel.textContent = timelineLabel(timelineDrag.offset);
  if (endLabel) endLabel.textContent = timelineLabel(timelineDrag.offset + timelineDrag.duration);
  if (timingCopy) {
    timingCopy.textContent = timelineDrag.vertical
      ? `${timelineLabel(timelineDrag.offset)}–${timelineLabel(timelineDrag.offset + timelineDrag.duration)}`
      : `${timelineLabel(timelineDrag.offset)}–${timelineLabel(timelineDrag.offset + timelineDrag.duration)} · ${timelineDrag.duration} min`;
  }
});

function finishTimelineDrag(event) {
  if (!timelineDrag || timelineDrag.pointerId !== event.pointerId) return;
  timelineDrag.block.classList.remove("is-dragging");
  document.querySelectorAll(".timeline-track.is-drop-target, .vertical-stage-track.is-drop-target").forEach((track) => {
    track.classList.remove("is-drop-target");
  });
  const moved = Math.hypot(event.clientX - timelineDrag.startX, event.clientY - timelineDrag.startY) >= 3;
  if (moved) {
    updateSlotTimeline(
      timelineDrag.slot,
      timelineDrag.offset,
      timelineDrag.duration,
      timelineDrag.windowMinutes
    );
    const createsStage = timelineDrag.stageIndex === NEW_STAGE_GROUP_ID;
    if (createsStage) {
      const newStageIndex = ensureStageNames().length;
      if (newStageIndex < MAX_TIMELINE_STAGES) {
        state.stageNames.push(nextStageName());
        setStageCount(state.stageNames.length);
        timelineDrag.slot.stageIndex = newStageIndex;
      }
    } else {
      timelineDrag.slot.stageIndex = timelineDrag.stageIndex;
    }
    const slot = timelineDrag.slot;
    const snapshot = timelineDrag.snapshot;
    const removedStages = removeEmptyStages();
    state.timingQuickOpen = !isMobileViewport();
    timelineDrag = null;
    autoArrangeAround(
      slot,
      snapshot,
      `${slotName(slot)} placed on ${ensureStageNames()[slot.stageIndex]}${removedStages.length ? `. ${removedStages.join(", ")} removed` : ""}`
    );
    updateTimingsInPlace({ groups: createsStage || removedStages.length > 0 });
    announce(`${slotName(slot)} updated on ${ensureStageNames()[slot.stageIndex]}.`);
    return;
  }
  timelineDrag.block.style.removeProperty("transform");
  timelineDrag = null;
}

document.addEventListener("pointerup", finishTimelineDrag);
document.addEventListener("pointercancel", finishTimelineDrag);

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
  try {
    localStorage.setItem("aaa-booking-prototype-theme", theme);
  } catch {
    // Theme persistence is optional in this isolated prototype.
  }
  if (visTimelineInstance && TIMELINE_ENGINE === "vis" && !isMobileViewport()) {
    window.requestAnimationFrame(() => {
      const origin = visTimelineOrigin();
      visTimelineInstance?.setWindow(
        origin,
        new Date(origin.getTime() + timelineDisplayMinutes() * 60_000),
        { animation: false }
      );
      visTimelineInstance?.redraw();
    });
  }
}

themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

let storedTheme = "";
try {
  storedTheme = localStorage.getItem("aaa-booking-prototype-theme") || "";
} catch {
  storedTheme = "";
}
applyTheme(storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark");

const requestedStep = STEPS.findIndex((step) => `#${step.id}` === window.location.hash);
if (requestedStep >= 0) {
  state.step = requestedStep;
  if (requestedStep === 2) applyTimingSuggestions({ shouldAnnounce: false });
}

let wasMobile = isMobileViewport();
window.addEventListener("resize", () => {
  const isMobile = isMobileViewport();
  if (isMobile !== wasMobile && (state.step === 0 || state.step === 2)) {
    wasMobile = isMobile;
    render();
    queueFocus(state.step === 0 ? ".slot-editor" : ".step-header h1");
  }
});
render();
revealActiveProgress("auto");
