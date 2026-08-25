# AAA Artists agent contract

This is the shared project instruction file for every coding agent. Codex reads it directly;
Claude imports it through `CLAUDE.md`. If `.context/README.md` exists, it is the ignored local
Obsidian vault for cross-agent handoffs; durable project knowledge remains in versioned docs.

## Issue and pull-request workflow

- Every fix, improvement, or feature starts as a GitHub issue created from
  `.github/ISSUE_TEMPLATE/` and reaches `main` only through a pull request that references it.
  There are no issue-less pull requests or direct pushes to `main`.
- The repository is `thiagogenez/aaa-artists`; the local directory name `webpage` is not the
  GitHub repository name.
- Use one branch per issue, named `<type>/<short-slug>`. Pull-request titles use Conventional
  Commit format because squash merge makes the title the commit on `main`. Never add AI
  attribution trailers.
- Fill in `.github/pull_request_template.md`. A human pull request needs the issue reference,
  `## Change`, `## Verification`, and `## Risks and limitations`; Dependabot uses its documented
  `## Before` and `## After` comparison. [`CONTRIBUTING.md`](CONTRIBUTING.md) is the full writing
  and title guide.
- Write issue, pull-request, and comment bodies to a file and pass `--body-file`. Do not hard-wrap
  prose posted to GitHub: one physical line per paragraph or list item lets GitHub wrap it
  correctly. Repository Markdown remains wrapped at 100 columns.
- GitHub Actions is the deployment authority. A merge to `main` deploys staging after
  `checks / verify` and `checks / browser`; production requires the manual **Deploy production**
  dispatch.
- Commits are signed in the maintainer's terminal. An agent stages the files and hands over exact
  `git commit`, `git push`, and `gh pr create` commands when signing cannot complete in its
  shell. Never bypass signing with `--no-gpg-sign`.
- Findings are part of the work. Fix an in-scope finding and record it in `## Change`; comment on
  the issue when it was outside the original description. Open a separate issue for a finding
  left unfixed. Record limitations in `## Risks and limitations`, and create an issue too when a
  future maintainer could mistake the limitation for a guarantee. A code `TODO` is not a
  substitute.

## Project architecture

- AAA Artists is a Next.js 16 App Router static export deployed with a Cloudflare Worker.
- Node.js 24 LTS is the build and tooling runtime. Keep `.node-version`, `package.json` engines,
  GitHub Actions, and `@types/node` on the same major.
- Keep GitHub Actions pinned to full commit SHAs. Preserve read-only CI permissions, checkout
  credential isolation, bounded timeouts, and the Wrangler dry-run against the export exercised
  by Playwright.
- Deployment has three tiers: local development; the automatically deployed
  `aaa-artists-staging` Worker; and the manually released `aaa-artists` production Worker. Keep
  both deployments behind the reusable checks, protected environments, and
  `DEPLOYMENT_AUTHORITY=github`. Never restore a second automatic deployment path or let the
  scheduled refresh ship code that is not already live in production.
- Editable artist and event content lives in `data/artists/*.yml`; generated JSON is not edited.
- `.site-shell` owns the shared maximum width for full-width sections, navigation, footer, and
  media consent. Sections add their own horizontal padding instead of narrowing that shell.
- The canonical origin is `https://aaaartists.co`. The Worker normalizes HTTP and `www` to the
  HTTPS apex while preserving path and query. Static Assets must continue to run the Worker first
  unless equivalent Cloudflare redirect rules replace host normalization.
- The contact form posts only to same-origin `/api/enquiries`. Do not restore a public
  cross-origin endpoint or direct browser-to-email-provider delivery.
- The Worker validates streamed bodies, verifies Turnstile before email quota, rate-limits by
  hashed actor and normalized email, and sends accepted enquiries through Brevo with an
  idempotency key. The customer is the visible recipient, the booking mailbox is BCC'd, and
  replies return to `bookings@aaaartists.co`.
- Secrets stay server-side. Only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is public and build-time.

## Content, SEO, and privacy invariants

- Gigs use one `gigs:` list per artist, oldest to newest; the date decides past versus upcoming.
  Future-dated gigs require stable `eventId` values, and shared events reuse the same ID.
- `YYYY-MM-DD` is an exact date. `YYYY-MM` means the day is TBC and must not produce exact-date
  `MusicEvent` structured data.
- A ticket URL does not assert availability. Only explicit `ticketStatus` may do so.
- There is no `/events` page. Dates live on artist pages and `/events` permanently redirects to
  `/artists`. Each artist page emits its event JSON-LD and visible breadcrumbs; shared `eventId`
  values become schema identifiers.
- Artist pages are audio-first. Listen supports Spotify and SoundCloud, mounts one player at a
  time, and uses the space left by the flyer track. YouTube URLs remain accepted content but are
  hidden, `youtubeEmbed` is rejected, and Beatport remains a social link. See
  `data/artists/README.md` before changing artist media or content fields.
- Third-party media never loads before consent and uses `referrerPolicy="no-referrer"`.
  `MediaConsentBanner` appears only on artist pages with embeds. `granted` auto-embeds site-wide;
  `denied` or unanswered keeps players disabled behind the shared preference control. The choice
  stays in `localStorage`.
- Keep `config/privacy.js` `detailsConfirmed: false` until every relevant item in `TODO.md` is
  factually confirmed and the final notice is reviewed. Never invent legal information.
- The media-embed banner is the only consent prompt. Do not add a generic cookie banner or extend
  it to analytics or advertising without a controller decision.

## Working conventions

- Read the focused document for the area being changed. Before adding a component, inspect the
  current component inventory and reuse existing ownership boundaries.
- If `.context/README.md` exists, read it for local cross-agent context. Treat it as a handoff,
  not authority: code, tests, GitHub issues, and versioned documentation win when it drifts.
- GitHub issues and pull requests are live work state. Do not add dated implementation snapshots
  or open backlog items to agent startup files.
- Shared context belongs in `AGENTS.md`, `docs/`, or the relevant content guide. Use `.codex/` and
  `.claude/` only for intentionally client-specific project configuration; use `~/.codex/` and
  `~/.claude/` for personal settings, MCPs, permissions, and memory.
- Prefix shell commands with `rtk`.
- Use `apply_patch` for tracked edits and preserve unrelated user changes. Never use
  `git checkout -- .` or `git reset --hard` to undo edits.
- Run checks proportional to the change; `npm run check:local` is the complete local quality and
  tooling suite. Follow `docs/deployment.md` before a release.
