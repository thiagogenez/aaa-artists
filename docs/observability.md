# Observability

What the Worker records, where to read it, and what it deliberately does not collect.
Added for issue #41.

## The problem this solved

`worker/index.js` had good structured events — `enquiry_delivered`, `enquiry_turnstile_failed`,
`enquiry_rate_limited`, and the 502 catch-all. **None of them were retained.** Workers Logs are
off by default, so `console.*` output existed only while somebody was running `wrangler tail`.
If Brevo had started rejecting sends at 02:00, nobody would have found out until a promoter
said they never got a reply.

## What is enabled

| Setting | Where | Effect |
| --- | --- | --- |
| `observability.enabled: true` | `wrangler.jsonc`, both environments | Cloudflare ingests and retains `console.*` output |
| `head_sampling_rate: 1` | same | Keeps 100% of records. The booking API sees a handful of requests a day; a sampled-away record is exactly the one that would have explained a lost enquiry |
| `version_metadata` binding | same | Lets a record name the deployed version that produced it |

No third-party service is involved. Nothing leaves Cloudflare.

## The shape of a record

Every record is an OpenTelemetry-shaped LogRecord, produced by `worker/observability.js`:

```json
{
  "timestamp": "2026-08-11T16:45:59.832Z",
  "severity": "INFO",
  "severityNumber": 9,
  "event": "enquiry_delivered",
  "requestId": "0aadd41a-4082-4a86-bdec-0f0f9ad6b596",
  "resource": {
    "service.name": "aaa-artists-worker",
    "service.version": "5a9cc6d4-0ee9-4e0d-8f14-44261c7683ba",
    "service.tag": "github-366d17e8d372",
    "deployment.environment": "production"
  },
  "attributes": { "outcome": "sent", "durationMs": 412 }
}
```

`service.version` is the same Cloudflare version id the release workflow uploads, smoke-tests
and promotes, so a record can be traced back to an exact deployment. The OTel shape is not
decoration: it means these records can be exported to any OTel-compatible backend later without
editing a single call site.

## Events

| Event | Severity | Emitted when |
| --- | --- | --- |
| `enquiry_delivered` | INFO | Brevo accepted the message |
| `enquiry_rate_limited` | WARN | Actor or email limit hit (`scope` says which) |
| `enquiry_turnstile_failed` | WARN | The security check expired or failed |
| `enquiry_delivery_rate_limited` | WARN | Brevo returned 429 |
| `enquiry_delivery_unconfigured` | ERROR | `BREVO_API_KEY` is missing |
| `enquiry_security_unconfigured` | ERROR | Production is missing required configuration |
| `enquiry_delivery_failed` | ERROR | The 502 path — an exception reached the handler |

## Privacy: what is never logged

A booking enquiry contains a real person's name, email, phone, and event plans. **None of it
may reach a log**, and that is enforced rather than remembered:

- `attributes` are filtered against an **allowlist** of non-identifying keys
  (`scope`, `missing`, `reason`, `status`, `outcome`, `durationMs`, `retryAfter`). Anything else
  is dropped and counted as `droppedAttributes`.
- Any value that **looks like an email address** is dropped even when its key is allowed. This
  matters for `reason`: a network error message can contain the address it failed to reach.
- Only an `Error`'s **name** is recorded, never its message.
- The visitor's **IP is never logged**. It is hashed for rate limiting and nothing else.
- The only identifier is `requestId` — a random UUID minted per request and also returned to the
  browser, so a support conversation can be tied to a log line without storing anything about
  the person.

`tests/worker/observability.test.mjs` runs a full enquiry through the Worker with a payload full
of personal data and asserts that none of it — name, email, phone, WhatsApp handle, company,
event name, venue, message, or IP — appears anywhere in the captured output.

## Tracing one enquiry

The customer's acknowledgement email carries a reference like `[B3EDCB7D]`, and the browser
receives the full `requestId` from `/api/enquiries`. In the Cloudflare dashboard:

**Workers & Pages → aaa-artists → Logs**, then filter on `requestId`.

To watch live instead:

```bash
npx wrangler tail --env production --format pretty
npx wrangler tail --env staging --format pretty
```

## What was deliberately not adopted

- **Datadog, New Relic.** There is no infrastructure to monitor — one Worker and a static
  export. Both are priced and scoped for fleets, and each would add a paid vendor and a second
  data processor for signal Cloudflare already gives us.
- **A browser-side error or RUM SDK, Sentry included.** This is a controller decision, not an
  engineering one: it would ship visitor IPs and page context to a third party, and this site
  deliberately has no analytics consent path (`AGENTS.md`: "do not extend this one to analytics
  or advertising without a decision from the controller"). Adopting one needs a privacy-notice
  update and a lawful basis first.

**Still open:** whether to run **Sentry on the Worker only** — no browser SDK — so the 502 path
raises an alert instead of sitting in a log stream nobody reads. It is still a US processor
receiving error metadata. The answer belongs on issue #41; nothing above depends on it.
