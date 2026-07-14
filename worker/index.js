import {
  BOOKING_LIMITS,
  BUDGET_RANGES,
  CAPACITY_RANGES,
  CURRENCY_CODES,
  DATE_PATTERN,
  DURATION_VALUES,
  E164_PATTERN,
  EMAIL_PATTERN,
  EVENT_TYPES,
  HEAR_ABOUT_OPTIONS,
  TIME_PATTERN,
  TICKETING_OPTIONS,
  UUID_PATTERN,
  durationBetween,
  formatDuration,
} from "../config/booking.js";
import { BOOKING_EMAIL, SITE_HOSTNAME } from "../config/site.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

const ALLOWED_DURATIONS = new Set(DURATION_VALUES);
const ALLOWED_EVENT_TYPES = new Set(EVENT_TYPES);
const ALLOWED_CAPACITIES = new Set(CAPACITY_RANGES);
const ALLOWED_TICKETING = new Set(TICKETING_OPTIONS);
const ALLOWED_CURRENCIES = new Set(CURRENCY_CODES);
const ALLOWED_BUDGETS = new Set(BUDGET_RANGES);
const ALLOWED_REFERRALS = new Set(HEAR_ABOUT_OPTIONS);

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

function text(value, maxLength, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const clean = value.trim();
  if ((required && !clean) || clean.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) return null;
  return clean;
}

function singleLine(value, maxLength, required = false) {
  const clean = text(value, maxLength, required);
  return clean !== null && /[\r\n]/.test(clean) ? null : clean;
}

function optionalAllowed(value, allowed) {
  return value === "" || allowed.has(value) ? value : null;
}

function validDate(value) {
  if (value === "TBC") return true;
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function validateBookings(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > BOOKING_LIMITS.artists) return null;
  const seen = new Set();
  const bookings = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const artist = singleLine(item.artist, BOOKING_LIMITS.artist, true);
    const timingMode = item.timingMode === "duration" || item.timingMode === "times" ? item.timingMode : null;
    const durationMinutes = text(item.durationMinutes, 3);
    const startTime = text(item.startTime, 5);
    const finishTime = text(item.finishTime, 5);
    if (!artist || !timingMode || seen.has(artist)) return null;
    if (timingMode === "duration" && !ALLOWED_DURATIONS.has(durationMinutes)) return null;
    if (timingMode === "times" && Boolean(startTime) !== Boolean(finishTime)) return null;
    if (timingMode === "times" && startTime && !durationBetween(startTime, finishTime)) return null;
    seen.add(artist);
    bookings.push({ artist, timingMode, durationMinutes, startTime, finishTime });
  }
  return bookings;
}

function validatePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const name = singleLine(input.name, BOOKING_LIMITS.name, true);
  const email = singleLine(input.email, BOOKING_LIMITS.email, true);
  const eventDate = singleLine(input.eventDate, 10, true);
  const bookings = validateBookings(input.bookings);
  const submissionId = singleLine(input.submissionId, BOOKING_LIMITS.submissionId, true);
  const website = text(input.website, 200);
  const turnstileToken = text(input.turnstileToken, 2048);
  if (!name || !email || !EMAIL_PATTERN.test(email) || !eventDate || !validDate(eventDate) || !bookings) return null;
  if (!submissionId || !UUID_PATTERN.test(submissionId)) return null;
  if (website === null || website) return null;

  const phone = singleLine(input.phone, BOOKING_LIMITS.phone);
  const whatsappNumber = singleLine(input.whatsappNumber, BOOKING_LIMITS.phone);
  const whatsappUsername = singleLine(input.whatsappUsername, BOOKING_LIMITS.whatsappUsername);
  if (phone && !E164_PATTERN.test(phone)) return null;
  if (whatsappNumber && !E164_PATTERN.test(whatsappNumber)) return null;
  if (whatsappNumber && whatsappUsername) return null;
  if (whatsappUsername && !/^@[^@\s]{1,64}$/.test(whatsappUsername)) return null;

  const fields = {
    name,
    email,
    submissionId,
    eventDate,
    bookings,
    turnstileToken: turnstileToken ?? "",
    company: singleLine(input.company, BOOKING_LIMITS.company),
    phone,
    whatsappNumber,
    whatsappUsername,
    eventName: singleLine(input.eventName, BOOKING_LIMITS.eventName),
    eventType: optionalAllowed(singleLine(input.eventType, BOOKING_LIMITS.eventType), ALLOWED_EVENT_TYPES),
    venue: singleLine(input.venue, BOOKING_LIMITS.venue),
    city: singleLine(input.city, BOOKING_LIMITS.city),
    country: singleLine(input.country, BOOKING_LIMITS.country),
    capacity: optionalAllowed(singleLine(input.capacity, BOOKING_LIMITS.capacity), ALLOWED_CAPACITIES),
    ticketing: optionalAllowed(singleLine(input.ticketing, BOOKING_LIMITS.ticketing), ALLOWED_TICKETING),
    currency: optionalAllowed(singleLine(input.currency, BOOKING_LIMITS.currency), ALLOWED_CURRENCIES),
    budgetRange: optionalAllowed(singleLine(input.budgetRange, BOOKING_LIMITS.budgetRange), ALLOWED_BUDGETS),
    lineup: text(input.lineup, BOOKING_LIMITS.lineup),
    hearAbout: optionalAllowed(singleLine(input.hearAbout, BOOKING_LIMITS.hearAbout), ALLOWED_REFERRALS),
    message: text(input.message, BOOKING_LIMITS.message),
  };
  return Object.values(fields).some((value) => value === null) ? null : fields;
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function withinLimit(binding, key) {
  if (!binding?.limit) return true;
  const result = await binding.limit({ key });
  return result.success;
}

