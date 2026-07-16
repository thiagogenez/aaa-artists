# AAA Artists release TODO

Updated: 2026-07-16

Do not place key values, secrets, deploy-hook URLs, or personal data in this file.

## Staging/production pipeline rollout

- [ ] Set the `staging` GitHub environment secret `CLOUDFLARE_API_TOKEN` (same
  account-scoped token as production): `gh secret set CLOUDFLARE_API_TOKEN --env staging`.
- [ ] Merge the `feat/staging-environment` PR. The push to `main` must deploy staging only
  and leave production untouched.
- [ ] Verify `https://aaa-artists-staging.thiagogenez.workers.dev` renders, sends
  `X-Robots-Tag: noindex`, and passes `npm run smoke:staging`.
- [ ] Dispatch **Deploy production** once and confirm: checks re-run, candidate uploaded
  and smoke-tested on its preview URL, same version promoted, canonical smoke passes.
- [ ] Optionally create a dedicated staging Formspree form and replace the staging
  Worker's placeholder `FORMSPREE_FORM_ID` so end-to-end delivery can be tested there.
- [x] Staging Worker `aaa-artists-staging` created and deployed with Turnstile test-pair
  secrets; GitHub `staging` environment created with `CLOUDFLARE_ACCOUNT_ID` and the
  Turnstile test site key; required branch checks renamed to `checks / verify` and
  `checks / browser` (2026-07-16).

## Immediate handoff after PR #12

- [x] Merged PR #12 into `main` at merge commit `815b46d`. The transactional workflow
  from commit `90080ab` is now the repository's production deployment path.
- [x] Confirmed the post-merge `verify` and `browser` jobs passed in GitHub Actions run
  `29446902618`.
- [x] Confirmed the deployment preflight passed: production configuration, build, bundle,
  Cloudflare API access, custom domains, and the current active version were all valid.
- [x] Fixed inactive-candidate preview discovery in PR #13 (merged into `main` at
  `49f0ef8`). Root cause: Version Preview URLs were never enabled on the `aaa-artists`
  Worker, so Wrangler's `version-upload` output legitimately had no `preview_url`.
  `wrangler.jsonc` now declares `preview_urls: true` with `workers_dev: false`, and the
  workflow only accepts a version-prefixed preview URL.
- [x] Verified the supported mechanism: Cloudflare Version Preview URLs
  (`https://<version>-aaa-artists.<subdomain>.workers.dev`) serve the exact inactive
  version's Worker and static assets. The invariant is preserved and strengthened.
- [x] Performed the one-time enablement with `npx wrangler triggers deploy` (non-versioned
  settings only; custom domains unchanged, no version promoted).
- [x] Confirmed the corrected run end to end: run `29450382754` captured the candidate's
  version-prefixed preview URL, passed the candidate smoke test, promoted the same version
  `5a9cc6d4-0ee9-4e0d-8f14-44261c7683ba` to 100%, and `npm run smoke:production` passed
  against the canonical production domains.

## Required before the protected form is released

- [x] In Cloudflare Turnstile, create a **Managed** widget named for the AAA Artists booking
  form and restrict it to `aaaartists.co`. The `www` hostname redirects to the apex before
  the form loads.
- [x] Add the widget's public **Site key** to the GitHub `production` environment variable
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [x] Add the paired private **Secret key** to the deployed Worker's encrypted runtime secret
  `TURNSTILE_SECRET_KEY`. Never give it a `NEXT_PUBLIC_` name or commit it.
- [x] Confirm the deployed Worker has the encrypted `FORMSPREE_FORM_ID` secret containing
  only the Formspree form ID.
- [x] Confirm GitHub builds with `npm run build:production` and deploys the Worker plus
  static assets with the pinned Wrangler CLI (run `29450382754`).
- [x] Deploy the current changes, then run `npm run smoke:production`.
- [ ] Manually verify the contact form and Turnstile on a real phone and desktop browser.
- [ ] Verify one-hop permanent redirects from HTTP apex and HTTPS `www` to HTTPS apex,
  preserving paths and query strings.
