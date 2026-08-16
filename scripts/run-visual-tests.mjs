#!/usr/bin/env node
/**
 * Run visual comparisons in the same immutable Linux image used by CI.
 *
 * Fonts and browser rendering differ between macOS, a bare GitHub runner and
 * Playwright's container even when the browser version matches. Keeping this
 * boundary here means `npm run test:visual` has one canonical renderer.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const IMAGE =
  "mcr.microsoft.com/playwright:v1.62.0-noble@sha256:baed2032d533817f3dbe6425de795788430ba345e819a1201337009ba17c9d07";
const workspace = process.cwd();
const siteDir = resolve(process.env.SITE_DIR ?? "out");

if (!existsSync(siteDir)) {
  console.error(`Static export not found at ${siteDir}. Run npm run build first.`);
  process.exit(1);
}

const relativeSiteDir = relative(workspace, siteDir);
const siteIsInWorkspace =
  relativeSiteDir !== ".." &&
  !relativeSiteDir.startsWith(`..${sep}`) &&
  !isAbsolute(relativeSiteDir);
const containerSiteDir = siteIsInWorkspace
  ? `/work/${relativeSiteDir.split(sep).join("/")}`
  : "/site";

const dockerArgs = [
  "run",
  "--rm",
  "--init",
  "--platform",
  "linux/amd64",
  "--ipc=host",
  "-e",
  `SITE_DIR=${containerSiteDir}`,
  "-v",
  `${workspace}:/work`,
];

if (!siteIsInWorkspace) {
  dockerArgs.push("-v", `${siteDir}:/site:ro`);
}

dockerArgs.push(
  "-w",
  "/work",
  IMAGE,
  "node",
  "node_modules/playwright/cli.js",
  "test",
  "tests/e2e/visual.spec.ts",
  "--workers=1",
  ...process.argv.slice(2)
);

const result = spawnSync(process.env.DOCKER_CLI ?? "docker", dockerArgs, {
  stdio: "inherit",
});

if (result.error) {
  console.error(`Could not start Docker: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`Docker stopped after signal ${result.signal}.`);
  process.exit(1);
}

process.exit(result.status ?? 1);
