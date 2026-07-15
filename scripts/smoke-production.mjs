import { SITE_ORIGIN } from "../config/site.js";

const checks = [];
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [0, 2_000, 4_000, 8_000, 12_000];
const configuredOrigin = process.env.SMOKE_ORIGIN?.trim();
const targetOrigin = configuredOrigin ? new URL(configuredOrigin).origin : SITE_ORIGIN;

if (configuredOrigin && !targetOrigin.endsWith(".workers.dev")) {
  throw new Error("SMOKE_ORIGIN must be a Cloudflare workers.dev preview URL");
}

function requestOptions(options = {}) {
  return { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) };
}

async function check(name, run) {
  let lastError;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      await run();
      checks.push({ name, ok: true });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  checks.push({
    name,
    ok: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
}

await check(configuredOrigin ? "candidate homepage" : "apex homepage", async () => {
  const response = await fetch(`${targetOrigin}/`, requestOptions({ redirect: "manual" }));
  if (response.status !== 200) throw new Error(`expected 200, received ${response.status}`);
  if (!response.headers.get("content-security-policy")) throw new Error("CSP header is missing");
});

if (!configuredOrigin) {
  const redirectPath = "/events?source=production-smoke";
  for (const source of ["http://aaaartists.co", "https://www.aaaartists.co"]) {
    await check(`${source} redirect`, async () => {
      const response = await fetch(`${source}${redirectPath}`, requestOptions({ redirect: "manual" }));
      if (![301, 308].includes(response.status)) throw new Error(`expected permanent redirect, received ${response.status}`);
      if (response.headers.get("location") !== `${SITE_ORIGIN}${redirectPath}`) throw new Error(`unexpected location ${response.headers.get("location")}`);
    });
  }
}

await check(configuredOrigin ? "candidate enquiry route" : "Worker enquiry route", async () => {
  const response = await fetch(`${targetOrigin}/api/enquiries`, requestOptions({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }));
  if (response.status !== 400) throw new Error(`expected safe validation 400, received ${response.status}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("API did not return JSON");
});

for (const result of checks) {
  console[result.ok ? "log" : "error"](`${result.ok ? "✓" : "✗"} ${result.name}${result.error ? ` — ${result.error}` : ""}`);
}

if (checks.some((result) => !result.ok)) process.exit(1);
