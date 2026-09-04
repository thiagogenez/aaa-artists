// Records the version currently serving 100% of staging traffic so a failed
// promotion can be reconciled without touching the production Worker.
import {
  activeWorkerVersionId,
  annotate,
  setGithubOutput,
  STAGING_TARGET,
} from "./lib/wrangler-deploy.mjs";

try {
  setGithubOutput("version_id", activeWorkerVersionId(STAGING_TARGET));
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
