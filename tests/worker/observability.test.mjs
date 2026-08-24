import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker/index.js";
import { createLogger } from "../../worker/observability.js";

const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";

/** A payload full of the things that must never appear in a log record. */
function personalPayload(overrides = {}) {
  return {
    name: "Jane Booker",
    email: "jane.booker@example.com",
    submissionId: SUBMISSION_ID,
    company: "Booker Events Ltd",
    phone: "+447700900123",
    // The Worker rejects a number and a username together, so this payload carries the
    // username form: "@name", which is what a real enquiry with no phone looks like.
    whatsappNumber: "",
    whatsappUsername: "@janebooker",
    bookings: [
      {
        artist: "Xijaro & Pitch",
        timingMode: "duration",
        durationMinutes: "60",
        startTime: "",
        finishTime: "",
      },
    ],
    eventName: "Jane's Secret Warehouse Party",
    eventType: "",
    eventDate: "2026-12-01",
    venue: "The Old Bakery",
    city: "Manchester",
    country: "United Kingdom",
    capacity: "",
    ticketing: "",
    currency: "GBP",
    budgetRange: "",
    lineup: "",
    hearAbout: "",
    message: "Please keep this confidential.",
    turnstileToken: "",
    website: "",
    ...overrides,
  };
}

function request(payload) {
  return new Request("https://aaaartists.co/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.5" },
    body: JSON.stringify(payload),
  });
}

function env(overrides = {}) {
  return {
    BREVO_API_KEY: "xkeysib-test-api-key",
    // "staging" keeps the Turnstile production gate out of the way; these tests are about
    // what a log record contains, not about the security configuration check.
    ENVIRONMENT: "staging",
    CF_VERSION_METADATA: { id: "5a9cc6d4-0ee9-4e0d-8f14-44261c7683ba", tag: "github-abc123" },
    ASSETS: { fetch: () => new Response("asset") },
    CONTACT_ACTOR_RATE_LIMIT: { limit: async () => ({ success: true }) },
    CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

/** Capture everything the Worker writes to the console during one request. */
async function captureLogs(context, run) {
  const lines = [];
  const original = { log: console.log, warn: console.warn, error: console.error };
  console.log = (line) => lines.push(String(line));
  console.warn = (line) => lines.push(String(line));
  console.error = (line) => lines.push(String(line));
  context.after(() => {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  });
  const result = await run();
  return { lines, result };
}

test("log records carry an OpenTelemetry-shaped envelope", () => {
  const written = [];
  const log = createLogger({
    env: {
      ENVIRONMENT: "production",
      CF_VERSION_METADATA: { id: "version-id", tag: "github-abc123" },
    },
    requestId: "request-id",
    sink: (line) => written.push(line),
  });

  log.warn("enquiry_rate_limited", { scope: "actor" });

  assert.equal(written.length, 1);
  const record = JSON.parse(written[0]);
  assert.equal(record.event, "enquiry_rate_limited");
  assert.equal(record.requestId, "request-id");
  assert.equal(record.severity, "WARN");
  assert.equal(record.severityNumber, 13);
  assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(record.resource, {
    "service.name": "aaa-artists-worker",
    "service.version": "version-id",
    "service.tag": "github-abc123",
    "deployment.environment": "production",
  });
  assert.deepEqual(record.attributes, { scope: "actor" });
});

test("attributes outside the allowlist are dropped and counted", () => {
  const written = [];
  const log = createLogger({ env: {}, requestId: "r", sink: (line) => written.push(line) });

  log.info("enquiry_delivered", {
    outcome: "sent",
    customerName: "Jane Booker",
    venue: "The Old Bakery",
  });

  const record = JSON.parse(written[0]);
  assert.deepEqual(record.attributes, { outcome: "sent" });
  assert.equal(record.droppedAttributes, 2);
});

test("an email address is dropped even under an allowed attribute key", () => {
  const written = [];
  const log = createLogger({ env: {}, requestId: "r", sink: (line) => written.push(line) });

  log.error("enquiry_delivery_failed", { reason: "jane.booker@example.com" });

  const record = JSON.parse(written[0]);
  assert.equal(record.attributes, undefined);
  assert.equal(record.droppedAttributes, 1);
});

test("a delivered enquiry logs nothing that identifies the person", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ messageId: "<x@smtp-relay.mailin.fr>" }, { status: 201 });
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const payload = personalPayload();
  const { lines, result } = await captureLogs(context, () => worker.fetch(request(payload), env()));

  assert.equal(result.status, 200);
  assert.ok(lines.length > 0, "the delivered enquiry should produce at least one log record");

  const combined = lines.join("\n");
  for (const secret of [
    payload.name,
    payload.email,
    payload.phone,
    payload.whatsappUsername.slice(1),
    payload.company,
    payload.eventName,
    payload.venue,
    payload.message,
    "203.0.113.5", // the visitor's IP address
  ]) {
    assert.doesNotMatch(
      combined,
      new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      `log output must not contain ${JSON.stringify(secret)}`
    );
  }

  const record = JSON.parse(lines.at(-1));
  assert.equal(record.event, "enquiry_delivered");
  assert.equal(record.requestId, (await result.clone().json()).requestId);
});

