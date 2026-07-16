import assert from "node:assert/strict";
import test from "node:test";
import { BOOKING_LIMITS } from "../../config/booking.js";
import worker from "../../worker/index.js";

const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";

function validPayload(overrides = {}) {
  return {
    name: "Jane Booker",
    email: "jane@example.com",
    submissionId: SUBMISSION_ID,
    company: "",
    phone: "",
    whatsappNumber: "",
    whatsappUsername: "",
    bookings: [{
      artist: "Xijaro & Pitch",
      timingMode: "duration",
      durationMinutes: "60",
      startTime: "",
      finishTime: "",
    }],
    eventName: "",
    eventType: "",
    eventDate: "2026-12-01",
    venue: "",
    city: "",
    country: "",
    capacity: "",
    ticketing: "",
    currency: "GBP",
    budgetRange: "",
    lineup: "",
    hearAbout: "",
    message: "",
    turnstileToken: "",
    website: "",
    ...overrides,
  };
}

function request(payload, method = "POST", extraHeaders = {}) {
  return new Request("https://aaaartists.co/api/enquiries", {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.5", ...extraHeaders } : undefined,
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  });
}

function env(overrides = {}) {
  return {
    FORMSPREE_FORM_ID: "testform",
    ASSETS: { fetch: () => new Response("asset") },
    CONTACT_ACTOR_RATE_LIMIT: { limit: async () => ({ success: true }) },
    CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

test("validates and forwards a clean enquiry with a stable reference", async (context) => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://formspree.io/f/testform");
    forwarded = JSON.parse(init.body);
    return Response.json({ ok: true });
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(request(validPayload()), env());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(forwarded.Email, "jane@example.com");
  assert.equal(forwarded["Submission reference"], SUBMISSION_ID);
  assert.match(forwarded["Artist schedule"], /Xijaro & Pitch.*1 hour set/);
  assert.match(result.requestId, /^[0-9a-f-]{36}$/i);
});

test("rejects invalid fields and honeypot submissions before delivery", async (context) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return Response.json({ ok: true }); };
  context.after(() => { globalThis.fetch = originalFetch; });

  const invalidEmail = await worker.fetch(request(validPayload({ email: "not-an-email" })), env());
  const honeypot = await worker.fetch(request(validPayload({ website: "https://spam.example" })), env());
  const crlf = await worker.fetch(request(validPayload({ name: "Jane\r\nBcc: victim@example.com" })), env());
  const invalidOption = await worker.fetch(request(validPayload({ eventType: "Injected option" })), env());
  const conflictingWhatsApp = await worker.fetch(request(validPayload({
    whatsappNumber: "+447400123456",
    whatsappUsername: "@janebooker",
  })), env());
  assert.deepEqual(
    [invalidEmail.status, honeypot.status, crlf.status, invalidOption.status, conflictingWhatsApp.status],
    [400, 400, 400, 400, 400],
  );
  assert.equal(calls, 0);
});

test("enforces actor rate limits and HTTP method", async () => {
  const limited = await worker.fetch(
    request(validPayload()),
    env({ CONTACT_ACTOR_RATE_LIMIT: { limit: async () => ({ success: false }) } }),
  );
  const wrongMethod = await worker.fetch(request(null, "GET"), env());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("Allow"), "POST");
});

test("verifies Turnstile before consuming the email quota", async (context) => {
  const originalFetch = globalThis.fetch;
  let emailLimitCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: false, action: "booking_enquiry", hostname: "aaaartists.co" });
    }
    throw new Error("Delivery should not run");
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(
    request(validPayload({ turnstileToken: "invalid-token" })),
    env({
      TURNSTILE_SECRET_KEY: "secret",
      CONTACT_EMAIL_RATE_LIMIT: { limit: async () => { emailLimitCalls += 1; return { success: true }; } },
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(emailLimitCalls, 0);
});

test("requires the expected Turnstile action and hostname", async (context) => {
  const originalFetch = globalThis.fetch;
  const results = [
    { success: true, action: "another_action", hostname: "aaaartists.co" },
    { success: true, action: "booking_enquiry", hostname: "preview.example" },
  ];
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) return Response.json(results.shift());
    throw new Error("Delivery should not run");
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const wrongAction = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret" }),
  );
  const wrongHost = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret" }),
  );
  assert.equal(wrongAction.status, 400);
  assert.equal(wrongHost.status, 400);
});

test("fails closed when production security bindings or secrets are missing", async () => {
  const response = await worker.fetch(
    request(validPayload()),
    env({ ENVIRONMENT: "production", TURNSTILE_SECRET_KEY: undefined, CONTACT_EMAIL_RATE_LIMIT: undefined }),
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.error, /temporarily unavailable/i);
});

test("stops oversized streamed and dishonest-length bodies at 64 KiB", async () => {
  const oversized = new Uint8Array(BOOKING_LIMITS.bodyBytes + 1).fill(97);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(oversized); controller.close(); } });
  const streamedRequest = new Request("https://aaaartists.co/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.5" },
    body: stream,
    duplex: "half",
  });
  const dishonestRequest = new Request("https://aaaartists.co/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": "10", "CF-Connecting-IP": "203.0.113.5" },
    body: oversized,
  });
  assert.equal((await worker.fetch(streamedRequest, env())).status, 413);
  assert.equal((await worker.fetch(dishonestRequest, env())).status, 413);
});

test("preserves upstream retry semantics without exposing enquiry data", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("busy", { status: 429, headers: { "Retry-After": "120" } });
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(request(validPayload()), env());
  const body = await response.json();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "120");
  assert.match(body.requestId, /^[0-9a-f-]{36}$/i);
  assert.doesNotMatch(JSON.stringify(body), /jane@example\.com|Jane Booker/);
});

test("accepts Turnstile testing-key results only outside production", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
    }
    return Response.json({ ok: true });
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const staging = await worker.fetch(
    request(validPayload({ turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" })),
    env({ ENVIRONMENT: "staging", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" }),
  );
  const production = await worker.fetch(
    request(validPayload({ turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" })),
    env({ ENVIRONMENT: "production", TURNSTILE_SECRET_KEY: "real-secret" }),
  );
  assert.equal(staging.status, 200);
  assert.equal(production.status, 400);
});

test("marks non-production asset responses noindex and leaves production untouched", async () => {
  const asset = () => new Response("asset", { headers: { "Content-Type": "text/html" } });
  const staging = await worker.fetch(
    new Request("https://aaa-artists-staging.example.workers.dev/"),
    env({ ENVIRONMENT: "staging", ASSETS: { fetch: async () => asset() } }),
  );
  const production = await worker.fetch(
    new Request("https://aaaartists.co/"),
    env({ ENVIRONMENT: "production", ASSETS: { fetch: async () => asset() } }),
  );
  assert.equal(staging.status, 200);
  assert.equal(staging.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(await staging.text(), "asset");
  assert.equal(production.headers.get("X-Robots-Tag"), null);
  assert.equal(production.headers.get("Content-Type"), "text/html");
});

test("redirects HTTP apex and www to the HTTPS canonical origin", async () => {
  const http = await worker.fetch(new Request("http://aaaartists.co/events?source=test"), env());
  const www = await worker.fetch(new Request("https://www.aaaartists.co/privacy"), env());
  assert.equal(http.status, 308);
  assert.equal(http.headers.get("Location"), "https://aaaartists.co/events?source=test");
  assert.equal(www.status, 308);
  assert.equal(www.headers.get("Location"), "https://aaaartists.co/privacy");
});
