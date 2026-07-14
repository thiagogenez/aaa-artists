import { SITE_ORIGIN } from "../config/site.js";

const checks = [];

async function check(name, run) {
  try {
    await run();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

await check("apex homepage", async () => {
  const response = await fetch(`${SITE_ORIGIN}/`, { redirect: "manual" });
  if (response.status !== 200) throw new Error(`expected 200, received ${response.status}`);
  if (!response.headers.get("content-security-policy")) throw new Error("CSP header is missing");
});

for (const source of ["http://aaaartists.co/", "https://www.aaaartists.co/"]) {
  await check(`${source} redirect`, async () => {
    const response = await fetch(source, { redirect: "manual" });
    if (![301, 308].includes(response.status)) throw new Error(`expected permanent redirect, received ${response.status}`);
    if (response.headers.get("location") !== `${SITE_ORIGIN}/`) throw new Error(`unexpected location ${response.headers.get("location")}`);
  });
}

await check("Worker enquiry route", async () => {
  const response = await fetch(`${SITE_ORIGIN}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (response.status !== 400) throw new Error(`expected safe validation 400, received ${response.status}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("API did not return JSON");
});

for (const result of checks) {
  console[result.ok ? "log" : "error"](`${result.ok ? "✓" : "✗"} ${result.name}${result.error ? ` — ${result.error}` : ""}`);
}

if (checks.some((result) => !result.ok)) process.exit(1);
