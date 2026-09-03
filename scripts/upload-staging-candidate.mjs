// Uploads an inactive staging candidate and publishes both its versioned
// Preview URL and the stable staging Worker URL. The workflow smoke-tests the
// exact candidate before promoting it to the staging Worker.
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  annotate,
  lastWranglerOutputEntry,
  requiredEnvironment,
  runWrangler,
  setGithubOutput,
  STAGING_TARGET,
  VERSION_ID_PATTERN,
  versionPreviewDetails,
} from "./lib/wrangler-deploy.mjs";

try {
  const commit = requiredEnvironment("GITHUB_SHA");
  const outputFilePath = join(
    process.env.RUNNER_TEMP || tmpdir(),
    `wrangler-staging-upload-${process.pid}.jsonl`
  );
  const uploadExit = runWrangler(
    [
      "versions",
      "upload",
      "--name",
      STAGING_TARGET.workerName,
      "--env",
      STAGING_TARGET.environment,
      "--strict",
      "--tag",
      `github-${commit.slice(0, 12)}`,
      "--message",
      `GitHub Actions ${commit}`,
    ],
    { env: { WRANGLER_OUTPUT_FILE_PATH: outputFilePath } }
  );
  if (uploadExit !== 0) {
    throw new Error(
      `wrangler versions upload --env ${STAGING_TARGET.environment} exited with status ${uploadExit}`
    );
  }

  const upload = lastWranglerOutputEntry(outputFilePath, "version-upload") ?? {};
  const versionId = upload.version_id ?? "";
  const previewUrl = upload.preview_url ?? "";
  const preview = versionPreviewDetails(previewUrl, STAGING_TARGET);
  if (!VERSION_ID_PATTERN.test(versionId)) {
    throw new Error("Could not identify the uploaded staging candidate");
  }
  if (!preview) {
    throw new Error(
      `Staging candidate ${versionId} uploaded, but Wrangler returned no matching version-prefixed Preview URL. Not promoting.`
    );
  }

  setGithubOutput("version_id", versionId);
  setGithubOutput("preview_url", preview.previewUrl);
  setGithubOutput("staging_url", preview.workerUrl);
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
