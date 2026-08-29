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
    contactToDiscuss: false,
    bookings: [
      {
        artist: "Xijaro & Pitch",
        timingMode: "duration",
        durationMinutes: "60",
        startTime: "",
        finishTime: "",
      },
    ],
    eventName: "",
    eventType: "",
    eventDate: "2026-12-01",
    venue: "",
    city: "",
    country: "",
    capacity: "",
    ticketing: "",
    currency: "EUR",
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
    headers:
      method === "POST"
        ? { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.5", ...extraHeaders }
        : undefined,
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  });
}

function env(overrides = {}) {
  return {
    BREVO_API_KEY: "xkeysib-test-api-key",
    ASSETS: { fetch: () => new Response("asset") },
    CONTACT_ACTOR_RATE_LIMIT: { limit: async () => ({ success: true }) },
    CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

test("retained failure logs exclude enquiry data, error messages and raw IPs", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const records = [];
  globalThis.fetch = async () => {
    throw new Error("Provider exposed private.person@example.com");
  };
  console.error = (record) => records.push(record);
  context.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });

  const response = await worker.fetch(
    request(
      validPayload({
        name: "Private Person",
        email: "private.person@example.com",
        message: "Private booking message",
      }),
      "POST",
      { "CF-Connecting-IP": "198.51.100.27" }
    ),
    env()
  );

  assert.equal(response.status, 502);
  assert.equal(records.length, 1);
  assert.equal(records[0].event, "enquiry_delivery_failed");
  assert.equal(records[0].reason, "Error");
  assert.match(records[0].requestId, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(Object.keys(records[0]).sort(), ["event", "reason", "requestId"]);
  assert.doesNotMatch(
    JSON.stringify(records),
    /Private Person|private\.person@example\.com|Private booking message|Provider exposed|198\.51\.100\.27/
  );
});

test("validates and emails a clean enquiry with a stable threaded reference", async (context) => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.brevo.com/v3/smtp/email");
    assert.equal(init.headers["api-key"], "xkeysib-test-api-key");
    assert.equal(init.headers["Idempotency-Key"], undefined);
    assert.equal(init.headers.idempotencyKey, undefined);
    forwarded = JSON.parse(init.body);
    return Response.json(
      { messageId: "<202607180101.123456789@smtp-relay.mailin.fr>" },
      { status: 201 }
    );
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(request(validPayload()), env());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(forwarded.headers, undefined);
  assert.deepEqual(forwarded.to, [{ email: "jane@example.com", name: "Jane Booker" }]);
  assert.deepEqual(forwarded.bcc, [{ email: "bookings@aaaartists.co" }]);
  assert.deepEqual(forwarded.replyTo, { email: "bookings@aaaartists.co" });
  assert.equal(forwarded.sender.email, "bookings@aaaartists.co");
  assert.match(forwarded.subject, /Booking enquiry \[123E4567\].*Xijaro & Pitch/);
  assert.match(forwarded.textContent, new RegExp(`Submission reference: ${SUBMISSION_ID}`));
  assert.match(forwarded.textContent, /Artist schedule:.*Xijaro & Pitch.*1 hour set/s);
  assert.match(forwarded.textContent, /not confirmation/i);
  assert.match(result.requestId, /^[0-9a-f-]{36}$/i);
});

test("accepts an artist discussion only when no booking is selected", async (context) => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (_url, init) => {
    forwarded = JSON.parse(init.body);
    return Response.json({ messageId: "<artist-discussion@example.com>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(
    request(validPayload({ contactToDiscuss: true, bookings: [] })),
    env()
  );

  assert.equal(response.status, 200);
  assert.match(forwarded.subject, /Artist to discuss/);
  assert.match(forwarded.textContent, /Artist selection: Contact me to discuss/);
  assert.doesNotMatch(forwarded.textContent, /Artist schedule:/);
});

test("routes non-production delivery to the local catcher and optional test BCC", async (context) => {
  const originalFetch = globalThis.fetch;
  let deliveryUrl;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    deliveryUrl = String(url);
    forwarded = JSON.parse(init.body);
    return Response.json({ messageId: "<local@mail-catcher.test>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(
    request(validPayload()),
    env({
      ENVIRONMENT: "development",
      BREVO_API_BASE: "http://127.0.0.1:8025",
      BOOKING_BCC_OVERRIDE: "tester@example.com",
    })
  );

  assert.equal(response.status, 200);
  assert.equal(deliveryUrl, "http://127.0.0.1:8025/v3/smtp/email");
  assert.deepEqual(forwarded.bcc, [{ email: "tester@example.com" }]);
  assert.deepEqual(forwarded.replyTo, { email: "bookings@aaaartists.co" });
});

test("fails closed when staging email lacks a valid fixed recipient", async (context) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ messageId: "<unsafe-staging@example.com>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const stagingRecipient of [undefined, "xkeysib-example-api-key"]) {
    const response = await worker.fetch(
      request(validPayload()),
      env({
        ENVIRONMENT: "staging",
        STAGING_ENQUIRY_RECIPIENT: stagingRecipient,
      })
    );

    assert.equal(response.status, 503);
  }
  assert.equal(calls, 0);
});

