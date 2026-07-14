import {
  BOOKING_LIMITS,
  DATE_PATTERN,
  DURATION_VALUES,
  EMAIL_PATTERN,
  TIME_PATTERN,
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

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function text(value, maxLength, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const clean = value.trim();
  if ((required && !clean) || clean.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) return null;
  return clean;
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
    const artist = text(item.artist, BOOKING_LIMITS.artist, true);
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
  const name = text(input.name, BOOKING_LIMITS.name, true);
  const email = text(input.email, BOOKING_LIMITS.email, true);
  const eventDate = text(input.eventDate, 10, true);
  const bookings = validateBookings(input.bookings);
  const startedAt = Number(input.startedAt);
  const website = text(input.website, 200);
  const turnstileToken = text(input.turnstileToken, 2048);
  if (!name || !email || !EMAIL_PATTERN.test(email) || !eventDate || !validDate(eventDate) || !bookings) return null;
  if (!Number.isFinite(startedAt) || startedAt > Date.now() + 60_000 || startedAt < Date.now() - 24 * 60 * 60 * 1000) return null;
  if (website === null || website) return null;

  const fields = {
    name,
    email,
    eventDate,
    bookings,
    turnstileToken: turnstileToken ?? "",
    company: text(input.company, BOOKING_LIMITS.company),
    phone: text(input.phone, BOOKING_LIMITS.phone),
    whatsappNumber: text(input.whatsappNumber, BOOKING_LIMITS.phone),
    whatsappUsername: text(input.whatsappUsername, BOOKING_LIMITS.whatsappUsername),
    whatsappUsernameKey: text(input.whatsappUsernameKey, BOOKING_LIMITS.whatsappUsernameKey),
    eventName: text(input.eventName, BOOKING_LIMITS.eventName),
    eventType: text(input.eventType, BOOKING_LIMITS.eventType),
    venue: text(input.venue, BOOKING_LIMITS.venue),
    city: text(input.city, BOOKING_LIMITS.city),
    country: text(input.country, BOOKING_LIMITS.country),
    capacity: text(input.capacity, BOOKING_LIMITS.capacity),
    ticketing: text(input.ticketing, BOOKING_LIMITS.ticketing),
    currency: text(input.currency, BOOKING_LIMITS.currency),
    budgetRange: text(input.budgetRange, BOOKING_LIMITS.budgetRange),
    lineup: text(input.lineup, BOOKING_LIMITS.lineup),
    hearAbout: text(input.hearAbout, BOOKING_LIMITS.hearAbout),
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
    !env.CONTACT_GLOBAL_RATE_LIMIT && "CONTACT_GLOBAL_RATE_LIMIT",
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
    email: payload.email,
    Name: payload.name,
    Email: payload.email,
    ...(payload.company && { "Company / promoter": payload.company }),
    ...(payload.phone && { Phone: payload.phone }),
    ...(payload.whatsappNumber && { "WhatsApp number": payload.whatsappNumber }),
    ...(payload.whatsappUsername && { "WhatsApp username": payload.whatsappUsername }),
    ...(payload.whatsappUsernameKey && { "WhatsApp username key": payload.whatsappUsernameKey }),
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
    if (!(await withinLimit(env.CONTACT_GLOBAL_RATE_LIMIT, "booking-enquiries"))) {
      console.warn(JSON.stringify({ event: "enquiry_rate_limited", scope: "global", requestId }));
      return json(429, { error: "Too many enquiries are being sent. Please wait a minute and try again." });
    }
    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > BOOKING_LIMITS.bodyBytes) return json(413, { error: "This enquiry is too large to send." });
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json(415, { error: "Unsupported request format." });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > BOOKING_LIMITS.bodyBytes) return json(413, { error: "This enquiry is too large to send." });
    let input;
    try {
      input = JSON.parse(rawBody);
    } catch {
      return json(400, { error: "The enquiry could not be read." });
    }
    const payload = validatePayload(input);
    if (!payload) return json(400, { error: "Please check the enquiry details and try again." });

    const emailKey = await sha256(payload.email.toLowerCase());
    if (!(await withinLimit(env.CONTACT_EMAIL_RATE_LIMIT, emailKey))) {
      console.warn(JSON.stringify({ event: "enquiry_rate_limited", scope: "email", requestId }));
      return json(429, { error: "Too many enquiries were sent for this email address. Please wait and try again." });
    }
    if (!(await verifyTurnstile(request, env, payload.turnstileToken))) {
      console.warn(JSON.stringify({ event: "enquiry_turnstile_failed", requestId }));
      return json(400, { error: "The security check expired or failed. Please try again." });
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
    if (!response.ok) throw new Error(`Form delivery returned ${response.status}`);
    console.log(JSON.stringify({ event: "enquiry_delivered", requestId }));
    return json(200, { ok: true });
  } catch (error) {
    console.error(JSON.stringify({
      event: "enquiry_delivery_failed",
      requestId,
      reason: error instanceof Error ? error.name : "unknown",
    }));
    return json(502, { error: `Something went wrong sending your enquiry. Please email ${BOOKING_EMAIL} directly.` });
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
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
