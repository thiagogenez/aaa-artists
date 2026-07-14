# Codex project memory

## Project architecture

- AAA Artists is a Next.js 16 App Router static export deployed with a Cloudflare Worker.
- Editable artist and event content is in `data/artists/*.yml`; generated JSON is not edited.
- The canonical origin is `https://aaaartists.co`. The Worker redirects HTTP and `www` to
  HTTPS apex while preserving the path and query string.
- The contact form always posts to same-origin `/api/enquiries`. Do not restore a public
  cross-origin endpoint or direct browser-to-Formspree delivery.
- The Worker validates streamed bodies, verifies Cloudflare Turnstile before the email
  quota, rate-limits by hashed actor and email, and forwards accepted enquiries to Formspree.
- Secrets stay server-side. Only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is public/build-time.

## Content, SEO, and privacy invariants

- Upcoming gigs require stable `eventId` values. Shared events reuse the same ID.
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

## Current state (2026-07-14)

- The privacy/security/SEO/DRY/responsive plan is implemented in the repository.
- Verification passed 9 Worker tests and 24 Playwright tests across desktop Chromium and
  mobile WebKit, including widths from 320px to 1440px.
- TypeScript and content checks pass. Lint has no errors and one pre-existing warning in
  `components/ThemeProvider.tsx`.
- The production dependency audit reports only the accepted moderate nested PostCSS issue;
  do not use the audit's forced downgrade to Next.js 9.
- Production still needs the external configuration and controller decisions in `TODO.md`.

## Working conventions

- Prefix shell commands with `rtk`.
- Use `apply_patch` for tracked file edits and preserve unrelated user changes.
- Keep Conventional Commit messages GPG-signed when requested; never add AI attribution.
- Before release, follow `docs/deployment.md` and run the proportional test suite.

