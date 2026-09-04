# Cloudflare deployment

The site is a Next.js static export plus a Cloudflare Worker route for booking enquiries.

## Environments

| Tier | Worker | URL | Released by |
| --- | --- | --- | --- |
| Development | none | `npm run dev` locally | — |
| Staging | `aaa-artists-staging` | `https://aaa-artists-staging.thiagogenez.workers.dev` | every push to protected `main`, automatically, after checks pass |
| Production | `aaa-artists` | `https://aaaartists.co` | manual **Deploy production** workflow dispatch only |

Staging exists to absorb failures before production: it serves every page with
`X-Robots-Tag: noindex`, uses Cloudflare's always-pass Turnstile test key pair, and never
touches the custom domains. Its workflow uploads an inactive version, smoke-tests that exact
version through its Preview URL, waits for it to become deployable, promotes it, and then
smoke-tests the stable staging origin. Merging to `main` can only ever change staging. Production
changes require dispatching **Deploy production** (Actions → Deploy production → Run
workflow on `main`), which re-runs the full checks suite and performs the same transactional
release against the separate production Worker. The daily event refresh updates staging
unconditionally and rebuilds production only when `main` is the exact commit already live
in production, so new code never reaches production through the schedule.

Both deploy targets are defined in `wrangler.jsonc` under `env.staging` and
`env.production`; every Wrangler command takes `--env staging` or `--env production`.

## Build settings

- Node.js version: `24` LTS, declared in `.node-version` and `package.json`
- Production build command: `npm run build:production`
- Static asset directory: `out`
- Wrangler configuration: `wrangler.jsonc`
- Worker endpoint: `POST /api/enquiries`

`npm run build:production` first requires the public Turnstile key and then regenerates artist data and country city files before exporting the site. A separate `npm run gen:cities` Cloudflare step is not required. Local development can continue to use `npm run dev` without a Turnstile key.

GitHub Actions reads `.node-version` and uses Node.js 24 for dependency installation and the Next.js export. `@types/node` uses the same major. Upgrade these declarations together when moving to a later LTS release; do not update only the type definitions.

The canonical public origin is `https://aaaartists.co`. It is defined once in `config/site.js`, so `NEXT_PUBLIC_SITE_URL` is intentionally not required. Preview builds also point canonical metadata, Open Graph, robots, sitemap, and JSON-LD to the production domain.

## Public build variable

Set this as a variable on GitHub's protected `production` environment:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: the public site key for a Turnstile widget restricted to `aaaartists.co` in the Cloudflare dashboard.

The enquiry API is intentionally fixed to same-origin `/api/enquiries`; there is no public cross-origin endpoint override.

## Worker secrets and bindings

Configure these on the deployed `aaa-artists` Worker. Never use a `NEXT_PUBLIC_` name for either
secret. A deliberate live-email test on `aaa-artists-staging` requires a dedicated staging
`BREVO_API_KEY` and `STAGING_ENQUIRY_RECIPIENT` as Worker secrets. The Worker then forces `To` and
`Reply-To` to that one address, omits BCC, and applies the shared email quota to the fixed
recipient regardless of what was entered in the public form. Never put the production Brevo key
behind staging, whose Turnstile test pair is designed to pass every challenge. The Worker accepts
Turnstile testing-key verdicts only when `ENVIRONMENT` is not `production`.

For the one-time setup, add the recipient first and the dedicated key second, using Wrangler's
interactive prompts so neither value appears in shell history:

| Worker binding | Value entered at the prompt | Source |
| --- | --- | --- |
| `STAGING_ENQUIRY_RECIPIENT` | A private test mailbox, such as `staging.tester@example.com` | The tester |
| `BREVO_API_KEY` | The complete `xkeysib-…` value | The dedicated `aaa-artists-staging` key in Brevo |

The first value is an **email address**, not an API key. Wrangler calls both values secrets and
masks both prompts, but they are not interchangeable. Enter the private test mailbox when this
command prompts for a value:

```sh
npx wrangler secret put STAGING_ENQUIRY_RECIPIENT --env staging
```

Then enter the saved, complete staging Brevo key when this command prompts for a value. Never use
the production key:

```sh
npx wrangler secret put BREVO_API_KEY --env staging
```