async function readLimitedText(request, maxBytes) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.append("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return false;
  const result = await response.json();
  if (!result.success || result.action !== "booking_enquiry") return false;
  return result.hostname === (env.TURNSTILE_HOSTNAME || SITE_HOSTNAME);
}

function productionConfigurationIssue(env) {
  if (env.ENVIRONMENT !== "production") return "";
  const missing = [
    !env.FORMSPREE_FORM_ID && "FORMSPREE_FORM_ID",
    !env.TURNSTILE_SECRET_KEY && "TURNSTILE_SECRET_KEY",
    !env.CONTACT_ACTOR_RATE_LIMIT && "CONTACT_ACTOR_RATE_LIMIT",
    !env.CONTACT_EMAIL_RATE_LIMIT && "CONTACT_EMAIL_RATE_LIMIT",
  ].filter(Boolean);
  return missing.join(",");
}

function formspreePayload(payload) {
  const artistNames = payload.bookings.map((booking) => booking.artist);
  const subjectArtists = artistNames.length > 2
    ? `${artistNames.slice(0, 2).join(", ")} +${artistNames.length - 2}`
    : artistNames.join(", ");
  const schedule = payload.bookings.map((booking, index) => {
    if (booking.timingMode === "duration") {
      return `${index + 1}. ${booking.artist} — ${formatDuration(booking.durationMinutes)} set · times TBC`;
    }
    const duration = booking.startTime ? durationBetween(booking.startTime, booking.finishTime) : "";
    return `${index + 1}. ${booking.artist}${booking.startTime ? ` — ${booking.startTime}–${booking.finishTime} — ${duration}` : " — Exact times TBC"}`;
  }).join("\n");
  const location = [payload.venue, payload.city, payload.country].filter(Boolean).join(", ");
  const budget = payload.budgetRange
    ? payload.budgetRange === "Prefer to discuss" ? payload.budgetRange : `${payload.budgetRange} ${payload.currency}`
    : "";

  return {
    _subject: `Booking Enquiry${subjectArtists ? `: ${subjectArtists}` : ""} from ${payload.name}`,
    "Submission reference": payload.submissionId,
    email: payload.email,
    Name: payload.name,
    Email: payload.email,
    ...(payload.company && { "Company / promoter": payload.company }),
    ...(payload.phone && { Phone: payload.phone }),
    ...(payload.whatsappNumber && { "WhatsApp number": payload.whatsappNumber }),
    ...(payload.whatsappUsername && { "WhatsApp username": payload.whatsappUsername }),
    "Artist schedule": schedule,
    ...(payload.eventName && { "Event name": payload.eventName }),
    ...(payload.eventType && { "Event type": payload.eventType }),
    "Event date": payload.eventDate,
    ...(location && { Location: location }),
    ...(payload.capacity && { "Expected capacity": payload.capacity }),
    ...(payload.ticketing && { Ticketing: payload.ticketing }),
    ...(budget && { "Budget / fee offer": budget }),
    ...(payload.lineup && { "Other artists on the bill": payload.lineup }),
    ...(payload.hearAbout && { "How they heard about us": payload.hearAbout }),
    Message: payload.message,
  };
}

