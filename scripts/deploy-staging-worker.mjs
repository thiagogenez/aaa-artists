// Deploys the staging Worker and static assets, then publishes the deployed
// workers.dev origin for the staging smoke test. Staging deploys directly (no
// candidate/promote transaction) — it exists to absorb failures before the
// production release path.
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  annotate,
  lastWranglerOutputEntry,
  runWrangler,
  setGithubOutput,
} from "./lib/wrangler-deploy.mjs";

const STAGING_URL_PATTERN = /^https:\/\/aaa-artists-staging\.[^/]+\.workers\.dev\/?$/;

try {
  const outputFilePath = join(process.env.RUNNER_TEMP || tmpdir(), `wrangler-staging-${process.pid}.jsonl`);
  const deployExit = runWrangler(["deploy", "--env", "staging"], {
    env: { WRANGLER_OUTPUT_FILE_PATH: outputFilePath },
  });
  if (deployExit !== 0) throw new Error(`wrangler deploy --env staging exited with status ${deployExit}`);

  const deployment = lastWranglerOutputEntry(outputFilePath, "deploy") ?? {};
  const stagingUrl = (deployment.targets ?? []).find((target) => STAGING_URL_PATTERN.test(target));
  if (!stagingUrl) {
    throw new Error("Staging deployed, but Wrangler reported no aaa-artists-staging workers.dev target to smoke-test.");
  }
  setGithubOutput("staging_url", stagingUrl);
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
