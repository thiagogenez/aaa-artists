// Shared helpers for the deployment scripts that drive Wrangler from CI.
// Keeping this logic in versioned Node scripts (instead of inline workflow
// shell) makes it lintable, reviewable, and runnable locally.
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

export const PRODUCTION_WORKER = "aaa-artists";
export const VERSION_ID_PATTERN = /^[0-9a-f-]{36}$/;

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
    throw new Error(`wrangler ${args.join(" ")} exited with status ${result.status}: ${result.stderr?.trim() || "no error output"}`);
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

export function activeProductionVersionId() {
  const deployment = wranglerJson(["deployments", "status", "--name", PRODUCTION_WORKER]);
  const active = (deployment.versions ?? []).find((version) => version.percentage === 100);
  const versionId = active?.version_id ?? "";
  if (!VERSION_ID_PATTERN.test(versionId)) {
    throw new Error("Could not identify the current 100% production version");
  }
  return versionId;
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
