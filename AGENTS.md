# Codex project memory

## Project architecture

- AAA Artists is a Next.js 16 App Router static export deployed with a Cloudflare Worker.
- Build, local-development, and CI tooling target Node.js 24 LTS. Keep `.node-version`,
  `package.json` engines, GitHub Actions, and `@types/node` on the same major.
- Keep GitHub Actions pinned to full commit SHAs, with version comments for Dependabot.
  Preserve read-only CI permissions, checkout credential isolation, bounded timeouts, and
  the Wrangler dry-run against the same static export exercised by Playwright.
- GitHub Actions is the sole deployment authority. Three tiers: local dev, the
  `aaa-artists-staging` Worker (workers.dev, deployed automatically on pushes to `main`
  after the reusable checks suite), and the `aaa-artists` production Worker (custom
  domains, released only by the manual "Deploy production" dispatch). Keep deployments
  dependent on `checks / verify` and `checks / browser`, protected by the `staging` and
  `production` environments and the `DEPLOYMENT_AUTHORITY=github` guard. Do not restore a
  second automatic path, and never let the scheduled refresh ship a commit that is not
  already live in production.
- Editable artist and event content is in `data/artists/*.yml`; generated JSON is not edited.
- The canonical origin is `https://aaaartists.co`. The Worker redirects HTTP and `www` to
  HTTPS apex while preserving the path and query string. Static Assets must continue to run
  the Worker first unless equivalent Cloudflare redirect rules replace host normalization.
- The contact form always posts to same-origin `/api/enquiries`. Do not restore a public
  cross-origin endpoint or direct browser-to-email-provider delivery.
- The Worker validates streamed bodies, verifies Cloudflare Turnstile before the email
  quota, rate-limits by hashed actor and email, and sends accepted enquiries through Brevo
  (EU-hosted) with an idempotency key. The customer is the visible recipient, the booking
  mailbox is BCC'd on the same message, and replies return to `bookings@aaaartists.co`.
- Secrets stay server-side. Only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is public/build-time.

## Content, SEO, and privacy invariants

- Gigs live in one `gigs:` list per artist (oldest to newest); the date decides past vs
  upcoming. Future-dated gigs require stable `eventId` values; shared events reuse the
  same ID.
- Exact dates use `YYYY-MM-DD`; `YYYY-MM` means the exact day is TBC and must not generate
  exact-date `MusicEvent` structured data.
- Ticket URLs do not imply availability; assert it only through explicit `ticketStatus`.
- Event JSON-LD is centralized on `/events`. Artist pages use visible breadcrumbs with
  matching breadcrumb JSON-LD.
- Third-party media stays click-to-load and uses `referrerPolicy="no-referrer"`.
- Keep `config/privacy.js` `detailsConfirmed: false` until every item in `TODO.md` is
  factually confirmed and the final notice is reviewed. Never invent legal information.
- Do not add a generic cookie banner unless non-essential storage, analytics, or advertising
  is introduced.

## Current state (2026-07-17)

- The privacy/security/SEO/DRY/responsive plan is implemented in the repository.
- Verification passed 9 Worker tests and 24 Playwright tests across desktop Chromium and
  mobile WebKit, including widths from 320px to 1440px.
- TypeScript and content checks pass. Lint has no errors and one pre-existing warning in
  `components/ThemeProvider.tsx`.
- The production dependency audit reports only the accepted moderate nested PostCSS issue;
  do not use the audit's forced downgrade to Next.js 9.
- Production still needs the external configuration and controller decisions in `TODO.md`.
- The transactional Cloudflare deployment path is live and verified. PR #12 (`815b46d`)
  merged the workflow; PR #13 (`49f0ef8`) fixed candidate preview discovery by enabling
  Version Preview URLs (`preview_urls: true`, `workers_dev: false`, plus a one-time
  `npx wrangler triggers deploy` on 2026-07-15). Run `29450382754` uploaded candidate
  `5a9cc6d4-0ee9-4e0d-8f14-44261c7683ba`, smoke-tested it on its version-prefixed preview
  URL, promoted it to 100%, and `npm run smoke:production` passed on the canonical domains.
- The pipeline was then redesigned into staging/production tiers: pushes to `main` deploy
  staging only; production releases require a manual "Deploy production" dispatch that
  re-runs checks and keeps the upload → candidate smoke → promote transaction. Wrangler
  uses named environments (`--env staging` / `--env production`), staging serves
  `X-Robots-Tag: noindex` with the Turnstile test key pair, and deployment logic lives in
  versioned `scripts/*.mjs` files rather than inline workflow shell.
- Shipped 2026-07-16/17: Turnstile explicit rendering that follows the site theme
  (PR #22, verified light/dark/reset lifecycle with the always-pass test key), booking
  form sessionStorage drafts (PR #19), unified date-driven `gigs:` schema (PR #20), and
  an e2e flake guard (PR #21). Production runs `github-366d17e8d372`; the refresh cron
  fires at 01:11 UTC.

## Working conventions

- Prefix shell commands with `rtk`.
- Use `apply_patch` for tracked file edits and preserve unrelated user changes.
- Keep Conventional Commit messages GPG-signed when requested; never add AI attribution.
- Before release, follow `docs/deployment.md` and run the proportional test suite.
