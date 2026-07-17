# AAA Artists Website

The production artist-management website for **AAA Artists**.

AAA Artists & Events is one company with two public-facing brands. This site covers the
**artists** side only — bookings, rosters, and artist media. The events side lives on a
separate website, so there are no event/Fusion pages here. The footer still links to the
shared **AAA Events** social accounts until dedicated artist socials exist.

## Tech stack

- **Next.js 16** (App Router, static export)
- **Node.js 24 LTS** for local builds, GitHub Actions, and matching type definitions
- **Tailwind CSS v4** (configured via `postcss.config.mjs`, no `tailwind.config.ts` needed)
- **TypeScript**
- Cloudflare Worker for the same-origin booking API
- No database — editable artist/event content lives in `data/artists/*.yml`

## Running locally

```bash
npm run dev        # starts dev server at http://localhost:3000
npm run build      # production build
npm run check      # validates artist and event YAML
npm test           # Worker security and enquiry tests
npm run test:e2e   # desktop Chromium and mobile WebKit tests
```

## Project structure

```text
app/
  page.tsx               # Home page (hero, about, genres, CTA)
  artists/page.tsx       # Artist grid (/artists)
  artist/[slug]/page.tsx # Individual artist detail (media boxes + upcoming flyers)
  contact/page.tsx       # Booking enquiry form (/contact)
  events/page.tsx        # Deduplicated upcoming event listing (/events)
  privacy/page.tsx       # Privacy notice and complaints route (/privacy)
  about/page.tsx         # About page
  layout.tsx             # Root layout (navbar + footer)
  globals.css            # Tailwind import + CSS theme variables
components/
  Navbar.tsx             # Fixed top navigation — Home, Artists, About, Book Now
  Footer.tsx             # Site footer (links to AAA Events socials)
  Breadcrumbs.tsx        # Visible navigation trail + matching JSON-LD
  ThirdPartyConsent.tsx  # Shared click-to-load privacy facade for external media
config/
  booking.js             # Shared enquiry limits, enums, and validation constants
  navigation.ts          # Shared header/footer navigation definitions
  privacy.js             # Verified controller facts and privacy release gate
  site.js                # Canonical origin, public identity, and contact addresses
data/
  artists/               # ONE friendly YAML file per artist — EDIT THESE
  artists.ts             # types + getArtistBySlug (imports the generated JSON; don't edit content)
  artists.data.json      # generated from data/artists/*.yml (git-ignored, do not edit)
scripts/
  gen-artists.mjs        # builds artists.data.json from the YAML + validates it
worker/
  index.js               # /api/enquiries, validation, Turnstile, limits, redirects
public/
  logo.png               # AAA Artists logo
  artists/               # Artist photos go here — <slug>.jpg
  flyers/                # Optional event flyer artwork referenced by gig.flyer
```

## Design system

| Token          | Value                  |
| -------------- | ---------------------- |
| Background     | `#0a0a0a`              |
| Surface        | `#141414` / `#1e1e1e`  |
| Border         | `#2a2a2a`              |
| Accent         | `white` / `#ffffff`    |
| Text muted     | `white/30` – `white/60`|
| CTA buttons    | `bg-white text-black`  |

## Adding / updating an artist

Artist content lives in **one YAML file per artist** in `data/artists/` (e.g.
`01-xijaro-pitch.yml`). YAML is forgiving — no braces, no quotes everywhere, and you
can leave `# comments`. The number prefix sets the display order on `/artists`.

```yaml
name: Xijaro & Pitch          # Display name
# disabled: true              # optional — hides the artist site-wide (no page built)
slug: xijaro-pitch            # URL slug → /artist/xijaro-pitch
genre: Trance / Progressive   # Shown muted above the name
tagline: Melodic trance, built for big rooms   # Short line under the name
bio: >-                       # Full paragraph bio (folded block — write freely)
  Xijaro & Pitch are a trance duo known for big, melodic productions…
image: /artists/xijaro-pitch.webp   # Path under /public
socials:                      # all optional
  instagram: https://…
  soundcloud: https://…       # if set, a SoundCloud player appears on the artist page
  facebook: https://…
  spotify: https://…          # shown as a link "box" on the artist page
  youtube: https://…          # shown as a link "box" on the artist page
  beatport: https://…
# spotifyEmbed: https://…     # optional — a Spotify URL renders a live player box
# youtubeEmbed: https://…     # optional — a YouTube URL renders a live player box
gigs:                         # ONE list, oldest → newest; the date decides past vs upcoming
  - date: "2025-10-18"        # past date → shown dimmed in the history list
    venue: Privilege
    city: Ibiza
    country: Spain
  - date: "2026-07-04"        # future date → shown as a flyer card
    eventId: asot-festival-2026   # required while the date is today or later
    venue: A State of Trance Festival
    city: Utrecht
    country: Netherlands
    ticketLink: https://…     # optional — links to organiser details
    ticketStatus: available   # optional; only when availability is verified
    flyer: /flyers/asot.webp  # optional — real poster art (omit → auto-generated poster)
```

