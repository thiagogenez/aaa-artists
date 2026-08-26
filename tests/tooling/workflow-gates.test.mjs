import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { load } from "js-yaml";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const workflowSource = readFileSync(".github/workflows/commit-style.yml", "utf8");
const workflow = load(workflowSource);
const checksWorkflow = load(readFileSync(".github/workflows/checks.yml", "utf8"));

describe("development workflow gates", () => {
  it("keeps the full local gate explicit instead of installing a Git hook", () => {
    assert.equal(packageJson.scripts.prepare, undefined);
    assert.equal(packageJson.scripts["hooks:install"], undefined);
    assert.equal(
      packageJson.scripts["check:local"],
      "npm run check:quality && npm run test:tooling"
    );
  });

  it("validates the squash commit title without constraining intermediate commits", () => {
    const steps = workflow.jobs.commitlint.steps;
    const titleStep = steps.find((step) => step.name === "Check the pull request title");

    assert.ok(titleStep, "the pull request title must remain a required CI check");
    assert.match(titleStep.env.PR_TITLE, /github\.event\.pull_request\.title/);
    assert.match(titleStep.run, /commitlint/);
    assert.doesNotMatch(workflowSource, /--from|--to|Check every commit/);
  });

  it("keeps the PR-body validator available in its CI job", () => {
    const steps = workflow.jobs["description-standard"].steps;
    const checkoutIndex = steps.findIndex((step) => step.name === "Check out repository");
    const nodeIndex = steps.findIndex((step) => step.name === "Set up Node.js");
    const validationIndex = steps.findIndex(
      (step) => step.run === "node scripts/validate-pr-body.mjs"
    );

    assert.ok(checkoutIndex >= 0, "description-standard must check out the repository");
    assert.ok(nodeIndex > checkoutIndex, "Node setup must follow checkout");
    assert.ok(validationIndex > nodeIndex, "validation must follow checkout and Node setup");
    assert.equal(steps[checkoutIndex].with["persist-credentials"], false);
    assert.equal(steps[nodeIndex].with["node-version-file"], ".node-version");
  });

  it("keeps the enquiry round-trip in the browser CI job", () => {
    const steps = checksWorkflow.jobs.browser.steps;
    const buildIndex = steps.findIndex((step) => step.run === "npm run build:test");
    const roundTripIndex = steps.findIndex((step) => step.run === "npm run test:enquiry:run");

    assert.equal(
      packageJson.scripts["test:enquiry:run"],
      "node scripts/check-enquiry-roundtrip.mjs"
    );
    assert.ok(buildIndex >= 0, "the browser job must build the test export");
    assert.ok(roundTripIndex > buildIndex, "the enquiry round-trip must use the shared test build");
  });
});
