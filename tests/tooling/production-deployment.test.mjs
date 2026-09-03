import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeWorkerVersionId,
  STAGING_TARGET,
  versionPreviewDetails,
  waitForProductionVersion,
  waitForWorkerVersion,
  workerVersionExists,
} from "../../scripts/lib/wrangler-deploy.mjs";

describe("production version propagation", () => {
  it("waits until an uploaded candidate becomes deployable", async () => {
    const results = [false, false, true];
    const slept = [];

    const visible = await waitForProductionVersion("candidate", {
      delaysSeconds: [0, 2, 4, 8],
      versionExists: () => results.shift(),
      sleep: (milliseconds) => slept.push(milliseconds),
    });

    assert.equal(visible, true);
    assert.deepEqual(slept, [2000, 4000]);
  });

  it("fails closed after the bounded propagation wait", async () => {
    let attempts = 0;
    const slept = [];

    const visible = await waitForProductionVersion("candidate", {
      delaysSeconds: [0, 2, 4],
      versionExists: () => {
        attempts += 1;
        return false;
      },
      sleep: (milliseconds) => slept.push(milliseconds),
    });

    assert.equal(visible, false);
    assert.equal(attempts, 3);
    assert.deepEqual(slept, [2000, 4000]);
  });

  it("retries a transient version-list failure", async () => {
    let attempts = 0;

    const visible = await waitForProductionVersion("candidate", {
      delaysSeconds: [0, 1],
      versionExists: () => {
        attempts += 1;
        if (attempts === 1) throw new Error("temporary API failure");
        return true;
      },
      sleep: () => {},
    });

    assert.equal(visible, true);
    assert.equal(attempts, 2);
  });
});

describe("staging deployment target", () => {
  it("queries only the staging Worker and environment", () => {
    const calls = [];
    const versionId = "4062d7e9-70bc-40e5-8c70-908e28ef48d1";
    const readJson = (args) => {
      calls.push(args);
      return args[0] === "deployments"
        ? { versions: [{ percentage: 100, version_id: versionId }] }
        : [{ id: versionId }];
    };

    assert.equal(activeWorkerVersionId(STAGING_TARGET, { readJson }), versionId);
    assert.equal(workerVersionExists(versionId, STAGING_TARGET, { readJson }), true);
    assert.deepEqual(calls, [
      ["deployments", "status", "--name", "aaa-artists-staging", "--env", "staging"],
      ["versions", "list", "--name", "aaa-artists-staging", "--env", "staging"],
    ]);
    assert.equal(calls.flat().includes("production"), false);
    assert.equal(calls.flat().includes("aaa-artists"), false);
  });

  it("waits for the staging candidate with the shared bounded retry", async () => {
    const results = [false, true];
    const visible = await waitForWorkerVersion("candidate", STAGING_TARGET, {
      delaysSeconds: [0, 2],
      versionExists: () => results.shift(),
      sleep: () => {},
    });

    assert.equal(visible, true);
  });

  it("derives the stable staging URL only from its matching version preview", () => {
    assert.deepEqual(
      versionPreviewDetails(
        "https://4062d7e9-aaa-artists-staging.thiagogenez.workers.dev",
        STAGING_TARGET
      ),
      {
        previewUrl: "https://4062d7e9-aaa-artists-staging.thiagogenez.workers.dev",
        workerUrl: "https://aaa-artists-staging.thiagogenez.workers.dev",
      }
    );
    assert.equal(
      versionPreviewDetails("https://4062d7e9-aaa-artists.thiagogenez.workers.dev", STAGING_TARGET),
      null
    );
  });
});
