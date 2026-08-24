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

Cloudflare currently documents three days of retention on the Workers Free plan and seven days on
the Workers Paid plan, with seven days as the maximum. Confirm the plan and displayed retention in
the dashboard when investigating an older incident. See the
[Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

## Live debugging

For a short-lived staging investigation, stream new events without changing retention:

```bash
npx wrangler tail --env staging --format json
```

Do not paste enquiry content into log filters, screenshots or issue comments. Record only the event,
environment, request ID and time needed to investigate the failure.