test("a failed delivery logs the error name, never the error message", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("connect ECONNREFUSED jane.booker@example.com:443");
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const { lines, result } = await captureLogs(context, () =>
    worker.fetch(request(personalPayload()), env())
  );

  assert.equal(result.status, 502);
  const record = JSON.parse(lines.at(-1));
  assert.equal(record.event, "enquiry_delivery_failed");
  assert.equal(record.severity, "ERROR");
  assert.equal(record.attributes.reason, "TypeError");
  assert.doesNotMatch(lines.join("\n"), /ECONNREFUSED/);
});

test("an unconfigured Worker names the missing setting, not its value", async (context) => {
  const { lines, result } = await captureLogs(context, () =>
    worker.fetch(
      request(personalPayload()),
      env({ ENVIRONMENT: "production", BREVO_API_KEY: undefined })
    )
  );

  assert.equal(result.status, 503);
  const record = JSON.parse(lines.at(-1));
  assert.equal(record.event, "enquiry_security_unconfigured");
  assert.equal(record.severity, "ERROR");
  assert.match(record.attributes.missing, /BREVO_API_KEY/);
  assert.doesNotMatch(lines.join("\n"), /xkeysib/);
});

test("the booking copy can be redirected outside production, never inside it", async (context) => {
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, init) => {
    // Production runs the Turnstile check before the send, and it uses the same
    // fetch. Answering both from one mock would fail verification and the request
    // would never reach Brevo, which is how this test first passed for the wrong
    // reason.
    if (String(url).includes("siteverify")) {
      // Production also requires the action and hostname to match, not just
      // success, so a bare { success: true } never reaches the send.
      return Response.json({
        success: true,
        action: "booking_enquiry",
        hostname: "aaaartists.co",
      });
    }
    sent = JSON.parse(init.body);
    return Response.json({ messageId: "<x@smtp-relay.mailin.fr>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  // Local testing against a real Brevo key must reach only the tester, so the
  // agency's shared inbox is not copied on every experiment.
  await worker.fetch(
    request(personalPayload()),
    env({ ENVIRONMENT: "staging", BOOKING_BCC_OVERRIDE: "tester@example.com" })
  );
  assert.deepEqual(sent.bcc, [{ email: "tester@example.com" }]);

  // In production the same variable is ignored. This is the guarantee that makes
  // the override safe to exist at all.
  // Production refuses an empty Turnstile token before it ever builds the email,
  // so the payload needs one for this assertion to reach the send at all.
  await worker.fetch(
    request(personalPayload({ turnstileToken: "a-token" })),
    env({
      ENVIRONMENT: "production",
      TURNSTILE_SECRET_KEY: "secret",
      BOOKING_BCC_OVERRIDE: "attacker@example.com",
    })
  );
  assert.deepEqual(sent.bcc, [{ email: "bookings@aaaartists.co" }]);
  assert.deepEqual(sent.replyTo, { email: "bookings@aaaartists.co" });
});
