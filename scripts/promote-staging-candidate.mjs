// Promotes the smoke-tested staging candidate to 100% of staging traffic. The
// production Worker name and environment never enter this command path.
import {
  activeWorkerVersionId,
  annotate,
  requiredEnvironment,
  runWrangler,
  STAGING_TARGET,
  waitForWorkerVersion,
} from "./lib/wrangler-deploy.mjs";

const RECONCILE_DELAYS_SECONDS = [0, 2, 4, 8, 12];

const candidateVersionId = requiredEnvironment("CANDIDATE_VERSION_ID");
const previousVersionId = requiredEnvironment("PREVIOUS_VERSION_ID");
const commit = requiredEnvironment("GITHUB_SHA");

if (!(await waitForWorkerVersion(candidateVersionId, STAGING_TARGET))) {
  annotate(
    "error",
    `Staging candidate ${candidateVersionId} did not become deployable before the bounded propagation wait expired`
  );
  process.exit(1);
}

const promotionExit = runWrangler([
  "versions",
  "deploy",
  `${candidateVersionId}@100`,
  "--name",
  STAGING_TARGET.workerName,
  "--env",
  STAGING_TARGET.environment,
  "--yes",
  "--message",
  `GitHub Actions ${commit}`,
]);

if (promotionExit === 0) {
  process.exit(0);
}

annotate(
  "warning",
  "Wrangler reported a staging promotion error; reconciling Cloudflare's active deployment state"
);
for (const delay of RECONCILE_DELAYS_SECONDS) {
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  let activeVersionId;
  try {
    activeVersionId = activeWorkerVersionId(STAGING_TARGET);
  } catch {
    continue;
  }
  if (activeVersionId === candidateVersionId) {
    annotate(
      "warning",
      "Cloudflare confirms the staging candidate was promoted; treating the deployment as successful"
    );
    process.exit(0);
  }
  if (activeVersionId === previousVersionId) {
    annotate("error", "Staging promotion failed and staging remains on the previous version");
    process.exit(promotionExit);
  }
}

annotate(
  "error",
  "Staging promotion result is unknown after repeated Cloudflare status checks; inspect the deployment before retrying"
);
process.exit(promotionExit);
