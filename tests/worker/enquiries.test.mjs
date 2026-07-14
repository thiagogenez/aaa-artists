import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker/index.js";

function validPayload(overrides = {}) {
  return {
    name: "Jane Booker",
    email: "jane@example.com",
    company: "",
    phone: "",
    whatsappNumber: "",
    whatsappUsername: "",
    whatsappUsernameKey: "",
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
    startedAt: Date.now(),
    website: "",
    ...overrides,
  };
}

function request(payload, method = "POST") {
  return new Request("https://artists.example/api/enquiries", {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  });
}

function env(overrides = {}) {
  return {
    FORMSPREE_FORM_ID: "testform",
    ASSETS: { fetch: () => new Response("asset") },
    CONTACT_GLOBAL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

test("validates and forwards a clean enquiry", async (context) => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://formspree.io/f/testform");
    forwarded = JSON.parse(init.body);
    return Response.json({ ok: true });
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(request(validPayload()), env());
  assert.equal(response.status, 200);
  assert.equal(forwarded.Email, "jane@example.com");
  assert.match(forwarded["Artist schedule"], /Xijaro & Pitch.*1 hour set/);
});

test("rejects invalid fields and honeypot submissions before delivery", async (context) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return Response.json({ ok: true }); };
  context.after(() => { globalThis.fetch = originalFetch; });

  const invalidEmail = await worker.fetch(request(validPayload({ email: "not-an-email" })), env());
  const honeypot = await worker.fetch(request(validPayload({ website: "https://spam.example" })), env());
  assert.equal(invalidEmail.status, 400);
  assert.equal(honeypot.status, 400);
  assert.equal(calls, 0);
});

test("enforces rate limits and HTTP method", async () => {
  const limited = await worker.fetch(
    request(validPayload()),
    env({ CONTACT_GLOBAL_RATE_LIMIT: { limit: async () => ({ success: false }) } }),
  );
  const wrongMethod = await worker.fetch(request(null, "GET"), env());
  assert.equal(limited.status, 429);
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("Allow"), "POST");
});

test("requires a valid Turnstile action when a secret is configured", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "another_action", hostname: "artists.example" });
    }
    throw new Error("Delivery should not run");
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret", TURNSTILE_HOSTNAME: "artists.example" }),
  );
  assert.equal(response.status, 400);
});

test("fails closed when production security bindings or secrets are missing", async () => {
  const response = await worker.fetch(
    request(validPayload()),
    env({
      ENVIRONMENT: "production",
      TURNSTILE_SECRET_KEY: undefined,
      CONTACT_EMAIL_RATE_LIMIT: undefined,
    }),
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.error, /temporarily unavailable/i);
});

test("rejects a Turnstile token issued for another hostname", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "booking_enquiry", hostname: "preview.example" });
    }
    throw new Error("Delivery should not run");
  };
  context.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret" }),
  );
  assert.equal(response.status, 400);
});