- [ ] Verify `/api/enquiries` returns JSON and that a real valid enquiry is delivered once.

## Privacy facts and operational work

- [ ] Ask Paul to confirm the official privacy email. Replace `PRIVACY_EMAIL` in
  `config/site.js`; `booking@aaaevents.com` is only the current fallback.
- [ ] Confirm whether enquiry information is used for marketing, newsletters, or future
  promotions, and record the answer in `config/privacy.js`.
- [ ] Confirm whether AAA Artists actively targets or regularly accepts EU/EEA business and
  whether EU GDPR or an EU representative applies.
- [ ] Confirm the complete data flow: recipients, processors, storage systems, access,
  transfer countries, and deletion locations, including Formspree, email, WhatsApp, CRM,
  spreadsheets, cloud drives, artists/managers, accountants, and backups as applicable.
- [ ] Assign the person responsible for privacy requests and complaints. Ensure complaints
  are acknowledged within 30 days, investigated, and answered with an outcome.
- [ ] Put the 3-month enquiry and 6-year successful-booking retention schedule into operation
  using the monthly evidence checklist in `docs/privacy-compliance.md`.
- [ ] After every fact is confirmed, update the notice, review it against the real data flow,
  set `detailsConfirmed: true`, and run `npm run check:privacy` followed by
  `npm run check:release`.

## Scheduled event refresh and repository automation

- [x] Re-authenticated the GitHub CLI and verified repository administrator access.
- [x] Protected `main` for administrators and contributors: pull requests plus the stable
  `verify` and `browser` checks are required, branches must be current, conversations must
  be resolved, and force pushes/deletion are blocked.
- [x] Created the GitHub `production` environment and restricted deployments to `main`.
- [x] Add scoped `production` environment secrets `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN`, plus environment variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [x] Disable automatic production deployment from Cloudflare's Git integration, then set
  the GitHub repository variable `DEPLOYMENT_AUTHORITY=github`. Never enable both paths.
- [x] Manually run `.github/workflows/refresh-events.yml` once and confirm the reusable
  deployment workflow builds, dry-runs, deploys, and passes the production smoke tests
  (run `29450382754` on 2026-07-15).
- [x] Confirm the PR and protected-`main` `verify` and `browser` jobs pass. The
  inactive-candidate preview issue is resolved; the transactional deployment path is live.

## Follow-up maintenance

- [ ] Monitor the moderate nested PostCSS advisory and upgrade through a patched stable
  Next.js release when available. Do not accept the audit's forced Next.js 9 downgrade.
- [ ] Optionally remove the existing `ThemeProvider.tsx` effect/state lint warning in a
  separate focused change.
- [ ] Reassess consent and cookie requirements before introducing analytics, advertising,
  tracking, or any other non-essential browser storage.

## Recently completed

- [x] Added verified company address, Companies House/ICO details, retention periods, and a
  data-protection complaints route while keeping the incomplete notice out of search.
- [x] Hardened the Worker with Turnstile verification, streaming 64 KiB limits, actor/email
  rate limits, strict validation, request IDs, upstream retry handling, and safe logging.
- [x] Made the booking API permanently same-origin and added stable submission references.
- [x] Normalized and deduplicated shared events, supported month-only TBC dates, and made
  ticket/status structured data truthful.
- [x] Added visible artist breadcrumbs, centralized navigation and consent facades, and
  compacted the footer to align with the header.
- [x] Added production checks, pinned Wrangler, CI/Dependabot workflows, scheduled event
  refresh automation, deployment smoke tests, and responsive browser coverage.
- [x] Added a reusable CI-gated GitHub production deployment with concurrency, required
  Worker secrets, a guarded Cloudflare-authority cutover, and retrying smoke tests.
- [x] Merged the transactional Cloudflare release workflow: preflight first, inactive
  candidate upload, candidate smoke testing, and final traffic promotion with ambiguous
  result reconciliation and no routine automatic rollback.
- [x] Passed 9 Worker tests, 24 desktop/mobile browser tests, TypeScript, content validation,
  production dry-run, and responsive visual QA.
