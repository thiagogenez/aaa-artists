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
checks the title directly. Intermediate commits are not linted because they are not retained on
`main`. Aim for 50 characters and never exceed 72. Use lowercase after the colon and no trailing
period.

Fill in `.github/pull_request_template.md`. A human pull request needs an issue reference and
three sections: `Change`, `Verification`, and `Risks and limitations`.

In `Change`, explain the implementation and anything deliberately left out. In `Verification`,
name each command and its actual result instead of writing "tests pass." Describe manual checks in
the same way: say which page, device, dashboard, or provider you inspected and what you saw.

The rules for public examples apply here too: use fictional paths and identities, and copy output
from the command that printed it. Do not invent a clean-looking result. Dependabot pull requests
keep the concise `Before` and `After` comparison before an automated update is merged.

Local checks are explicit and proportional: run the commands relevant to the files changed. Use
`npm run check:local` when the complete quality and tooling suite is appropriate. Dependency
installation does not alter Git hook configuration; GitHub CI remains the merge authority.

Commits are signed by the repository owner. An agent or contributor prepares and stages a change,
then the owner creates the signed commit. A maintainer may land contributed work through a squash
merge so the signed, validated pull request title becomes the commit on `main`.
