// Decides whether the scheduled event refresh may rebuild production: only
// when main is the exact commit already live in production. A date-only
// rebuild of released code is safe; new code must go through a manual
// "Deploy production" dispatch instead.
import {
  activeProductionVersionId,
  annotate,
  PRODUCTION_WORKER,
  requiredEnvironment,
  setGithubOutput,
  wranglerJson,
} from "./lib/wrangler-deploy.mjs";

try {
  const commit = requiredEnvironment("GITHUB_SHA");
  const versionId = activeProductionVersionId();
  const version = wranglerJson(["versions", "view", versionId, "--name", PRODUCTION_WORKER]);
  const liveTag = version.annotations?.["workers/tag"] ?? "";
  const expectedTag = `github-${commit.slice(0, 12)}`;

  if (liveTag === expectedTag) {
    setGithubOutput("refresh", "true");
  } else {
    setGithubOutput("refresh", "false");
    annotate("notice", `Production runs '${liveTag || "<untagged>"}' but main is ${expectedTag}; skipping the production refresh. Dispatch 'Deploy production' to release main.`);
  }
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
