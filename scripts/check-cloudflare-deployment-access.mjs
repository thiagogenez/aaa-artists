const API_ORIGIN = "https://api.cloudflare.com/client/v4";
const WORKER_NAME = "aaa-artists";
const ZONE_NAME = "aaaartists.co";
const EXPECTED_HOSTNAMES = [ZONE_NAME, `www.${ZONE_NAME}`];
const REQUEST_TIMEOUT_MS = 10_000;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function cloudflareRequest(path, token) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Cloudflare ${path} returned non-JSON status ${response.status}`);
  }

  if (!response.ok || !body.success) {
    const details = Array.isArray(body.errors)
      ? body.errors.map(({ code, message }) => `${code ?? "unknown"}: ${message ?? "unknown error"}`).join("; ")
      : `HTTP ${response.status}`;
    throw new Error(`Cloudflare ${path} failed: ${details}`);
  }

  return body.result;
}

export async function checkCloudflareDeploymentAccess({ accountId, token }) {
  const zoneQuery = new URLSearchParams({ name: ZONE_NAME, "account.id": accountId });
  const zones = await cloudflareRequest(`/zones?${zoneQuery}`, token);
  if (!Array.isArray(zones) || zones.length !== 1 || !zones[0]?.id) {
    throw new Error(`Expected one accessible ${ZONE_NAME} zone in the configured Cloudflare account`);
  }

  const zoneId = zones[0].id;
  await cloudflareRequest(`/zones/${encodeURIComponent(zoneId)}/workers/routes`, token);

  const domainQuery = new URLSearchParams({ service: WORKER_NAME, zone_id: zoneId });
  const domains = await cloudflareRequest(`/accounts/${encodeURIComponent(accountId)}/workers/domains?${domainQuery}`, token);
  const actualHostnames = Array.isArray(domains)
    ? domains
      .filter((domain) => domain.service === WORKER_NAME && domain.zone_id === zoneId)
      .map((domain) => domain.hostname)
      .sort()
    : [];
  const expectedHostnames = [...EXPECTED_HOSTNAMES].sort();

  if (JSON.stringify(actualHostnames) !== JSON.stringify(expectedHostnames)) {
    throw new Error(`Expected ${expectedHostnames.join(", ")} to target ${WORKER_NAME}; found ${actualHostnames.join(", ") || "none"}`);
  }

  return { zoneId, hostnames: actualHostnames };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await checkCloudflareDeploymentAccess({
      accountId: requiredEnvironment("CLOUDFLARE_ACCOUNT_ID"),
      token: requiredEnvironment("CLOUDFLARE_API_TOKEN"),
    });
    console.log(`Cloudflare access verified for ${result.hostnames.join(" and ")}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
