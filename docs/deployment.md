# Cloudflare deployment

The site is a Next.js static export plus a Cloudflare Worker route for booking enquiries.

## Build settings

- Production build command: `npm run build:production`
- Static asset directory: `out`
- Wrangler configuration: `wrangler.jsonc`
- Worker endpoint: `POST /api/enquiries`

`npm run build:production` first requires the public Turnstile key and then regenerates artist data and country city files before exporting the site. A separate `npm run gen:cities` Cloudflare step is not required. Local development can continue to use `npm run dev` without a Turnstile key.

The canonical public origin is `https://aaaartists.co`. It is defined once in `config/site.js`, so `NEXT_PUBLIC_SITE_URL` is intentionally not required. Preview builds also point canonical metadata, Open Graph, robots, sitemap, and JSON-LD to the production domain.

## Public build variable

Set this in the Cloudflare build environment before the production build:

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

Wrangler is pinned in `devDependencies`. Before deployment run `npm run deploy:dry-run`; deploy both the Worker and static assets with `npm run deploy`. Publishing only `out/` leaves `/api/enquiries` unavailable.

## Domain configuration

Attach `aaaartists.co` and `www.aaaartists.co` to the Worker. The Worker permanently redirects HTTP apex and HTTPS `www` requests to the HTTPS apex while preserving the path and query string. A Cloudflare redirect rule may replace this only after equivalent one-hop behaviour is verified.

The obsolete Vercel hostname cannot be redirected by Cloudflare because Cloudflare does not control it. Configure a permanent redirect in the old Vercel project or retire the old deployment after its URLs have been removed from search.

After deployment, verify:

- `https://aaaartists.co/robots.txt` points to `https://aaaartists.co/sitemap.xml`;
- page canonical links use `https://aaaartists.co`;
- the Turnstile widget accepts only the intended hostname; and
- `POST /api/enquiries` returns JSON rather than an asset fallback.

Run `npm run smoke:production` after deployment. Its API check submits only an empty invalid payload, so it verifies fail-closed configuration without creating a Formspree enquiry.

## Scheduled event refresh

The static event split and structured data need a fresh build as dates pass. Create a Cloudflare deploy hook for the existing production build and store its URL as the GitHub Actions secret `CLOUDFLARE_DEPLOY_HOOK`. `.github/workflows/refresh-events.yml` calls that hook daily and can also be run manually. The hook URL is a deployment credential and must never be committed.

The CI workflow validates content, Worker tests, lint, dependency advisories, production export, and desktop/mobile browser behaviour. High or critical production dependency advisories fail CI; the currently accepted moderate nested PostCSS advisory remains visible for review.

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
