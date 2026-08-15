import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // One retry on CI only: a transiently slow runner must not kill a scheduled
  // deploy, and Playwright still reports retried tests as "flaky" (with trace)
  // rather than hiding them, so genuine regressions stay visible.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // iPad portrait. Without this the suite only saw 375 and 1280, so the
      // 768–1023 band — where the artist page used to be half-phone,
      // half-desktop — was invisible to CI.
      name: "tablet-webkit",
      use: {
        browserName: "webkit",
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      name: "mobile-webkit",
      use: {
        browserName: "webkit",
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    // SITE_DIR lets the same specs run against a different build, so the visual
    // baseline can be captured from a clean build of `main` in a git worktree and
    // then compared with the working tree. Recipe in docs/local-testing.md.
    command: `node scripts/serve-static.mjs ${process.env.SITE_DIR ?? "out"} 3100`,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