async function handleEnquiry(request, env) {
  const requestId = crypto.randomUUID();
  try {
    const configurationIssue = productionConfigurationIssue(env);
    if (configurationIssue) {
      console.error(JSON.stringify({ event: "enquiry_security_unconfigured", requestId, missing: configurationIssue }));
      return json(503, { error: `Online delivery is temporarily unavailable. Please email ${BOOKING_EMAIL}.` });
    }
    const actorKey = await sha256(request.headers.get("CF-Connecting-IP") || "unknown-actor");
    if (!(await withinLimit(env.CONTACT_ACTOR_RATE_LIMIT, actorKey))) {
      console.warn(JSON.stringify({ event: "enquiry_rate_limited", scope: "actor", requestId }));
      return json(429, { error: "Too many enquiries were sent from this connection. Please wait a minute and try again.", requestId }, { "Retry-After": "60" });
    }
    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > BOOKING_LIMITS.bodyBytes) return json(413, { error: "This enquiry is too large to send." });
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json(415, { error: "Unsupported request format." });
    }

    let rawBody;
    try {
      rawBody = await readLimitedText(request, BOOKING_LIMITS.bodyBytes);
    } catch {
      return json(400, { error: "The enquiry could not be read.", requestId });
    }
    if (rawBody === null) return json(413, { error: "This enquiry is too large to send.", requestId });
    let input;
    try {
      input = JSON.parse(rawBody);
    } catch {
      return json(400, { error: "The enquiry could not be read.", requestId });
    }
    const payload = validatePayload(input);
    if (!payload) return json(400, { error: "Please check the enquiry details and try again.", requestId });

    if (!(await verifyTurnstile(request, env, payload.turnstileToken))) {
      console.warn(JSON.stringify({ event: "enquiry_turnstile_failed", requestId }));
      return json(400, { error: "The security check expired or failed. Please try again.", requestId });
    }

    const emailKey = await sha256(payload.email.toLowerCase());
    if (!(await withinLimit(env.CONTACT_EMAIL_RATE_LIMIT, emailKey))) {
      console.warn(JSON.stringify({ event: "enquiry_rate_limited", scope: "email", requestId }));
      return json(429, { error: "Too many enquiries were sent for this email address. Please wait and try again.", requestId }, { "Retry-After": "60" });
    }
    if (!env.FORMSPREE_FORM_ID || !/^[A-Za-z0-9]+$/.test(env.FORMSPREE_FORM_ID)) {
      console.error(JSON.stringify({ event: "enquiry_delivery_unconfigured", requestId }));
      return json(503, { error: `Online delivery is temporarily unavailable. Please email ${BOOKING_EMAIL}.` });
    }

    const response = await fetch(`https://formspree.io/f/${env.FORMSPREE_FORM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formspreePayload(payload)),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 429) {
      console.warn(JSON.stringify({ event: "enquiry_delivery_rate_limited", requestId }));
      return json(429, { error: "The booking service is temporarily busy. Please wait and try again.", requestId }, {
        "Retry-After": response.headers.get("Retry-After") || "60",
      });
    }
    if (!response.ok) throw new Error(`Form delivery returned ${response.status}`);
    console.log(JSON.stringify({ event: "enquiry_delivered", requestId }));
    return json(200, { ok: true, requestId });
  } catch (error) {
    console.error(JSON.stringify({
      event: "enquiry_delivery_failed",
      requestId,
      reason: error instanceof Error ? error.name : "unknown",
    }));
    return json(502, { error: `Something went wrong sending your enquiry. Please email ${BOOKING_EMAIL} directly.`, requestId });
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if ((url.hostname === SITE_HOSTNAME && url.protocol === "http:") || url.hostname === `www.${SITE_HOSTNAME}`) {
      url.protocol = "https:";
      url.hostname = SITE_HOSTNAME;
      return Response.redirect(url, 308);
    }
    if (url.pathname === "/api/enquiries") {
      if (request.method !== "POST") {
        return new Response(null, { status: 405, headers: { Allow: "POST", ...JSON_HEADERS } });
      }
      return handleEnquiry(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