Confirm that all three binding names exist after setup:

```sh
npx wrangler secret list --env staging
```

The list must contain `BREVO_API_KEY`, `STAGING_ENQUIRY_RECIPIENT`, and
`TURNSTILE_SECRET_KEY`. It cannot display or validate encrypted values. If the names are present
but the form returns `Online delivery is temporarily unavailable`, overwrite
`STAGING_ENQUIRY_RECIPIENT` with the test mailbox and `BREVO_API_KEY` with the saved staging key;
this 503 means a required value is missing or the recipient is not a valid email address. If the
form instead returns `Something went wrong sending your enquiry`, the Worker reached Brevo but
delivery failed; a deliberately deactivated or invalid Brevo key is one possible cause.

Keep the staging API key **deactivated in Brevo** outside a controlled test window. To test,
activate that key in Brevo, submit once at
`https://aaa-artists-staging.thiagogenez.workers.dev/contact`, confirm the acknowledgement in the
private mailbox, and deactivate the key immediately. The encrypted Worker secrets can remain in
place, so later tests need no secret copying. Delete them only when rotating or retiring the key:

```sh
npx wrangler secret delete BREVO_API_KEY --env staging
npx wrangler secret delete STAGING_ENQUIRY_RECIPIENT --env staging
```

Deactivating the provider key disables delivery without losing the encrypted Worker binding. A
staging send proves the deployed Worker, Turnstile test path, Brevo delivery, and real-client
rendering. It does not prove production BCC or reply routing, which still requires the controlled
real-device pass tracked in issue #48.

- Secret `BREVO_API_KEY`: a dedicated Brevo API key used only by the Worker, for the verified `aaaartists.co` sending domain. Brevo is EU-hosted, which keeps booking-email content inside the EU/EEA.
- Secret `TURNSTILE_SECRET_KEY`: the secret paired with the public Turnstile site key.
- Rate-limit bindings `CONTACT_ACTOR_RATE_LIMIT` and `CONTACT_EMAIL_RATE_LIMIT`: defined in `wrangler.jsonc`.
- Variable `ENVIRONMENT=production`: defined in `wrangler.jsonc` and activates fail-closed configuration checks.

The expected Turnstile hostname comes from `config/site.js`. `TURNSTILE_HOSTNAME` is an optional Worker override for a deliberate staging deployment; production does not need it.

Add secrets in Workers & Pages → `aaa-artists` → Settings → Variables and Secrets, or with:

```sh
npx wrangler secret put BREVO_API_KEY --env production
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
```

Before adding the key, authenticate `aaaartists.co` in Brevo with the exact DNS records it
generates (Brevo code, DKIM, and DMARC as offered). Brevo cannot fully disable tracking on
transactional email, so enable anonymized tracking (its CNIL-aligned setting) and per-contact
tracking consent. Click tracking is inert regardless, because the booking acknowledgement
contains no links for Brevo to rewrite; only an anonymized open pixel remains. Incoming mail for
`bookings@aaaartists.co` uses the existing Microsoft 365 mailbox. Never enable Cloudflare Email
Routing on this domain because it would replace the MX records and break Microsoft 365. Configure
the mailbox's authorised **Send As** identity so staff replies leave as `bookings@aaaartists.co`.
Never copy the Worker's production `BREVO_API_KEY` into an email client.

The Worker requests one message to the customer, BCCs the booking mailbox, and sets `Reply-To` to
`bookings@aaaartists.co`. Both parties therefore receive a copy of the same original message and
subject reference. A customer reply returns to the booking mailbox; staff can then reply from the
configured booking alias in that thread. If staff respond from the initial BCC copy before the
customer has replied, they must use **Reply all** so the customer remains a recipient. Confirm
this behaviour in the real booking mail client, because visual thread grouping is ultimately
controlled by each client.

The Worker uses each accepted enquiry's UUID submission ID only as a stable customer and mail
thread reference. It does not configure or claim provider-side deduplication: current Brevo
documentation and upstream observations disagree about the supported placement and behaviour.
Issue #86 records that evidence. Do not add a home-grown persistence layer without proving that
the extra machinery is necessary.

In production, the enquiry endpoint returns `503` rather than accepting unprotected submissions if Turnstile, Brevo, or a rate-limit binding is missing.

