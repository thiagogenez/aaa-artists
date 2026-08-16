<!--
Every pull request must contain the issue reference and all seven sections below. They are checked in CI by
.github/workflows/commit-style.yml, and they exist because this repository's pull requests
are its changelog: they are read by people (and agents) who did not write the code.

  1. the related issue      — "Closes #N", or "Refs #N" for partial work
  2. ## Problem             — what is wrong or missing
  3. ## Before              — the input and result before this change
  4. ## After               — the same input and its result with this change
  5. ## Change              — how the result was implemented
  6. ## Verification        — what actually ran and what it returned
  7. ## Risks and limitations — what could go wrong, and what this does not do
  8. ## Next steps          — what is deliberately left for later

A pull request with no issue is not ready for review. Open the issue first.
-->

Closes #

## Problem

<!-- What was wrong or missing, with evidence: a run link, a screenshot, a failing command. -->

## Before

<!-- Show an input and its old result: a command + copied output, or a route + viewport + screenshot. -->

## After

<!-- Repeat the same input and show the result produced by this change. Do not claim unmerged work is live. -->

## Root cause

<!-- Only for fixes. Why it happened, not just where. Delete this section for features. -->

## Change

<!-- How this pull request produces the After result, including anything deliberately left out. -->

-

## Verification

<!-- What you actually ran, and the result. Not what should pass in theory.
     Delete rows that do not apply; add rows for anything else you ran. -->

| Check | Command | Result |
| --- | --- | --- |
| Content | `npm run check` | |
| Quality gate | `npm run check:quality` | |
| Unit + integration | `npm test` | |
| Coverage | `npm run test:coverage` | |
| Browser | `npm run test:e2e` | |
| Build | `npm run build` | |
| Worker bundle | `npm run check:deploy` | |

<!-- Anything verified by hand — a real device, a browser, a dashboard — belongs here too,
     said plainly. "Not tested on a real phone" is a valid and useful entry. -->

## Risks and limitations

<!-- Be specific and honest. What could break, what is not covered, what was assumed.
     "None known" is acceptable only when it is true. Cover, where relevant:
       - what a reviewer should look at hardest
       - behaviour NOT covered by a test
       - anything that only fails in production (Cloudflare, Brevo, Turnstile, real devices)
       - performance, accessibility, or privacy impact
       - how to undo this if it goes wrong -->

-

## Next steps

<!-- Follow-up work this deliberately leaves out, each as an issue number where one exists.
     Write "none" if the issue is fully closed by this pull request. -->

-

## Release impact

<!-- Delete the lines that do not apply. -->

- [ ] Safe on staging only (merging to `main` deploys staging automatically)
- [ ] Needs a manual **Deploy production** dispatch after merge
- [ ] Needs a new secret, repository variable, or external configuration (name it, never the value)
- [ ] Touches the booking pipeline, consent, or the privacy notice
