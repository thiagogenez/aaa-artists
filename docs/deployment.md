# Cloudflare deployment

The site is a Next.js static export plus a Cloudflare Worker route for booking enquiries.

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

- Secret `FORMSPREE_FORM_ID`: only the ID from the Formspree endpoint.
- Secret `TURNSTILE_SECRET_KEY`: the secret paired with the public Turnstile site key.
- Rate-limit bindings `CONTACT_ACTOR_RATE_LIMIT` and `CONTACT_EMAIL_RATE_LIMIT`: defined in `wrangler.jsonc`.
- Variable `ENVIRONMENT=production`: defined in `wrangler.jsonc` and activates fail-closed configuration checks.

The expected Turnstile hostname comes from `config/site.js`. `TURNSTILE_HOSTNAME` is an optional Worker override for a deliberate staging deployment; production does not need it.

Add secrets in Workers & Pages → `aaa-artists` → Settings → Variables and Secrets, or with:

```sh
npx wrangler secret put FORMSPREE_FORM_ID
npx wrangler secret put TURNSTILE_SECRET_KEY
```

In production, the enquiry endpoint returns `503` rather than accepting unprotected submissions if Turnstile, Formspree, or a rate-limit binding is missing.

Wrangler is pinned in `devDependencies`. Before deployment run `npm run deploy:dry-run`; deploy both the Worker and static assets with `npm run deploy`. Publishing only `out/` leaves `/api/enquiries` unavailable. `wrangler.jsonc` declares both runtime secret names as required, so production deployment fails before publication when either secret is absent. Existing encrypted secrets are preserved across ordinary Wrangler deployments.

## Domain configuration

Attach `aaaartists.co` and `www.aaaartists.co` to the Worker. Static Assets is configured with `run_worker_first: true` so the Worker can permanently redirect HTTP apex and HTTPS `www` requests before an existing page asset is served, preserving the path and query string. A Cloudflare redirect rule may replace this only after equivalent one-hop behaviour is verified; if it does, narrow Worker-first routing to `/api/*` to avoid unnecessary Worker invocations.

The production workflow verifies its API permissions and confirms that both production domains already target the Worker before uploading application code. It then uploads a commit-tagged Worker version without deploying it and smoke-tests that exact version through its `workers.dev` preview URL. Promotion to 100% production traffic is the final workflow action. A failed validation, build, access check, upload, or candidate smoke test therefore leaves the active production deployment untouched; routine releases do not use automatic rollback.

Domain attachment is infrastructure rather than part of each application release. When `wrangler.jsonc` domain routes intentionally change, apply and verify that change separately with `npx wrangler triggers deploy` before merging the application release. This keeps route mutations out of the traffic-promotion transaction.

If Wrangler reports an error while sending the final promotion request, the workflow repeatedly queries the active deployment. It reports success when Cloudflare confirms the candidate is active and reports failure when the previous version remains active. An unresolved result is surfaced for manual inspection rather than issuing an automatic rollback.

The obsolete Vercel hostname cannot be redirected by Cloudflare because Cloudflare does not control it. Configure a permanent redirect in the old Vercel project or retire the old deployment after its URLs have been removed from search.

After deployment, verify:

- `https://aaaartists.co/robots.txt` points to `https://aaaartists.co/sitemap.xml`;
- page canonical links use `https://aaaartists.co`;
- the Turnstile widget accepts only the intended hostname; and
- `POST /api/enquiries` returns JSON rather than an asset fallback.

Run `npm run smoke:production` after deployment. Its API check submits only an empty invalid payload, so it verifies fail-closed configuration without creating a Formspree enquiry.

## Scheduled event refresh

The static event split and structured data need a fresh build as dates pass. `.github/workflows/refresh-events.yml` calls the same reusable production deployment workflow daily and can also be run manually. It deploys the current protected `main` commit; it does not require or retain a Cloudflare deploy-hook URL.

The CI workflow validates content, Worker tests, lint, dependency advisories, production export, and desktop/mobile browser behaviour. High or critical production dependency advisories fail CI; the currently accepted moderate nested PostCSS advisory remains visible for review.

CI uses `.node-version`, immutable action commit SHAs, read-only permissions, locked installs, bounded job timeouts, stale pull-request cancellation, and a credential-free Wrangler dry-run of the exact export used by Playwright. Keep the `verify` and `browser` job names stable if they are configured as required branch checks.

GitHub Actions is the intended production deployment authority. On a push to protected `main`, the deployment job waits for both `verify` and `browser`, builds with the production Turnstile site key, runs a Wrangler dry-run, deploys the Worker and assets, and smoke-tests the canonical domains and enquiry route. The same reusable workflow handles scheduled event refreshes.

The deployment remains fail-safe until the repository variable `DEPLOYMENT_AUTHORITY` is exactly `github`. Perform the one-time cutover in this order:

1. Create a protected GitHub environment named `production`, restricted to `main`.
2. Add environment variable `CLOUDFLARE_ACCOUNT_ID` and environment secret `CLOUDFLARE_API_TOKEN`. Scope the API token to the AAA Artists Cloudflare account and only the Worker and zone permissions required by the deployment preflight and version promotion. `CLOUDFLARE_ZONE_ID` is not required; the preflight resolves the `aaaartists.co` zone from the account.
3. Add environment variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Disable automatic production deployments from Cloudflare's Git integration.
5. Add repository variable `DEPLOYMENT_AUTHORITY=github`.
6. Manually run `Refresh event dates`, confirm the `production` environment deployment, and verify the smoke-test result.

Do not enable the repository variable before disabling Cloudflare's automatic Git deployment, or the two release paths can race and deploy the same commit twice.

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
