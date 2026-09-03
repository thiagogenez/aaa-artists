import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitForProductionVersion } from "../../scripts/lib/wrangler-deploy.mjs";

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
