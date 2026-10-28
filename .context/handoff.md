# Current handoff

Updated: 2026-08-27

## Current state

- Issue #58 is complete through PR #91. The current `/contact` performance budget passes at
  214,157 bytes gzip of JavaScript and 233,078 bytes gzip total.
- Issue #94 is complete through PR #95. `npm run test:enquiry` exercises the full local form →
  Worker → mail-catcher round trip without real credentials or delivery.
- Issue #96 is complete through PR #97. Staging secret setup now distinguishes the private test
  mailbox from the dedicated Brevo API key, and invalid recipients fail closed before delivery.
- Issue #98 is complete through PR #99. The responsive-width test uses one navigation; main CI
  passed 123 browser tests with zero flaky tests, then deployed and smoke-tested staging.
- `main` is clean and synchronized. Production has not been deployed.
- The staging Worker retained `BREVO_API_KEY`, `STAGING_ENQUIRY_RECIPIENT`, and
  `TURNSTILE_SECRET_KEY` after deploy. Their values must never be written here. The dedicated
  staging Brevo key should remain deactivated outside a controlled live-email test.

## Issue #47 implementation

- Branch `improve/drop-postcss-override` updates `next` and `eslint-config-next` from 16.2.12 to
  16.3.3, removes only the PostCSS override, and has `package.json` plus `package-lock.json`
  staged for the maintainer's signed commit.
- Next now owns PostCSS 8.5.23 and Tailwind owns 8.5.26. The high and moderate audits report zero
  vulnerabilities; content, local quality/tooling, 70 unit/integration tests, the Webpack static
  build, and 81 functional browser tests pass.
- Default Turbopack build verification remains for CI: its Next 16.3 PostCSS worker cannot bind an
  internal port in the agent environment (`EPERM`). Canonical Linux visual checks also remain for
  CI because Docker is stopped and the old Podman VM exits immediately. No Darwin snapshots were
  retained.
- The external-block label was removed and progress is recorded in issue comment
  `issuecomment-5438392470`. The prepared PR body is `/private/tmp/pr-47.md`.

## Issue #48 evidence and remaining work

- A controlled staging submission reached the fixed private recipient in Gmail and rendered
  correctly. Evidence is recorded in issue #48 comment `issuecomment-5431530240`.
- Chrome 151 desktop checks passed on staging: Turnstile reached success in light and dark themes,
  the phone and Germany/Berlin controls were usable, and the console remained clear. At a 320 px
  mobile/touch emulation with all sections open, both themes had exactly 320 px scroll width and
  no horizontal overflow. This is emulation, not a physical-phone or touch-keyboard pass.
- Chrome Network proved the HTTPS `www` redirect as one `308` hop with path/query preservation and
  `/events` as one `301` hop to `/artists`. Chrome upgraded the HTTP apex locally with a
  non-authoritative `307 HttpsUpgrades`, so the Worker status/permanence remains inconclusive.
- Evidence is recorded in issue #48 comment `issuecomment-5437155667`.
- Still needed: physical-phone theme/touch-keyboard checks, server-authoritative HTTP-apex testing
  in a client that does not pre-upgrade HTTPS, and the production-only reply-thread check.

## Browser tooling

- Chrome DevTools MCP 1.8.0 is operational after the restart. A direct request listed the browser
  pages successfully and the #48 checks used its snapshots, screenshots, interaction, emulation,
  console, and Network tools.

## Next

1. Create the signed #47 commit, push `improve/drop-postcss-override`, and open its PR with
   `/private/tmp/pr-47.md`, one maintainer step at a time.
2. Require both GitHub checks to pass before merging; they own the default Turbopack build and
   canonical Linux visual proof unavailable locally.
3. Resume #48 with the physical-phone theme/touch-keyboard pass and the remaining redirect/reply
   evidence after #47 is handed off.
4. Do not deploy production. The privacy release gate remains blocked by external review in #54.
