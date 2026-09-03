import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { load } from "js-yaml";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const workflowSource = readFileSync(".github/workflows/commit-style.yml", "utf8");
const workflow = load(workflowSource);
const checksWorkflow = load(readFileSync(".github/workflows/checks.yml", "utf8"));
const stagingWorkflow = load(readFileSync(".github/workflows/deploy-staging.yml", "utf8"));
const eventProposalWorkflow = load(
  readFileSync(".github/workflows/fetch-artist-events.yml", "utf8")
);

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

  it("smoke-tests and promotes an isolated staging candidate transactionally", () => {
    const steps = stagingWorkflow.jobs.deploy.steps;
    const recordIndex = steps.findIndex(
      (step) => step.run === "node scripts/record-staging-version.mjs"
    );
    const uploadIndex = steps.findIndex(
      (step) => step.run === "node scripts/upload-staging-candidate.mjs"
    );
    const candidateSmokeIndex = steps.findIndex(
      (step) =>
        step.name === "Smoke-test inactive staging candidate" &&
        step.run === "npm run smoke:staging"
    );
    const promoteIndex = steps.findIndex(
      (step) => step.run === "node scripts/promote-staging-candidate.mjs"
    );
    const promotedSmokeIndex = steps.findIndex(
      (step) => step.name === "Smoke-test promoted staging" && step.run === "npm run smoke:staging"
    );

    assert.ok(recordIndex >= 0, "staging must record its current version before upload");
    assert.ok(uploadIndex > recordIndex, "staging must upload after recording its current version");
    assert.ok(candidateSmokeIndex > uploadIndex, "the inactive staging candidate must be tested");
    assert.ok(promoteIndex > candidateSmokeIndex, "staging must promote only the tested candidate");
    assert.ok(promotedSmokeIndex > promoteIndex, "the stable staging origin must be tested last");
    assert.equal(
      steps[candidateSmokeIndex].env.SMOKE_ORIGIN,
      `\${{ steps.candidate.outputs.preview_url }}`
    );
    assert.equal(
      steps[promotedSmokeIndex].env.SMOKE_ORIGIN,
      `\${{ steps.candidate.outputs.staging_url }}`
    );
    assert.equal(
      stagingWorkflow.jobs.deploy.environment.url,
      `\${{ steps.candidate.outputs.staging_url }}`
    );
  });

  it("keeps every staging version command isolated from production", () => {
    for (const script of [
      "scripts/record-staging-version.mjs",
      "scripts/upload-staging-candidate.mjs",
      "scripts/promote-staging-candidate.mjs",
    ]) {
      const source = readFileSync(script, "utf8");
      assert.match(source, /STAGING_TARGET/);
      assert.doesNotMatch(source, /PRODUCTION_TARGET/);
      assert.doesNotMatch(source, /["']--env["'],\s*["']production["']/);
    }

    const uploadSource = readFileSync("scripts/upload-staging-candidate.mjs", "utf8");
    const promoteSource = readFileSync("scripts/promote-staging-candidate.mjs", "utf8");
    for (const source of [uploadSource, promoteSource]) {
      assert.match(source, /"--name",\s*STAGING_TARGET\.workerName/);
      assert.match(source, /"--env",\s*STAGING_TARGET\.environment/);
    }
  });

  it("removes a published event-proposal branch when draft PR creation fails", () => {
    const steps = eventProposalWorkflow.jobs.propose.steps;
    const checkout = steps.find((step) => step.name === "Check out repository");
    const publish = steps.find((step) => step.name === "Open a draft pull request");

    assert.deepEqual(eventProposalWorkflow.permissions, {});
    assert.deepEqual(eventProposalWorkflow.jobs.propose.permissions, {
      contents: "write",
      "pull-requests": "write",
    });
    assert.equal(checkout.with["persist-credentials"], false);
    assert.match(publish.run, /gh auth setup-git/);
    assert.match(publish.run, /trap cleanup_branch ERR/);
    assert.match(publish.run, /git push origin --delete "\$branch" \|\| true/);
    assert.ok(
      publish.run.indexOf("git push --set-upstream") < publish.run.indexOf("gh pr create"),
      "the proposal branch must be pushed before its pull request is opened"
    );
    assert.ok(
      publish.run.indexOf("gh pr create") < publish.run.indexOf("trap - ERR"),
      "cleanup must remain armed until draft PR creation succeeds"
    );
  });
});
