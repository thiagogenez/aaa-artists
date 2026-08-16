import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { load } from "js-yaml";
import { installGitHooks } from "../../scripts/install-git-hooks.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const hook = readFileSync(".githooks/pre-commit", "utf8");
const workflow = load(readFileSync(".github/workflows/commit-style.yml", "utf8"));

describe("local commit gates", () => {
  it("installs the versioned pre-commit hook during local dependency setup", () => {
    assert.equal(packageJson.scripts.prepare, "node scripts/install-git-hooks.mjs");
    assert.equal(packageJson.scripts["hooks:install"], "node scripts/install-git-hooks.mjs");
    assert.equal(
      packageJson.scripts["check:pre-commit"],
      "npm run check:quality && npm run test:tooling"
    );
    assert.match(hook, /npm run check:pre-commit/);
  });

  it("sets core.hooksPath inside a Git worktree", () => {
    const directory = mkdtempSync(join(tmpdir(), "aaa-hooks-"));
    try {
      assert.equal(spawnSync("git", ["init", "--quiet"], { cwd: directory }).status, 0);
      mkdirSync(join(directory, ".githooks"));
      writeFileSync(join(directory, ".githooks/pre-commit"), "#!/bin/sh\n");

      assert.equal(installGitHooks({ cwd: directory, env: {} }).status, "installed");
      const configured = spawnSync("git", ["config", "--get", "core.hooksPath"], {
        cwd: directory,
        encoding: "utf8",
      });
      assert.equal(configured.status, 0);
      assert.equal(configured.stdout.trim(), ".githooks");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not change Git configuration during CI installs", () => {
    assert.deepEqual(installGitHooks({ cwd: "/missing", env: { CI: "true" } }), {
      status: "skipped",
      reason: "CI",
    });
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
});