Wrangler is pinned in `devDependencies`. Before deployment run `npm run deploy:dry-run`
(production) or `npm run check:deploy:staging`; deploy with `npm run deploy` (production)
or `npm run deploy:staging`. Publishing only `out/` leaves `/api/enquiries` unavailable.
`wrangler.jsonc` requires Turnstile in both environments and additionally requires Brevo
in production, so a production deployment fails before publication when either production
secret is absent. Existing encrypted secrets are preserved across ordinary Wrangler
deployments.

## Domain configuration

Attach `aaaartists.co` and `www.aaaartists.co` to the Worker. Static Assets is configured with `run_worker_first: true` so the Worker can permanently redirect HTTP apex and HTTPS `www` requests before an existing page asset is served, preserving the path and query string. A Cloudflare redirect rule may replace this only after equivalent one-hop behaviour is verified; if it does, narrow Worker-first routing to `/api/*` to avoid unnecessary Worker invocations.

The staging workflow first records the active staging version, uploads a commit-tagged inactive
candidate, smoke-tests its versioned Preview URL, waits for the candidate to appear in the
deployable-version list, promotes it to 100% of the staging Worker, and smoke-tests the stable
staging URL. Every staging command takes `--env staging` and resolves only
`aaa-artists-staging`; tests enforce that the staging scripts do not select production. Any
failure before promotion leaves the previous staging version active.

The production workflow runs only from a manual **Deploy production** dispatch on `main`
(or from the scheduled refresh when `main` already matches the live production commit).
It first re-runs the reusable checks suite, then verifies its API permissions and confirms
that both production domains already target the Worker before uploading application code.
It then uploads a commit-tagged Worker version without deploying it and smoke-tests that
exact version through its `workers.dev` preview URL. Promotion to 100% production traffic
is the final workflow action. Before promotion, the workflow waits for the newly uploaded
candidate to appear in Cloudflare's deployable-version list, covering the short propagation
window where its Preview URL can already work while `versions deploy` cannot find it yet. A
failed check, build, access check, upload, propagation wait, or candidate
smoke test therefore leaves the active production deployment untouched; routine releases
do not use automatic rollback. The canonical domains are not smoke-tested from the
workflow because Cloudflare's zone bot protection returns 403 to GitHub-runner IPs; run
`npm run smoke:production` locally after a release.

Version Preview URLs must be enabled on the `aaa-artists` Worker for the candidate smoke test to work. `env.production` in `wrangler.jsonc` declares `preview_urls: true` (with `workers_dev: false`, so production stays on the custom domains only), and every uploaded version then exposes `https://<version>-aaa-artists.<subdomain>.workers.dev`, serving that version's exact static assets and Worker. Because `wrangler versions upload` only reads this setting, it was enabled once on the Worker with `npx wrangler triggers deploy` on 2026-07-15 (a non-versioned settings change that does not promote a version). The workflow refuses to promote a candidate whose exact version-prefixed preview URL was not returned, so a Worker without Preview URLs enabled fails safe at the upload step rather than promoting an unsmoke-tested version.

Domain attachment is infrastructure rather than part of each application release. When `wrangler.jsonc` domain routes intentionally change, apply and verify that change separately with `npx wrangler triggers deploy` before merging the application release. This keeps route mutations out of the traffic-promotion transaction.

If Wrangler reports an error while sending the final promotion request, the workflow repeatedly queries the active deployment. It reports success when Cloudflare confirms the candidate is active and reports failure when the previous version remains active. An unresolved result is surfaced for manual inspection rather than issuing an automatic rollback.

The obsolete Vercel hostname cannot be redirected by Cloudflare because Cloudflare does not control it. Configure a permanent redirect in the old Vercel project or retire the old deployment after its URLs have been removed from search.

After deployment, verify:

- `https://aaaartists.co/robots.txt` points to `https://aaaartists.co/sitemap.xml`;
- page canonical links use `https://aaaartists.co`;
- the Turnstile widget accepts only the intended hostname; and
- `POST /api/enquiries` returns JSON rather than an asset fallback.

Run `npm run smoke:production` after deployment. Its API check submits only an empty invalid payload, so it verifies fail-closed configuration without creating a Brevo email.

## Scheduled event refresh

