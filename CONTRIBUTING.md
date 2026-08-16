# Contributing

## Issues

Every change starts with one of the forms in `.github/ISSUE_TEMPLATE/`. The forms phrase the
questions differently, but each issue must establish the problem, the proposed outcome, and why
the work is worth doing.

Show the problem instead of describing it from memory. When a command exposes the problem, paste
the command and its output in a `console` block. For a browser problem, give the route, viewport,
browser, reproduction steps, and a screenshot or failing test when one exists. Never include a
secret or a visitor's personal data.

Examples in this public repository use fictional paths and identities. Copy displayed output from
the program that produced it; do not reconstruct or tidy it from memory.

## Pull requests

Write the title as a Conventional Commit. A squash merge uses it as the commit subject, so CI
checks the title under the same rules as every commit. Aim for 50 characters and never exceed 72.
Use lowercase after the colon and no trailing period.

Fill in `.github/pull_request_template.md`. A pull request needs an issue reference and these seven
sections: `Problem`, `Before`, `After`, `Change`, `Verification`, `Risks and limitations`, and
`Next steps`. Keep `Root cause` for a fix; delete it for a feature or other change where it does
not apply.

`Before` and `After` show the same input twice: first with the wrong or missing result, then with
the result produced by this change. Use a command and its output, the same route and viewport, or
the same reader task. For documentation, show what the reader had before and what the reader gets
after. If the pull request has not landed, describe the `After` state as proposed, not as something
already available on `main`.

In `Change`, explain the implementation and anything deliberately left out. In `Verification`,
name each command and its actual result instead of writing "tests pass." Describe manual checks in
the same way: say which page, device, dashboard, or provider you inspected and what you saw.

The rules for public examples apply here too: use fictional paths and identities, and copy output
from the command that printed it. Do not invent a clean-looking result. Dependabot pull requests
are not exempt from `Before` and `After`; add those sections before merging an automated update.

`npm install` activates the versioned pre-commit hook. It runs the quality gate and tooling tests
before Git creates a commit, including the test that checks the PR-description workflow can load
its validator. For a checkout whose dependencies were installed before the hook existed, run
`npm run hooks:install` once. Agents verify the configured hook path before handing over a commit.
Do not bypass it with `--no-verify`; fix the failure before signing the commit.

Commits are signed by the repository owner. An agent or contributor prepares and stages a change,
then the owner creates the signed commit. A maintainer may land contributed work through a squash
merge so the signed, validated pull request title becomes the commit on `main`.
