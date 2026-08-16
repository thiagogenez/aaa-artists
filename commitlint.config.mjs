/**
 * Conventional Commits, enforced in CI on the pull request title and on every commit in
 * the pull request (see .github/workflows/commit-style.yml).
 *
 * Deliberately NOT installed as a husky `commit-msg` hook: commits in this repository are
 * signed from the maintainer's own terminal, and a hook in that path risks breaking the
 * one place where signing works.
 */
const commitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // new user-visible capability
        "fix", // corrects broken behaviour
        "docs", // documentation only, including CLAUDE.md / AGENTS.md
        "chore", // dependencies, tooling, repository housekeeping
        "refactor", // behaviour-preserving code change
        "test", // tests only
        "perf", // performance
        "ci", // workflows and deployment automation
        "build", // build system, Next.js or Wrangler configuration
        "style", // formatting only, no code meaning changed
        "revert", // reverts a previous commit
      ],
    ],
    // Prefer subjects at or below 50 characters; 72 is the hard outside limit.
    "header-max-length": [2, "always", 72],
    "body-max-line-length": [1, "always", 100],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-full-stop": [2, "never", "."],
    "scope-case": [2, "always", "kebab-case"],
  },
};

export default commitlintConfig;
