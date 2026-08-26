#!/usr/bin/env node
/**
 * Hermetic browser -> Worker -> Brevo-shaped catcher regression check.
 *
 * The caller builds the static export with the inert test site key first. This
 * script then supplies only dummy local Worker variables, so it cannot reach
 * Brevo, Cloudflare Turnstile, or a real inbox.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = join(ROOT, "node_modules/wrangler/bin/wrangler.js");
const TEST_NAME = "Round Trip Booker";
const TEST_EMAIL = "roundtrip@example.com";
const TEST_MESSAGE = "Hermetic contact form round-trip";
const processes = [];

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      server.close((error) => (error ? reject(error) : resolvePort(address.port)));
    });
  });
}

async function availablePorts(count) {
  const ports = new Set();
  while (ports.size < count) ports.add(await availablePort());
  return [...ports];
}

function startProcess(label, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  const collect = (chunk) => {
    output = `${output}${chunk}`.slice(-20_000);
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  const runningProcess = { child, label, output: () => output };
  processes.push(runningProcess);
  return runningProcess;
}

async function waitForServer(url, runningProcess, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (runningProcess.child.exitCode !== null) {
      throw new Error(`${runningProcess.label} exited early.\n${runningProcess.output()}`);
    }
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    }
  }
  throw new Error(`${runningProcess.label} did not become ready.\n${runningProcess.output()}`);
}

async function waitForCapture(directory, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const captures = (await readdir(directory)).filter((name) => name.endsWith(".txt"));
    if (captures.length === 1) return join(directory, captures[0]);
    if (captures.length > 1) {
      throw new Error(`Expected one captured enquiry, found ${captures.length}.`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error("The local Brevo catcher did not receive an enquiry.");
}

async function stopProcesses() {
  await Promise.all(
    processes.map(
      ({ child }) =>
        new Promise((resolveExit) => {
          if (child.exitCode !== null) {
            resolveExit();
            return;
          }
          const force = setTimeout(() => child.kill("SIGKILL"), 2_000);
          child.once("exit", () => {
            clearTimeout(force);
            resolveExit();
          });
          child.kill("SIGTERM");
        })
    )
  );
}

let temporaryDirectory;
let browser;
try {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "aaa-enquiry-roundtrip-"));
  const captureDirectory = join(temporaryDirectory, "captures");
  const envFile = join(temporaryDirectory, "worker.env");
  const [mailPort, workerPort, inspectorPort] = await availablePorts(3);
  await writeFile(
    envFile,
    [
      "ENVIRONMENT=development",
      "BREVO_API_KEY=local-catcher-only",
      `BREVO_API_BASE=http://127.0.0.1:${mailPort}`,
      "BOOKING_BCC_OVERRIDE=",
      "STAGING_ENQUIRY_RECIPIENT=",
      "TURNSTILE_SECRET_KEY=",
      "",
    ].join("\n"),
    { mode: 0o600 }
  );

  const catcher = startProcess("Mail catcher", process.execPath, ["scripts/mail-catcher.mjs"], {
    MAIL_CATCHER_OUT_DIR: captureDirectory,
    MAIL_CATCHER_PORT: String(mailPort),
  });
  await waitForServer(`http://127.0.0.1:${mailPort}/health`, catcher);

  const worker = startProcess(
    "Wrangler dev",
    process.execPath,
    [
      WRANGLER,
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(workerPort),
      "--inspector-port",
      String(inspectorPort),
      "--env-file",
      envFile,
      "--log-level",
      "warn",
      "--show-interactive-dev-session=false",
    ],
    {
      CI: "true",
      NO_COLOR: "1",
      WRANGLER_LOG_PATH: join(temporaryDirectory, "wrangler.log"),
      WRANGLER_SEND_METRICS: "false",
    }
  );
  const origin = `http://127.0.0.1:${workerPort}`;
  await waitForServer(`${origin}/contact`, worker);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(`${origin}/contact`);
  assert.equal(
    await page.locator('form[data-turnstile="disabled"]').count(),
    1,
    "The enquiry test requires a build:test export with external Turnstile disabled."
  );
  await page.locator('input[name="name"]').fill(TEST_NAME);
  await page.locator('input[name="email"]').fill(TEST_EMAIL);
  await page.locator('input[name="date"]').fill("2026-12-01");
  const artist = page.locator('select[name="booking-0-artist"]');
  await artist.selectOption({ index: 1 });
  const selectedArtist = await artist.inputValue();
  await page.locator('button[aria-controls="section-message"]').click();
  await page.locator('textarea[name="message"]').fill(TEST_MESSAGE);
  await page.getByRole("button", { name: "Send Enquiry", exact: true }).click();
  await page.getByRole("heading", { name: "Enquiry sent" }).waitFor({ timeout: 15_000 });

  const capturePath = await waitForCapture(captureDirectory);
  const capture = await readFile(capturePath, "utf8");
  assert.match(capture, new RegExp(`^To:\\s+${TEST_EMAIL}$`, "m"));
  assert.match(capture, /^Bcc:\s+bookings@aaaartists\.co$/m);
  assert.match(capture, /^Reply-To:\s+bookings@aaaartists\.co$/m);
  assert.match(capture, /^From:\s+AAA Artists <bookings@aaaartists\.co>$/m);
  assert.match(capture, /^Subject:\s+Booking enquiry \[[0-9A-F]{8}\]:/m);
  assert.ok(capture.includes(selectedArtist), "Captured subject should name the selected artist.");
  assert.match(capture, new RegExp(`^Name: ${TEST_NAME}$`, "m"));
  assert.match(capture, new RegExp(`^Email: ${TEST_EMAIL}$`, "m"));
  assert.match(capture, new RegExp(`^Message: ${TEST_MESSAGE}$`, "m"));

  process.stdout.write("Enquiry round-trip passed: form -> Worker -> local Brevo catcher.\n");
} catch (error) {
  const logs = processes
    .map((runningProcess) => {
      const output = runningProcess.output();
      return output ? `\n--- ${runningProcess.label} ---\n${output}` : "";
    })
    .join("");
  if (logs) process.stderr.write(logs);
  throw error;
} finally {
  await browser?.close();
  await stopProcesses();
  if (temporaryDirectory) await rm(temporaryDirectory, { force: true, recursive: true });
}
