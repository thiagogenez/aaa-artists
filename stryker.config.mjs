/**
 * Mutation testing for the two places where a silently weak test is expensive:
 * the Worker (booking pipeline, rate limits, Turnstile, validation) and the
 * event-merge library used by the artist-events automation.
 *
 * Deliberately NOT part of `checks / verify`. A mutation run re-executes the whole
 * suite once per mutant; that is minutes, not seconds, and would push the required
 * gate past its budget for a signal that is useful weekly, not per commit.
 *
 *   npm run test:mutation
 *
 * Stryker's built-in "command" runner is used because the suites run on Node's own
 * test runner (`node --test`), not on Jest or Vitest.
 */
const strykerConfig = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "command",
  commandRunner: {
    command: "npm run test",
  },
  coverageAnalysis: "off",
  mutate: ["worker/index.js", "scripts/lib/merge-events.mjs", "config/booking.js"],
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
  tempDirName: ".stryker-tmp",
  cleanTempDir: true,
  // A floor, not a target. Raise it as the score improves; never lower it to make
  // a red run green.
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  timeoutMS: 60000,
  concurrency: 4,
};

export default strykerConfig;