test("locks staging delivery and rate limits to the configured recipient", async (context) => {
  const originalFetch = globalThis.fetch;
  const forwarded = [];
  const emailKeys = [];
  globalThis.fetch = async (_url, init) => {
    forwarded.push(JSON.parse(init.body));
    return Response.json({ messageId: "<staging@example.com>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const stagingEnv = env({
    ENVIRONMENT: "staging",
    BOOKING_BCC_OVERRIDE: "attacker@example.com",
    STAGING_ENQUIRY_RECIPIENT: "staging.tester@example.com",
    CONTACT_EMAIL_RATE_LIMIT: {
      limit: async ({ key }) => {
        emailKeys.push(key);
        return { success: true };
      },
    },
  });

  const first = await worker.fetch(request(validPayload()), stagingEnv);
  const second = await worker.fetch(
    request(validPayload({ email: "someone.else@example.com" })),
    stagingEnv
  );

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(emailKeys.length, 2);
  assert.equal(emailKeys[0], emailKeys[1]);
  for (const email of forwarded) {
    assert.deepEqual(email.to, [{ email: "staging.tester@example.com", name: "Jane Booker" }]);
    assert.equal(email.bcc, undefined);
    assert.deepEqual(email.replyTo, { email: "staging.tester@example.com" });
  }
});

test("ignores local email overrides in production", async (context) => {
  const originalFetch = globalThis.fetch;
  let deliveryUrl;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("siteverify")) {
      return Response.json({
        success: true,
        action: "booking_enquiry",
        hostname: "aaaartists.co",
      });
    }
    deliveryUrl = String(url);
    forwarded = JSON.parse(init.body);
    return Response.json({ messageId: "<production@smtp-relay.mailin.fr>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(
    request(validPayload({ turnstileToken: "production-token" })),
    env({
      ENVIRONMENT: "production",
      TURNSTILE_SECRET_KEY: "production-secret",
      BREVO_API_BASE: "https://attacker.example",
      BOOKING_BCC_OVERRIDE: "attacker@example.com",
      STAGING_ENQUIRY_RECIPIENT: "attacker@example.com",
    })
  );

  assert.equal(response.status, 200);
  assert.equal(deliveryUrl, "https://api.brevo.com/v3/smtp/email");
  assert.deepEqual(forwarded.to, [{ email: "jane@example.com", name: "Jane Booker" }]);
  assert.deepEqual(forwarded.bcc, [{ email: "bookings@aaaartists.co" }]);
  assert.deepEqual(forwarded.replyTo, { email: "bookings@aaaartists.co" });
});

test("escapes customer content in the HTML confirmation", async (context) => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (_url, init) => {
    forwarded = JSON.parse(init.body);
    return Response.json(
      { messageId: "<202607180101.123456789@smtp-relay.mailin.fr>" },
      { status: 201 }
    );
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(
    request(
      validPayload({
        message: '<img src=x onerror="alert(1)">',
      })
    ),
    env()
  );
  assert.equal(response.status, 200);
  assert.doesNotMatch(forwarded.htmlContent, /<img src=x/);
  assert.match(forwarded.htmlContent, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(forwarded.textContent, /<img src=x onerror="alert\(1\)">/);
});

test("rejects invalid fields, header injection and honeypot submissions before delivery", async (context) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ ok: true });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const invalidEmail = await worker.fetch(request(validPayload({ email: "not-an-email" })), env());
  const honeypot = await worker.fetch(
    request(validPayload({ website: "https://spam.example" })),
    env()
  );
  const crlf = await worker.fetch(
    request(validPayload({ name: "Jane\r\nBcc: victim@example.com" })),
    env()
  );
  const emailCrlf = await worker.fetch(
    request(validPayload({ email: "jane@example.com\r\nBcc:victim@example.com" })),
    env()
  );
  const artistCrlf = await worker.fetch(
    request(
      validPayload({
        bookings: [
          {
            ...validPayload().bookings[0],
            artist: "Xijaro & Pitch\r\nBcc: victim@example.com",
          },
        ],
      })
    ),
    env()
  );
  const invalidOption = await worker.fetch(
    request(validPayload({ eventType: "Injected option" })),
    env()
  );
  const conflictingWhatsApp = await worker.fetch(
    request(
      validPayload({
        whatsappNumber: "+447400123456",
        whatsappUsername: "@janebooker",
      })
    ),
    env()
  );
  const discussionWithArtist = await worker.fetch(
    request(validPayload({ contactToDiscuss: true })),
    env()
  );
  const missingArtistWithoutDiscussion = await worker.fetch(
    request(validPayload({ bookings: [] })),
    env()
  );
  const invalidDiscussionValue = await worker.fetch(
    request(validPayload({ contactToDiscuss: "true", bookings: [] })),
    env()
  );
  assert.deepEqual(
    [
      invalidEmail.status,
      honeypot.status,
      crlf.status,
      emailCrlf.status,
      artistCrlf.status,
      invalidOption.status,
      conflictingWhatsApp.status,
      discussionWithArtist.status,
      missingArtistWithoutDiscussion.status,
      invalidDiscussionValue.status,
    ],
    [400, 400, 400, 400, 400, 400, 400, 400, 400, 400]
  );
  assert.equal(calls, 0);
});

