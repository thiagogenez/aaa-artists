# Worker observability

The booking endpoint uses Cloudflare Workers Logs, the platform-native log store already attached
to the Worker. There is no browser SDK, Sentry integration, OpenTelemetry adapter or second data
processor.

## What is retained

Both named environments enable Workers Observability with a head sampling rate of `1`, so every
custom booking event is retained. Invocation logs are disabled: ordinary page and asset requests
do not need a second access log, and excluding them reduces collection and log volume.

The Worker sends structured objects rather than JSON strings, allowing the dashboard to index the
fields directly. Every record has `event` and `requestId`; an event may also carry one of these
allowlisted diagnostic fields:

| Field | Meaning |
| --- | --- |
| `scope` | Whether a rate limit applied to the hashed actor or hashed email key |
| `missing` | Configuration binding or secret names, never their values |
| `reason` | JavaScript error class only, never the error message or response body |

The current events are:

- `enquiry_delivered`
- `enquiry_turnstile_failed`
- `enquiry_rate_limited`
- `enquiry_delivery_unconfigured`
- `enquiry_security_unconfigured`
- `enquiry_delivery_rate_limited`
- `enquiry_delivery_failed`

No enquiry body, name, email address, phone number, message, Turnstile token, secret value or raw IP
is accepted by the log-record builder. The request ID is an opaque UUID generated separately from
the customer's submission ID.

## Where to read logs

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Select `aaa-artists-staging` or `aaa-artists`.
3. Open **Observability**, then **Logs**.
4. Filter the structured `event` field, or filter `requestId` when a failed API response provides
   that code.

Use staging first. A successful staging deployment and smoke test prove the Worker is live, while a
real booking-path request is needed before its first custom log appears. The customer email carries
the separate submission reference, not the internal request ID, so it cannot currently be used to
look up a log record.

Use this retained view for routine diagnosis and post-deploy verification. The Cloudflare telemetry
query API is an equivalent option when the operator has the separate Workers Observability
permission; filter the staging service and structured `event` field, and keep credentials out of
shell history and saved output.

Cloudflare currently documents three days of retention on the Workers Free plan and seven days on
the Workers Paid plan, with seven days as the maximum. Confirm the plan and displayed retention in
the dashboard when investigating an older incident. See the
[Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

## Retained logs versus live Tail

`invocation_logs: false` controls the records stored in Workers Logs. It does not remove Cloudflare's
invocation envelope from the separate real-time Tail stream. Wrangler Tail can show request headers
and network metadata, including a raw client IP, alongside the privacy-safe custom log object.

Use Tail only for a short, authorised staging investigation when the retained view is insufficient:

```bash
npx wrangler tail --env staging --format json
```

Stop the stream immediately after reproducing the event. Do not save, screenshot or paste the full
Tail envelope into an issue, chat or pull request. If evidence must be shared, extract only the
custom `event`, environment, request ID and time, then inspect the extract again for request headers,
network metadata, enquiry content, tokens and secrets. Never run a production Tail merely to verify
a deployment; a production incident needs explicit operator authorisation.

Do not paste enquiry content into retained-log filters either. Search by the allowlisted event or
the internal request ID returned by the API.
