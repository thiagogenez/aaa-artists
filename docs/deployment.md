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
touches the custom domains. Merging to `main` can only ever change staging. Production
changes require dispatching **Deploy production** (Actions → Deploy production → Run
workflow on `main`), which re-runs the full checks suite and then performs the
transactional release described below. The daily event refresh updates staging
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

Configure these on the deployed `aaa-artists` Worker. Never use a `NEXT_PUBLIC_` name for either secret.
The `aaa-artists-staging` Worker requires only its Turnstile test secret. Outbound email is
disabled there unless a deliberately restricted staging `BREVO_API_KEY` is added. Do not
put the production Brevo key behind the public staging form, whose Turnstile test pair is
designed to pass every challenge. The Worker accepts Turnstile testing-key verdicts only
when `ENVIRONMENT` is not `production`.

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
generates (Brevo code, DKIM, and DMARC as offered) and leave open/click tracking disabled
for transactional email. Configure Cloudflare Email Routing so incoming mail for
`bookings@aaaartists.co` reaches the authorised booking inbox. To keep staff replies
visibly within the same thread and identity, configure that mailbox to send as
`bookings@aaaartists.co` using Brevo's SMTP relay or another authenticated outbound
provider. Brevo issues SMTP credentials separately from API keys; never copy the Worker's
production `BREVO_API_KEY` into an email client.

The Worker sends one idempotent message to the customer, BCCs the booking mailbox, and sets
`Reply-To: bookings@aaaartists.co`. Both parties therefore receive a copy of the same
original message and subject reference. A customer reply returns to the booking mailbox;
staff can then reply from the configured booking alias in that thread. If staff respond
from the initial BCC copy before the customer has replied, they must use **Reply all** so
the customer remains a recipient. Confirm this behaviour in the real booking mail client,
because visual thread grouping is ultimately controlled by each client.

The Worker sends each accepted enquiry with a UUID `Idempotency-Key` (the submission ID),
which Brevo deduplicates for 30 minutes, so client retries of the same submission cannot
double-email anyone.

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

The production workflow runs only from a manual **Deploy production** dispatch on `main`
(or from the scheduled refresh when `main` already matches the live production commit).
It first re-runs the reusable checks suite, then verifies its API permissions and confirms
that both production domains already target the Worker before uploading application code.
It then uploads a commit-tagged Worker version without deploying it and smoke-tests that
exact version through its `workers.dev` preview URL. Promotion to 100% production traffic
is the final workflow action. A failed check, build, access check, upload, or candidate
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
promotes it as the final action. The heavy deployment logic
lives in versioned scripts (`scripts/record-production-version.mjs`,
`scripts/upload-production-candidate.mjs`, `scripts/promote-production-candidate.mjs`,
`scripts/deploy-staging-worker.mjs`, `scripts/check-production-refresh.mjs`) rather than
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