The static event split and structured data need a fresh build as dates pass.
`.github/workflows/refresh-events.yml` runs daily and can also be run manually. It always
refreshes staging. It refreshes production only when `main` is the exact commit already
live in production (`scripts/check-production-refresh.mjs` compares the live version's
`github-<sha12>` tag with `main`); a date-only rebuild of released code is safe, while new
code must be released through a manual **Deploy production** dispatch. It does not require
or retain a Cloudflare deploy-hook URL.

The CI workflow validates content, Worker tests, lint, dependency advisories, production export, and desktop/mobile browser behaviour. High or critical production dependency advisories fail CI; the currently accepted moderate nested PostCSS advisory remains visible for review.

CI uses `.node-version`, immutable action commit SHAs, read-only permissions, locked installs, bounded job timeouts, stale pull-request cancellation, and a credential-free Wrangler dry-run of the exact export used by Playwright. The `verify` and `browser` jobs live in the reusable `.github/workflows/checks.yml`; the required branch checks are named `checks / verify` and `checks / browser`.

GitHub Actions is the sole deployment authority for both Workers. On a push to protected
`main`, CI waits for the reusable `checks` suite (`verify` and `browser`) and then deploys
staging only. Production is released by manually dispatching **Deploy production** on
`main`: it re-runs the same checks, builds with the production Turnstile site key, runs
the preflight and Wrangler dry-run, uploads and smoke-tests the inactive candidate, and
promotes it as the final action. Staging performs its equivalent candidate smoke and promotion
only against `aaa-artists-staging`, followed by a smoke test of the stable staging origin. The
heavy deployment logic
lives in versioned scripts (`scripts/record-production-version.mjs`,
`scripts/upload-production-candidate.mjs`, `scripts/promote-production-candidate.mjs`,
`scripts/record-staging-version.mjs`, `scripts/upload-staging-candidate.mjs`,
`scripts/promote-staging-candidate.mjs`, `scripts/check-production-refresh.mjs`) rather than
inline workflow shell, so it is linted and can be exercised locally.

The deployment remains fail-safe until the repository variable `DEPLOYMENT_AUTHORITY` is exactly `github`. The one-time cutover (already performed):

1. Create a protected GitHub environment named `production`, restricted to `main`.
2. Add environment variable `CLOUDFLARE_ACCOUNT_ID` and environment secret `CLOUDFLARE_API_TOKEN`. Scope the API token to the AAA Artists Cloudflare account and only the Worker and zone permissions required by the deployment preflight and version promotion. `CLOUDFLARE_ZONE_ID` is not required; the preflight resolves the `aaaartists.co` zone from the account.
3. Add environment variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Create a GitHub environment named `staging` with variables `CLOUDFLARE_ACCOUNT_ID` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Turnstile test site key `1x00000000000000000000AA`) and secret `CLOUDFLARE_API_TOKEN`.
5. Disable automatic production deployments from Cloudflare's Git integration.
6. Add repository variable `DEPLOYMENT_AUTHORITY=github`.
7. Merge to `main` and confirm the staging deployment and smoke test, then dispatch `Deploy production` and verify the transactional release and canonical smoke tests.

Do not enable the repository variable before disabling Cloudflare's automatic Git deployment, or the two release paths can race and deploy the same commit twice. The required
branch checks on `main` are `checks / verify` and `checks / browser` (the reusable checks
suite); keep those names stable.

## Privacy release gate

Until Paul confirms the controller details, `config/privacy.js` keeps `detailsConfirmed` false. The privacy page remains linked and readable, but clearly identifies pending facts and uses `noindex` so an incomplete notice is not promoted in search results.

After receiving the official information:

1. Replace every pending value in `config/privacy.js` and the temporary privacy email in `config/site.js`.
2. Review the notice against the actual business data flow and processor contracts.
3. Set `detailsConfirmed` to `true`.
4. Run `npm run check:privacy`.
5. Use `npm run check:release` before the final compliance release.

Do not insert dummy legal names, addresses, registration numbers, retention periods, or an EU representative.

## Routine verification

Run before deployment:

```sh
npm test
npm run lint
npm run test:e2e
```

The browser suite builds the production export and tests it in desktop Chromium and mobile WebKit on an isolated local port.
