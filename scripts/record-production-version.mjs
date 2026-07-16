// Records the version currently serving 100% of production traffic so the
// promotion step can later tell a failed release from a successful one.
import { activeProductionVersionId, annotate, setGithubOutput } from "./lib/wrangler-deploy.mjs";

try {
  setGithubOutput("version_id", activeProductionVersionId());
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
