// Promotes the smoke-tested candidate to 100% of production traffic. If
// Wrangler reports an error while sending the promotion request, the actual
// deployment state is reconciled from Cloudflare rather than assumed: success
// when the candidate became active, failure when the previous version is still
// active, and an explicit unknown otherwise. No automatic rollback.
import {
  activeProductionVersionId,
  annotate,
  requiredEnvironment,
  runWrangler,
} from "./lib/wrangler-deploy.mjs";

const RECONCILE_DELAYS_SECONDS = [0, 2, 4, 8, 12];

const candidateVersionId = requiredEnvironment("CANDIDATE_VERSION_ID");
const previousVersionId = requiredEnvironment("PREVIOUS_VERSION_ID");
const commit = requiredEnvironment("GITHUB_SHA");

const promotionExit = runWrangler([
  "versions",
  "deploy",
  `${candidateVersionId}@100`,
  "--env",
  "production",
  "--yes",
  "--message",
  `GitHub Actions ${commit}`,
]);

if (promotionExit === 0) {
  process.exit(0);
}

annotate(
  "warning",
  "Wrangler reported a promotion error; reconciling Cloudflare's active deployment state"
);
for (const delay of RECONCILE_DELAYS_SECONDS) {
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  let activeVersionId;
  try {
    activeVersionId = activeProductionVersionId();
  } catch {
    continue;
  }
  if (activeVersionId === candidateVersionId) {
    annotate(
      "warning",
      "Cloudflare confirms the candidate was promoted; treating the release as successful"
    );
    process.exit(0);
  }
  if (activeVersionId === previousVersionId) {
    annotate("error", "Promotion failed and production remains on the previous version");
    process.exit(promotionExit);
  }
}

annotate(
  "error",
  "Promotion result is unknown after repeated Cloudflare status checks; inspect the deployment before retrying"
);
process.exit(promotionExit);
