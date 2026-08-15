# AAA Artists release history

Updated: 2026-08-15

> **GitHub issues are the live backlog. This file is history.**
>
> Every open task that used to live here is now an issue, so that work is visible before code
> exists and traceable through the pull request that closes it. See "Issue and PR workflow" in
> `CLAUDE.md`. Do not add new open items to this file — open an issue instead.
>
> | Was in this file | Now |
> | --- | --- |
> | ThemeProvider lint warning | [#46](https://github.com/thiagogenez/aaa-artists/issues/46) |
> | Nested PostCSS advisory | [#47](https://github.com/thiagogenez/aaa-artists/issues/47) |
> | Real-device form/Turnstile QA and redirect checks | [#48](https://github.com/thiagogenez/aaa-artists/issues/48) |
> | Queued dependency batch | [#49](https://github.com/thiagogenez/aaa-artists/issues/49) |
> | `SKIDDLE_API_KEY` + commercial approval + first review run | [#50](https://github.com/thiagogenez/aaa-artists/issues/50) |
> | Bandsintown roster access | [#51](https://github.com/thiagogenez/aaa-artists/issues/51) |
> | Skiddle ids for Krevix and Mr. B | [#52](https://github.com/thiagogenez/aaa-artists/issues/52) |
> | Microsoft 365 Send As, and closing Formspree | [#53](https://github.com/thiagogenez/aaa-artists/issues/53) |
> | The seven privacy decisions holding the release gate | [#54](https://github.com/thiagogenez/aaa-artists/issues/54) |
> | Consent decision before analytics or advertising | [#68](https://github.com/thiagogenez/aaa-artists/issues/68) |
>
> The completed record below is kept deliberately: it is how the deployment pipeline, the Brevo
> migration and the events automation were arrived at, and several decisions in it are still
> load-bearing.

Do not place key values, secrets, deploy-hook URLs, or personal data in this file.

## Staging/production pipeline rollout (completed 2026-07-16)

- [x] Staging Worker `aaa-artists-staging` created and deployed with Turnstile test-pair
  secrets; GitHub `staging` environment created with `CLOUDFLARE_ACCOUNT_ID`, the
  Turnstile test site key, and `CLOUDFLARE_API_TOKEN` (Cloudflare token rolled and set in
  both environments); required branch checks renamed to `checks / verify` and
  `checks / browser`.
- [x] Merged PR #14 (three-tier pipeline), PR #15 (staging version annotations), and
  PR #16 (drop post-promotion canonical smoke). Pushes to `main` deploy staging only.
- [x] Verified staging renders, sends `X-Robots-Tag: noindex`, titles its Cloudflare
  versions with the deployed commit, and passes `npm run smoke:staging`.
- [x] Confirmed the failed first dispatch (run `29489950086`) was Cloudflare **Bot Fight
  Mode** challenging GitHub-runner IPs (Security Events: `ruleId bot_fight_mode`, ASN 8075
  Microsoft) — the release itself had succeeded; the post-promotion smoke step was removed
  so promotion is again the final action.
- [x] Dispatched **Deploy production** (run `29492075743`): fully green — checks re-ran,
  candidate uploaded and smoke-tested on its preview URL, promoted to 100%
  (`github-f40c1fd`), and `npm run smoke:production` passed locally. `main` and production
  are aligned, so the daily event refresh resumes rebuilding production.
- [x] Keep outbound email disabled on public staging while it uses Turnstile's always-pass
  test pair; never expose the production email key there.

## Brevo booking email migration

Brevo was chosen over Formspree (paid tier, indefinite third-party form storage) and
Resend (US company — content and logs stay in the US even with its EU sending region).
Brevo is a French provider with EU data centres and a free 300-emails/day tier; under UK
GDPR the EEA is covered by the UK adequacy regulations, so no extra transfer safeguards
are needed for it.

- [x] Create the Brevo account under the business owner, enable MFA, accept/review its
  data-processing terms, and create a dedicated production API key used only by the Worker.
- [x] Authenticate `aaaartists.co` in Brevo using the exact DNS records it provides
  (Brevo code, DKIM, and DMARC). The existing `_dmarc` record was kept at `p=quarantine`
  and Brevo's `rua` report address merged into it rather than adding a second record.
- [x] Brevo cannot fully disable tracking on transactional email, so set anonymized tracking
  and per-contact tracking consent to on. Click tracking has nothing to rewrite (the email
  has no links); only an anonymized open pixel remains.
- [x] Receiving for `bookings@aaaartists.co` is the existing **Microsoft 365** mailbox
  (domain runs M365 via GoDaddy — MX `aaaartists-co.mail.protection.outlook.com`). Paul
  administers it and confirmed the address receives mail. **Never enable Cloudflare Email
  Routing on this domain** — it would replace the MX records and break Microsoft 365.
- [x] Add `BREVO_API_KEY` as an encrypted secret on the production Worker (added, and the
  production deploy `github-62468d6c1f84` promoted 2026-07-23). Not `NEXT_PUBLIC_`; not on
  staging.
- [x] Tested one real production enquiry: the customer received the acknowledgement from
  `bookings@aaaartists.co` and the BCC copy arrived in the M365 `bookings@` inbox (Paul
  confirmed), same `[B3EDCB7D]` reference. Reply-To is `bookings@`, which receives, so
  customer replies thread back. **Still to observe once in real use:** staff **Reply all**
  from the BCC copy reaching the customer, and the thread/identity in the real mail client.
- [x] Deleted the obsolete `FORMSPREE_FORM_ID` secret from both the production and staging
  Workers. The Worker no longer depends on Formspree.

## Resolved transactional deployment work (PR #12 onward)

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
- [x] Confirm the deployed production Worker has the encrypted `BREVO_API_KEY` secret and
  no browser-visible Brevo credential.
- [x] Confirm GitHub builds with `npm run build:production` and deploys the Worker plus
  static assets with the pinned Wrangler CLI (run `29450382754`).
- [x] Deploy the current changes, then run `npm run smoke:production`.
- [x] Verify `/api/enquiries` returns JSON and that a real valid enquiry is delivered once
  (verified on production 2026-07-23: enquiry `[B3EDCB7D]` delivered via Brevo; smoke green).

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

### Artist events automation

- [x] Built Phase 1: Skiddle + Bandsintown adapters, merge/dedupe, comment-preserving YAML
  insertion, draft-PR workflow, and 29 fixture-based unit tests
  (`docs/artist-events-automation.md`).
- [x] Obtained a Skiddle API key and verified the adapter against the live API. Two
  false-positive duplicates found and fixed (qualified venue names, and month-only "TBC"
  dates); both are now regression-tested.
- [x] Filled in the verified `sources:` blocks. Every Skiddle id was confirmed by matching
  the artist's own gig history, never by name alone.
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