**Workflow:** edit a YAML file → `npm run dev` (or `npm run build`) automatically
regenerates `data/artists.data.json` that the site reads. Run **`npm run check`** any
time to validate the files — it lists exactly which file/field is wrong before anything
breaks. Quote dates as `"YYYY-MM-DD"`, or `"YYYY-MM"` when the exact day is TBC. Every
future-dated gig needs a stable `eventId`; reuse it across artists on the same event
(once the date passes the ID may stay — it is ignored). Gigs live in ONE `gigs:` list per
artist, ordered oldest to newest; the date decides whether an entry shows as upcoming or
past, so finished gigs need no editing. To add a new artist, copy an existing file with
the next number prefix.

### Media boxes ("Listen & Watch")

The artist page shows a grid of media boxes. SoundCloud renders a live embed from
`socials.soundcloud`. Spotify and YouTube render a live player when `spotifyEmbed` /
`youtubeEmbed` are set; otherwise they fall back to a clickable link card built from
`socials.spotify` / `socials.youtube`.

### Upcoming events (flyer boxes)

Each future-dated entry in `gigs` renders as a flyer card. Set `flyer: "/flyers/<file>.jpg"`
to show real artwork; if omitted, a clean text poster is generated from the gig details.
Add `ticketLink` to show event details. Add `ticketStatus: available` only after availability is verified.

## Adding artist photos

Drop a JPEG into `public/artists/` using the artist's slug as the filename:

```text
public/artists/xijaro-pitch.jpg
public/artists/c-systems.jpg
public/artists/krevix.jpg
public/artists/frogr.jpg
public/artists/sago.jpg
public/artists/thiago.jpg
public/artists/mr-b.jpg
```

Then update the `image` field in the artist's YAML file to point to it.
The artist page and roster cards will automatically show the photo.

## Booking form

The booking enquiry form lives in `app/contact/ContactView.tsx`. It supports multiple
artists, per-artist exact times or durations, country-aware phone/city inputs, email-domain
assistance, optional WhatsApp numbers/usernames, reset confirmation, and mobile layouts.

The browser submits only to the same-origin `POST /api/enquiries`. The Cloudflare Worker
streams and validates the body, verifies Turnstile, applies actor and email rate limits,
and then forwards the accepted enquiry to Formspree. The Formspree ID and Turnstile secret
are server-side secrets; they must never use a `NEXT_PUBLIC_` name. The public Turnstile
site key is a build variable because Next.js embeds it in the static export.

Production fails closed and shows a direct-email fallback when Turnstile is not configured.
See `docs/deployment.md` for the exact variables, secrets, and smoke tests.

## Events and structured data

Every future-dated gig requires a stable `eventId`. Reuse the same ID for every artist on a
shared event so `/events` can merge the performers into one listing. Dates accept exact
`YYYY-MM-DD` values or month-only `YYYY-MM` values when the day is TBC. Month-only events
stay visible but do not produce exact-date `MusicEvent` schema. A ticket URL does not imply
availability; add `ticketStatus: available` only when it has been verified.

Structured event data is emitted once on `/events`, not duplicated across artist pages.
Nested artist pages use visible breadcrumbs with matching JSON-LD. Spotify, YouTube, and
other third-party frames remain click-to-load so they make no provider request beforehand.

## Privacy release gate

Verified controller, address, Companies House, ICO, retention, and complaints information
lives in `config/privacy.js`. Keep `detailsConfirmed: false` until the remaining decisions
listed in `TODO.md` are confirmed by the controller and the finished notice has been
reviewed. While incomplete, the privacy page stays readable but uses `noindex` and remains
out of the sitemap. Never fill missing legal facts with plausible placeholders.

## Logo

The logo (`public/logo.png` — the AAA Artists mark) is displayed via `<Image>` in
`Navbar.tsx`, `Footer.tsx`, `app/page.tsx`, and `app/artists/page.tsx`. A CSS `--logo-filter`
inverts it automatically in dark mode. To swap the logo, replace the file or update those
`<Image>` components.

## Git commits

Do not add a `Co-Authored-By: Claude ...` trailer or any AI/assistant attribution to
commit messages. Keep commit messages to the change description only.

## Deploying

Production is a Next.js static export plus a Cloudflare Worker and static-asset binding.
The canonical origin is always `https://aaaartists.co`; `www` and HTTP requests are
permanently redirected by the Worker. Deploy both the Worker and `out/` assets—publishing
only the static directory leaves `/api/enquiries` unavailable.

Use `npm run build:production`, `npm run deploy:dry-run`, `npm run deploy`, and then
`npm run smoke:production`. Current external configuration tasks are tracked in `TODO.md`;
the authoritative setup and release instructions are in `docs/deployment.md`.

