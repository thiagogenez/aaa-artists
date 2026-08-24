/**
 * Structured logging for the Worker.
 *
 * The Worker already emitted useful JSON events. The problem this module solves is not the
 * events — it is that they had no consistent envelope and, until `observability` was enabled
 * in wrangler.jsonc, no retention at all: `console.*` in a Worker goes nowhere unless someone
 * happens to be running `wrangler tail`.
 *
 * Records are shaped like an OpenTelemetry LogRecord (timestamp, severity, body, attributes,
 * resource) so they can be shipped to any OTel-compatible backend later without touching a
 * single call site. Nothing here talks to a third party today; Cloudflare's own Workers Logs
 * ingests these from `console.*`.
 *
 * PRIVACY — this is the important part.
 *
 * A booking enquiry contains a real person's name, email, phone, and event plans. None of it
 * may reach a log. Rather than trusting each call site to remember that, `attributes` are
 * filtered against an allowlist of keys that are known to be non-identifying, and any value
 * that looks like an email address is dropped even if its key is allowed. The visitor is
 * identified only by `requestId` — a random UUID minted per request, also returned to the
 * browser so a support conversation can be tied to a log line without storing anything about
 * the person.
 */

/** Severity numbers follow the OpenTelemetry specification. */
const SEVERITY = {
  debug: { text: "DEBUG", number: 5 },
  info: { text: "INFO", number: 9 },
  warn: { text: "WARN", number: 13 },
  error: { text: "ERROR", number: 17 },
};

/**
 * Attribute keys a log record may carry. Anything not on this list is dropped and counted.
 * Add to it deliberately: every addition is a decision about what leaves the Worker.
 */
const ALLOWED_ATTRIBUTES = new Set([
  "scope", // which rate limit was hit: "actor" | "email"
  "missing", // which required configuration is absent (names, never values)
  "reason", // an Error name, never an Error message
  "status", // an upstream HTTP status code
  "outcome", // short machine-readable result
  "durationMs", // how long the upstream call took
  "retryAfter", // seconds, echoed from an upstream 429
]);

/** Anything resembling an email address never belongs in a log record. */
const EMAIL_SHAPED = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function safeAttributes(attributes) {
  if (!attributes) return { attributes: undefined, dropped: 0 };
  const safe = {};
  let dropped = 0;
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;
    if (!ALLOWED_ATTRIBUTES.has(key)) {
      dropped += 1;
      continue;
    }
    const normalised = typeof value === "string" ? value : String(value);
    if (EMAIL_SHAPED.test(normalised)) {
      dropped += 1;
      continue;
    }
    safe[key] = typeof value === "number" || typeof value === "boolean" ? value : normalised;
  }
  return { attributes: Object.keys(safe).length > 0 ? safe : undefined, dropped };
}

/**
 * Resource attributes describe the thing emitting the record, not the request.
 *
 * `service.version` comes from the Workers version-metadata binding, which is what makes a log
 * line answerable to "which deployment produced this?" — the same version id the production
 * release workflow uploads, smoke-tests and promotes.
 */
function resourceOf(env) {
  const version = env?.CF_VERSION_METADATA;
  return {
    "service.name": "aaa-artists-worker",
    "service.version": version?.id ?? "unknown",
    "service.tag": version?.tag ?? "unknown",
    "deployment.environment": env?.ENVIRONMENT ?? "unknown",
  };
}

/**
 * @param {object} options
 * @param {object} options.env Worker environment bindings.
 * @param {string} options.requestId Correlation id, also returned to the browser.
 * @param {(record: string) => void} [options.sink] Override the output, used by tests.
 */
export function createLogger({ env, requestId, sink }) {
  const resource = resourceOf(env);

  function emit(level, event, attributes) {
    const severity = SEVERITY[level] ?? SEVERITY.info;
    const { attributes: safe, dropped } = safeAttributes(attributes);
    const record = {
      timestamp: new Date().toISOString(),
      severity: severity.text,
      severityNumber: severity.number,
      event,
      requestId,
      resource,
      ...(safe ? { attributes: safe } : {}),
      ...(dropped > 0 ? { droppedAttributes: dropped } : {}),
    };
    const line = JSON.stringify(record);
    if (sink) {
      sink(line);
      return;
    }
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    info: (event, attributes) => emit("info", event, attributes),
    warn: (event, attributes) => emit("warn", event, attributes),
    error: (event, attributes) => emit("error", event, attributes),
  };
}