test("rejects malformed non-empty times regardless of timing mode", async (context) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ ok: true });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const timeFields of [{ startTime: "<b>x" }, { finishTime: "99:99" }]) {
    const booking = { ...validPayload().bookings[0], ...timeFields };
    const response = await worker.fetch(request(validPayload({ bookings: [booking] })), env());
    assert.equal(response.status, 400);
  }
  assert.equal(calls, 0);
});

test("enforces actor rate limits and HTTP method", async () => {
  const limited = await worker.fetch(
    request(validPayload()),
    env({ CONTACT_ACTOR_RATE_LIMIT: { limit: async () => ({ success: false }) } })
  );
  const wrongMethod = await worker.fetch(request(null, "GET"), env());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("Allow"), "POST");
});

test("keys rate limits by hashed actor and case-normalised email", async (context) => {
  const originalFetch = globalThis.fetch;
  const actorKeys = [];
  const emailKeys = [];
  globalThis.fetch = async () =>
    Response.json({ messageId: "<rate-limit-key-test@example.com>" }, { status: 201 });
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const keyedEnv = env({
    CONTACT_ACTOR_RATE_LIMIT: {
      limit: async ({ key }) => {
        actorKeys.push(key);
        return { success: true };
      },
    },
    CONTACT_EMAIL_RATE_LIMIT: {
      limit: async ({ key }) => {
        emailKeys.push(key);
        return { success: true };
      },
    },
  });
  const secondSubmissionId = "223e4567-e89b-42d3-a456-426614174000";

  await worker.fetch(request(validPayload({ email: "Jane@Example.com" })), keyedEnv);
  await worker.fetch(
    request(validPayload({ email: "jane@example.com", submissionId: secondSubmissionId })),
    keyedEnv
  );
  await worker.fetch(
    request(validPayload(), "POST", { "CF-Connecting-IP": "198.51.100.27" }),
    keyedEnv
  );

  assert.equal(actorKeys[0], actorKeys[1]);
  assert.notEqual(actorKeys[0], actorKeys[2]);
  assert.ok(actorKeys.every((key) => !key.includes("203.0.113.5")));
  assert.equal(new Set(emailKeys).size, 1);
  assert.ok(emailKeys.every((key) => !key.includes("jane@example.com")));
});

test("verifies Turnstile before consuming the email quota", async (context) => {
  const originalFetch = globalThis.fetch;
  let emailLimitCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      return Response.json({
        success: false,
        action: "booking_enquiry",
        hostname: "aaaartists.co",
      });
    }
    throw new Error("Delivery should not run");
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(
    request(validPayload({ turnstileToken: "invalid-token" })),
    env({
      TURNSTILE_SECRET_KEY: "secret",
      CONTACT_EMAIL_RATE_LIMIT: {
        limit: async () => {
          emailLimitCalls += 1;
          return { success: true };
        },
      },
    })
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
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const wrongAction = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret" })
  );
  const wrongHost = await worker.fetch(
    request(validPayload({ turnstileToken: "test-token" })),
    env({ TURNSTILE_SECRET_KEY: "secret" })
  );
  assert.equal(wrongAction.status, 400);
  assert.equal(wrongHost.status, 400);
});

