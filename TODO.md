# AAA Artists release TODO

Updated: 2026-07-14

Do not place key values, secrets, deploy-hook URLs, or personal data in this file.

## Required before the protected form is released

- [ ] In Cloudflare Turnstile, create a **Managed** widget named for the AAA Artists booking
  form and restrict it to `aaaartists.co`. The `www` hostname redirects to the apex before
  the form loads.
- [ ] Add the widget's public **Site key** to the Cloudflare production **build** variable
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] Add the paired private **Secret key** to the deployed Worker's encrypted runtime secret
  `TURNSTILE_SECRET_KEY`. Never give it a `NEXT_PUBLIC_` name or commit it.
- [ ] Confirm the deployed Worker has the encrypted `FORMSPREE_FORM_ID` secret containing
  only the Formspree form ID.
- [ ] Confirm Cloudflare builds with `npm run build:production` and deploys the Worker plus
  static assets with `npx wrangler deploy`.
- [ ] Deploy the current changes, then run `npm run smoke:production`.
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

- [ ] Create a Cloudflare production deploy hook for the existing build.
- [ ] Store the hook URL in GitHub Actions as the encrypted repository secret
  `CLOUDFLARE_DEPLOY_HOOK`.
- [ ] Manually run `.github/workflows/refresh-events.yml` once and confirm the production
  build completes successfully.
- [ ] Confirm the CI workflow runs successfully on the first pushed branch/commit set.

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
- [x] Passed 9 Worker tests, 24 desktop/mobile browser tests, TypeScript, content validation,
  production dry-run, and responsive visual QA.
