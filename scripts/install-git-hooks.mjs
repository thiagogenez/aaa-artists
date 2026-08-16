import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

function runGit(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

export function installGitHooks({ cwd = process.cwd(), env = process.env } = {}) {
  if (env.CI) return { status: "skipped", reason: "CI" };

  const rootResult = runGit(["rev-parse", "--show-toplevel"], cwd);
  if (rootResult.status !== 0) return { status: "skipped", reason: "not a Git worktree" };

  const root = rootResult.stdout.trim();
  const preCommit = resolve(root, ".githooks/pre-commit");
  if (!existsSync(preCommit)) throw new Error(`Versioned pre-commit hook not found: ${preCommit}`);

  const configResult = runGit(["config", "core.hooksPath", ".githooks"], root);
  if (configResult.status !== 0) {
    throw new Error(configResult.stderr.trim() || "Could not configure core.hooksPath");
  }

  return { status: "installed", root };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = installGitHooks();
  if (result.status === "installed") console.log("Git hooks installed from .githooks.");
  else console.log(`Git hook installation skipped: ${result.reason}.`);
}