test("rejects a replayed Turnstile token before a second delivery", async (context) => {
  const originalFetch = globalThis.fetch;
  let verificationCalls = 0;
  let deliveryCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("siteverify")) {
      verificationCalls += 1;
      return verificationCalls === 1
        ? Response.json({
            success: true,
            action: "booking_enquiry",
            hostname: "aaaartists.co",
          })
        : Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] });
    }
    deliveryCalls += 1;
    return Response.json({ messageId: "<turnstile-replay-test@example.com>" }, { status: 201 });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const securedEnv = env({ TURNSTILE_SECRET_KEY: "secret" });
  const securedRequest = () => request(validPayload({ turnstileToken: "single-use-token" }));
  const first = await worker.fetch(securedRequest(), securedEnv);
  const replay = await worker.fetch(securedRequest(), securedEnv);

  assert.equal(first.status, 200);
  assert.equal(replay.status, 400);
  assert.equal(verificationCalls, 2);
  assert.equal(deliveryCalls, 1);
});

test("fails closed when production security bindings or secrets are missing", async () => {
  const response = await worker.fetch(
    request(validPayload()),
    env({
      ENVIRONMENT: "production",
      BREVO_API_KEY: undefined,
      TURNSTILE_SECRET_KEY: undefined,
      CONTACT_EMAIL_RATE_LIMIT: undefined,
    })
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.match(body.error, /temporarily unavailable/i);
});

test("stops oversized streamed and dishonest-length bodies at 64 KiB", async () => {
  const oversized = new Uint8Array(BOOKING_LIMITS.bodyBytes + 1).fill(97);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(oversized);
      controller.close();
    },
  });
  const streamedRequest = new Request("https://aaaartists.co/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.5" },
    body: stream,
    duplex: "half",
  });
  const dishonestRequest = new Request("https://aaaartists.co/api/enquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "10",
      "CF-Connecting-IP": "203.0.113.5",
    },
    body: oversized,
  });
  assert.equal((await worker.fetch(streamedRequest, env())).status, 413);
  assert.equal((await worker.fetch(dishonestRequest, env())).status, 413);
});

test("preserves email-provider retry semantics without exposing enquiry data", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("busy", { status: 429, headers: { "Retry-After": "120" } });
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

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
      return Response.json({
        success: true,
        hostname: "example.com",
        metadata: { result_with_testing_key: true },
      });
    }
    return Response.json({ ok: true });
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const staging = await worker.fetch(
    request(validPayload({ turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" })),
    env({
      ENVIRONMENT: "staging",
      STAGING_ENQUIRY_RECIPIENT: "staging.tester@example.com",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    })
  );
  const production = await worker.fetch(
    request(validPayload({ turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" })),
    env({ ENVIRONMENT: "production", TURNSTILE_SECRET_KEY: "real-secret" })
  );
  assert.equal(staging.status, 200);
  assert.equal(production.status, 400);
});

test("marks non-production asset responses noindex and leaves production untouched", async () => {
  const asset = () => new Response("asset", { headers: { "Content-Type": "text/html" } });
  const staging = await worker.fetch(
    new Request("https://aaa-artists-staging.example.workers.dev/"),
    env({ ENVIRONMENT: "staging", ASSETS: { fetch: async () => asset() } })
  );
  const production = await worker.fetch(
    new Request("https://aaaartists.co/"),
    env({ ENVIRONMENT: "production", ASSETS: { fetch: async () => asset() } })
  );
  assert.equal(staging.status, 200);
  assert.equal(staging.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(await staging.text(), "asset");
  assert.equal(production.headers.get("X-Robots-Tag"), null);
  assert.equal(production.headers.get("Content-Type"), "text/html");
});

test("redirects HTTP apex and www to the HTTPS canonical origin", async () => {
  const http = await worker.fetch(new Request("http://aaaartists.co/artists?source=test"), env());
  const www = await worker.fetch(new Request("https://www.aaaartists.co/privacy"), env());
  assert.equal(http.status, 308);
  assert.equal(http.headers.get("Location"), "https://aaaartists.co/artists?source=test");
  assert.equal(www.status, 308);
  assert.equal(www.headers.get("Location"), "https://aaaartists.co/privacy");
});

test("permanently redirects the retired /events page to the roster", async () => {
  const bare = await worker.fetch(new Request("https://aaaartists.co/events"), env());
  const trailing = await worker.fetch(
    new Request("https://aaaartists.co/events/?ref=flyer"),
    env()
  );
  assert.equal(bare.status, 301);
  assert.equal(bare.headers.get("Location"), "https://aaaartists.co/artists");
  assert.equal(trailing.status, 301);
  assert.equal(trailing.headers.get("Location"), "https://aaaartists.co/artists?ref=flyer");
});
