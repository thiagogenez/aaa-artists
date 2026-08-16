// Uploads an inactive, commit-tagged production candidate and requires its
// version-prefixed Preview URL (https://<8-hex-version>-<worker>.<subdomain>.workers.dev)
// so the smoke test exercises this exact inactive candidate — never a stable
// alias or the workers.dev root, which could point at a different version.
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  annotate,
  lastWranglerOutputEntry,
  requiredEnvironment,
  runWrangler,
  setGithubOutput,
  VERSION_ID_PATTERN,
} from "./lib/wrangler-deploy.mjs";

const PREVIEW_URL_PATTERN = /^https:\/\/[0-9a-f]{8}-[a-z0-9-]+\.[^/]+\.workers\.dev\/?$/;

try {
  const commit = requiredEnvironment("GITHUB_SHA");
  const outputFilePath = join(
    process.env.RUNNER_TEMP || tmpdir(),
    `wrangler-upload-${process.pid}.jsonl`
  );
  const uploadExit = runWrangler(
    [
      "versions",
      "upload",
      "--env",
      "production",
      "--strict",
      "--tag",
      `github-${commit.slice(0, 12)}`,
      "--message",
      `GitHub Actions ${commit}`,
    ],
    { env: { WRANGLER_OUTPUT_FILE_PATH: outputFilePath } }
  );
  if (uploadExit !== 0)
    throw new Error(`wrangler versions upload exited with status ${uploadExit}`);

  const upload = lastWranglerOutputEntry(outputFilePath, "version-upload") ?? {};
  const versionId = upload.version_id ?? "";
  const previewUrl = upload.preview_url ?? "";
  if (!VERSION_ID_PATTERN.test(versionId)) {
    throw new Error("Could not identify the uploaded release candidate");
  }
  if (!PREVIEW_URL_PATTERN.test(previewUrl)) {
    annotate(
      "error",
      `Candidate ${versionId} uploaded, but Wrangler returned no version-prefixed Preview URL (got: '${previewUrl || "<empty>"}').`
    );
    throw new Error(
      "Version Preview URLs must be enabled on the aaa-artists Worker so the exact inactive candidate can be smoke-tested before promotion. " +
        'wrangler.jsonc sets "preview_urls": true, but `wrangler versions upload` only reads this — enable Preview URLs once on the Worker ' +
        "(Cloudflare dashboard, or a one-time `npx wrangler triggers deploy --env production`). See docs/deployment.md. Not promoting."
    );
  }

  setGithubOutput("version_id", versionId);
  setGithubOutput("preview_url", previewUrl);
} catch (error) {
  annotate("error", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
