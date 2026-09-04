// Shared helpers for the deployment scripts that drive Wrangler from CI.
// Keeping this logic in versioned Node scripts (instead of inline workflow
// shell) makes it lintable, reviewable, and runnable locally.
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

export const PRODUCTION_TARGET = Object.freeze({
  environment: "production",
  workerName: "aaa-artists",
});
export const STAGING_TARGET = Object.freeze({
  environment: "staging",
  workerName: "aaa-artists-staging",
});
export const PRODUCTION_WORKER = PRODUCTION_TARGET.workerName;
export const VERSION_ID_PATTERN = /^[0-9a-f-]{36}$/;
export const VERSION_VISIBILITY_DELAYS_SECONDS = [0, 2, 4, 8, 12];

export function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function runWrangler(args, { env = {} } = {}) {
  const result = spawnSync("npm", ["exec", "--", "wrangler", ...args], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

export function wranglerJson(args) {
  const result = spawnSync("npm", ["exec", "--", "wrangler", ...args, "--json"], {
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `wrangler ${args.join(" ")} exited with status ${result.status}: ${result.stderr?.trim() || "no error output"}`
    );
  }
  return JSON.parse(result.stdout);
}

// Reads Wrangler's structured output (JSONL) and returns the last entry of a type.
export function lastWranglerOutputEntry(outputFilePath, type) {
  const entries = readFileSync(outputFilePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return entries.findLast((entry) => entry.type === type);
}

export function activeWorkerVersionId(target, { readJson = wranglerJson } = {}) {
  const deployment = readJson([
    "deployments",
    "status",
    "--name",
    target.workerName,
    "--env",
    target.environment,
  ]);
  const active = (deployment.versions ?? []).find((version) => version.percentage === 100);
  const versionId = active?.version_id ?? "";
  if (!VERSION_ID_PATTERN.test(versionId)) {
    throw new Error(`Could not identify the current 100% ${target.environment} version`);
  }
  return versionId;
}

export function activeProductionVersionId() {
  return activeWorkerVersionId(PRODUCTION_TARGET);
}

export function workerVersionExists(versionId, target, { readJson = wranglerJson } = {}) {
  const versions = readJson([
    "versions",
    "list",
    "--name",
    target.workerName,
    "--env",
    target.environment,
  ]);
  return Array.isArray(versions) && versions.some((version) => version.id === versionId);
}

export async function waitForWorkerVersion(
  versionId,
  target,
  {
    delaysSeconds = VERSION_VISIBILITY_DELAYS_SECONDS,
    versionExists = (candidateVersionId) => workerVersionExists(candidateVersionId, target),
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = {}
) {
  for (const delay of delaysSeconds) {
    if (delay > 0) await sleep(delay * 1000);
    try {
      if (versionExists(versionId)) return true;
    } catch {
      // A bounded retry also covers a transient list request failure. Persistent
      // auth or API errors still fail closed once the delays are exhausted.
    }
  }
  return false;
}

export function waitForProductionVersion(versionId, options) {
  return waitForWorkerVersion(versionId, PRODUCTION_TARGET, options);
}

export function versionPreviewDetails(previewUrl, target) {
  let url;
  try {
    url = new URL(previewUrl);
  } catch {
    return null;
  }

  const marker = `-${target.workerName}.`;
  const markerIndex = url.hostname.indexOf(marker);
  const versionPrefix = url.hostname.slice(0, markerIndex);
  const stableHostname = url.hostname.slice(markerIndex + 1);
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    markerIndex < 0 ||
    !/^[0-9a-f]{8}$/.test(versionPrefix) ||
    !stableHostname.endsWith(".workers.dev")
  ) {
    return null;
  }

  return {
    previewUrl: previewUrl.replace(/\/$/, ""),
    workerUrl: `https://${stableHostname}`,
  };
}

export function setGithubOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
  console.log(`${name}=${value}`);
}

export function annotate(level, message) {
  console.log(`::${level}::${message}`);
}
