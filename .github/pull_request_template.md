<!--
Every pull request must contain the issue reference and the three sections below. They are checked in CI by
.github/workflows/commit-style.yml, and they exist because this repository's pull requests
are its changelog: they are read by people (and agents) who did not write the code.

  1. the related issue      — "Closes #N", or "Refs #N" for partial work
  2. ## Change              — what changed and what was deliberately left out
  3. ## Verification        — what actually ran and what it returned
  4. ## Risks and limitations — what could go wrong, and what this does not do

A pull request with no issue is not ready for review. Open the issue first.
-->

Closes #

## Change

<!-- What changed, why this is the responsible scope, and anything deliberately left out. -->

-

## Verification

<!-- What you actually ran, and the result. Not what should pass in theory.
     Delete rows that do not apply; add rows for anything else you ran. -->

| Check | Command | Result |
| --- | --- | --- |
| Content | `npm run check` | |
| Complete local gate | `npm run check:local` | |
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

## Release impact

<!-- Delete the lines that do not apply. -->

- [ ] Safe on staging only (merging to `main` deploys staging automatically)
- [ ] Needs a manual **Deploy production** dispatch after merge
- [ ] Needs a new secret, repository variable, or external configuration (name it, never the value)
- [ ] Touches the booking pipeline, consent, or the privacy notice