There are three environments. Dev is local (`npm run dev`). Staging is the
`aaa-artists-staging` Worker on `https://aaa-artists-staging.thiagogenez.workers.dev`,
deployed automatically on every push to protected `main` after the reusable checks suite
(`checks / verify` and `checks / browser`) passes; it serves every page with
`X-Robots-Tag: noindex` and uses the Turnstile test key pair. Production is the
`aaa-artists` Worker on `https://aaaartists.co`, released only by manually dispatching the
**Deploy production** workflow on `main`. Both targets live in `wrangler.jsonc` under
`env.staging` and `env.production`; every Wrangler command needs `--env`.

GitHub Actions is the sole deployment authority, guarded by the repository variable
`DEPLOYMENT_AUTHORITY=github`; Cloudflare's automatic Git deployment must stay disabled.
The daily event refresh updates staging unconditionally and rebuilds production only when
`main` is the exact commit already live in production, so new code never reaches
production through the schedule.

The production workflow is transactional: it re-runs checks, verifies configuration and
domains, uploads an inactive commit-tagged candidate, smoke-tests that exact candidate on
its version-prefixed preview URL, and only then promotes it to 100% traffic as the final
action. The canonical domains are smoke-tested locally (`npm run smoke:production`), not
from the workflow — Cloudflare's zone bot protection 403s GitHub-runner IPs. Do not replace this with an early `wrangler deploy` or add
routine automatic rollback. Deployment logic lives in versioned `scripts/*.mjs` files, not
inline workflow shell. Cloudflare custom-domain/route mutations remain a separate
infrastructure operation.

The repository targets Node.js 24 LTS through `.node-version`, `package.json` engines,
GitHub Actions, and `@types/node`. Keep those declarations aligned during future LTS
upgrades. Cloudflare's deployed Worker uses the Workers runtime rather than a full Node.js
process; the Node version controls dependency installation, generation, tests, and builds.

## Current implementation state (2026-07-17)

- The transactional GitHub Actions deployment path is live and verified end to end.
  PR #12 (merged at `815b46d`) introduced the workflow; PR #13 (merged at `49f0ef8`)
  fixed inactive-candidate preview discovery.
- Root cause of the earlier failed run `29446902618`: Version Preview URLs were never
  enabled on the `aaa-artists` Worker, so `wrangler versions upload` returned no
  `preview_url`. `wrangler.jsonc` now sets `preview_urls: true` with `workers_dev: false`,
  the workflow only accepts a version-prefixed preview URL, and the one-time enablement
  was applied with `npx wrangler triggers deploy` on 2026-07-15.
- Run `29450382754` completed the full transaction: uploaded candidate
  `5a9cc6d4-0ee9-4e0d-8f14-44261c7683ba` (tag `github-49f0ef883098`), smoke-tested it on
  its version-prefixed preview URL, promoted it to 100%, and `npm run smoke:production`
  then passed against the canonical domains.
- The pipeline was then redesigned into dev/staging/production (2026-07-16): pushes to
  `main` deploy staging only; production releases require a manual "Deploy production"
  dispatch. All staging infrastructure is provisioned (Worker, secrets, GitHub `staging`
  environment, `checks / verify` + `checks / browser` required branch checks). The first
  fully green dispatch (run `29492075743`) released `github-f40c1fd`. Cloudflare Bot Fight
  Mode challenges GitHub-runner IPs on the canonical domains (confirmed in Security
  Events), which is why the workflow never smoke-tests aaaartists.co directly.
- Shipped 2026-07-16/17 through the gated flow: Turnstile remount fix (PR #18), booking
  form sessionStorage draft persistence with permanent e2e coverage (PR #19), unified
  date-driven `gigs:` schema (PR #20), e2e submit-flake guard — 15s window + one visible
  CI retry (PR #21), and the Turnstile widget following the site theme via `useTheme()`
  (PR #22). Production runs `github-366d17e8d372`; the daily refresh cron fires at
  01:11 UTC ("AAA o'clock").

- Contact security, same-origin delivery, Turnstile recovery, streaming size limits,
  privacy-safe request IDs, retry semantics, and canonical redirects are implemented.
- Events are normalized and deduplicated, TBC month dates are supported, and structured
  data no longer makes unverified availability or exact-date claims.
- Navigation definitions and third-party consent UI are shared; the footer is compact and
  aligned with the header across phone and desktop widths.
- Privacy controller/address/ICO/retention/complaints facts are recorded, but the notice
  deliberately remains incomplete pending the decisions in `TODO.md`.
- CI, Dependabot, production checks, daily event-refresh workflow, Worker tests, and
  desktop/mobile browser coverage are present. The last verification passed 9 Worker tests
  and 24 browser tests; lint had no errors and one pre-existing `ThemeProvider` warning.
- The accepted dependency audit finding is the moderate nested PostCSS advisory. Do not run
  the suggested forced downgrade to Next.js 9; monitor for a patched stable Next.js release.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->
