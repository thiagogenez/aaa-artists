# AAA Artists Website

The production artist-management website for **AAA Artists**.

AAA Artists & Events is one company with two public-facing brands. This site covers the
**artists** side only — bookings, rosters, and artist media. The events side lives on a
separate website, so there are no event/Fusion pages here. The footer still links to the
shared **AAA Events** social accounts until dedicated artist socials exist.

## Issue and PR workflow (mandatory for every agent and every human)

**Every unit of work starts as a GitHub issue and reaches `main` only through a pull request
that references it.** This applies to any agent on any model, and to hand edits. There are no
exceptions for "small" changes.

Repository: **`thiagogenez/aaa-artists`** (the local checkout directory is `webpage`, so
`--repo thiagogenez/webpage` will 404).

1. **Open an issue first**, using one of the three templates in `.github/ISSUE_TEMPLATE/`:
   - `fix:` — Correção. Something is broken or wrong.
   - `improve:` — Melhoria. Something works but should be better.
   - `feat:` — Nova função. Something does not exist yet.

   ```bash
   gh issue create --repo thiagogenez/aaa-artists \
     --title "improve: <short imperative summary>" --body-file <path>.md
   ```

   Write the body to a file. Never pass a long inline `--body` string.

   **Do not hard-wrap issue or pull request text.** Files in this repository wrap at 100
   columns; text that lives on GitHub must not. GitHub renders a single newline inside an issue,
   pull request or comment body as a real line break, so wrapped prose arrives as a ragged
   staircase. Write each paragraph and each list item as one long line and let the browser wrap
   it. The 100-column rule applies to `.md` files in the repo, not to anything posted through
   `gh`.

2. **One branch per issue**, named `<type>/<short-slug>` (`fix/`, `improve/`, `feat/`, `docs/`,
   `chore/`). Branch from an up-to-date `main`.

3. **Conventional Commits** for every commit message: `type(scope): summary`. Allowed types are
   `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`, `build`, `style`, `revert`.
   `commitlint` enforces this on the PR title and on every commit in CI. Never add AI or
   assistant attribution trailers.

4. **Open a PR that references the issue.** `.github/pull_request_template.md` is filled in, not
   deleted. **Every pull request must contain all five of these**, and
   `.github/workflows/commit-style.yml` fails the PR when one is missing or left empty:

   | Required | Section | What it must say |
   | --- | --- | --- |
   | The related issue | `Closes #N` / `Refs #N` | `Closes` when the PR finishes the issue, `Refs` for one step of it |
   | What changed | `## Change` | What this PR actually does, including anything deliberately left out |
   | How it was validated | `## Verification` | What was **actually run** and the result — not what should pass in theory. Hand checks count, and "not tested on a real phone" is a valid, useful entry |
   | Risks and limitations | `## Risks and limitations` | What could break, what no test covers, what only fails in production (Cloudflare, Brevo, Turnstile, real devices), and how to undo it. "None known" only when true |
   | Next steps | `## Next steps` | Follow-up work left out, each as an issue number where one exists; "none" if the issue is fully closed |

   `## Problem` and `## Root cause` stay too — `Root cause` may be deleted for a pure feature.

   ```bash
   gh pr create --repo thiagogenez/aaa-artists --base main --body-file <path>.md
   ```

   Write the body to a file. Never pass a long inline `--body` string.

5. **Deploys are managed through PRs.** Merging to `main` deploys **staging** automatically once
   `checks / verify` and `checks / browser` pass. Production is released only by manually
   dispatching **Deploy production**, and the issue stays open until that release is done when
   the change needs one.

6. **Close the loop.** The merged PR closes the issue. For anything *else* the work turns up —
   and it always turns up something — apply this rule, which is not a judgement call:

   | The finding was… | Where it goes |
   | --- | --- |
   | Fixed inside this change | `## Change`, plus a comment on the issue if it was not in the original scope |
   | Found but **not** fixed | **Its own issue**, before the PR is opened |
   | A limitation of what was built | `## Risks and limitations`, *and* an issue if someone could later mistake it for a guarantee |

   Never leave a finding in prose only — not in a PR description, not in a chat message, not in
   a `docs/` note. If it is not fixed and it is not an issue, it does not exist. A `TODO`
   comment in the code is not a substitute for either.

Agent-specific note: commits in this repository are **signed**, and signing only works in
Thiago's own terminal. An agent stages the files and hands over the exact
`git commit` / `git push` / `gh pr create` commands, grouped by logical block. Never bypass
signing with `--no-gpg-sign`, and never use `git checkout -- .` or `git reset --hard` to undo a
tool's edits — it silently discards unrelated work in the same tree.

## Code quality

Run `npm run check:quality` after changing source, configuration or dependencies. It checks
formatting, ESLint and Biome rules, dead code and the architecture contract; the same commands
gate every pull request in `checks / verify`. Run `npm run format` to apply the repository's
Biome format before committing.

`arch-contract.yaml` defines the allowed dependency graph. Because arch-contract analyses
TypeScript only, matching ESLint rules enforce the Worker `.js` and tooling `.mjs` boundaries.
Keep the contract, ESLint rules and `docs/code-quality.md` aligned when a boundary changes.
Stryker mutation testing is available through `npm run test:mutation`, but is intentionally
on-demand rather than a required pull-request gate.

See `docs/code-quality.md` for the ownership and limitations of every tool.

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
  privacy/page.tsx       # Privacy notice and complaints route (/privacy)
  about/page.tsx         # About page
  layout.tsx             # Root layout (navbar + footer)
  globals.css            # Tailwind import + CSS theme variables
components/
  Navbar.tsx             # Fixed top navigation — Home, Artists, About, Book Now
  Footer.tsx             # Site footer (links to AAA Events socials)
  Breadcrumbs.tsx        # Visible navigation trail + matching JSON-LD
  ThirdPartyConsent.tsx  # Per-embed gate: auto-loads once consent is granted
  MediaConsentBanner.tsx # One-time accept/decline prompt for third-party players
  useMediaConsent.ts     # Reads the stored choice (lib/media-consent.ts)
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

Full-width page sections, navigation, footer, and the media-consent banner share
`.site-shell`, capped at 1440px. Keep their desktop edges aligned; individual sections
provide their own `px-6` padding rather than narrowing the shared shell.

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
  youtube: https://…          # accepted but NOT displayed — see "Media boxes" below
  beatport: https://…
# spotifyEmbed: https://…     # optional — a Spotify URL renders a live player box
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

### Media boxes ("Listen")

The artist page shows a grid of media boxes, and it is **audio-only**. SoundCloud renders a
live embed from `socials.soundcloud`; Spotify renders a live player from `spotifyEmbed` or
`socials.spotify`, falling back to a clickable link card. Both boxes are 450px tall — that
height is what decides how many tracks are visible, and SoundCloud uses `visual=false` (the
list player) because `visual=true` spends most of its height on artwork and fits only ~3
rows.

Upcoming dates and "Listen" share **one row** at `lg`: the flyer track is sized in whole
cards (`flyerSlots = min(upcomingCount, 2)`, 340px each) and the player column takes
`minmax(0,1fr)` of whatever is left. So a sparse artist gets a wide player rather than a
half-empty row — one date leaves a ~900px player, two leave ~550px. The player is
`h-full` inside a stretched grid item, so **the flyer card defines the row height and the
player matches it**; there are no hard-coded player heights to keep in sync, and a taller
row simply shows more SoundCloud tracks. Below `xl` the row stacks: dates, media, past
shows. At `xl`, a clean 64px gutter separates dates and media; their own card/frame borders
provide enough structure, so do not add a divider between the sections.

Only **one player is mounted at a time** (`MediaColumn`). Two stacked players made the
media column twice the height of the dates beside it. The bar names the active provider,
shows "1 of 2", and provides one named switch to the other provider. Spotify is always
first when both exist; SoundCloud follows. Five of the seven artists have SoundCloud only
and get no controls at all.

Earlier attempts, for context: an equal side-by-side grid stranded a dead half-column, and
centring a lone player left the "Listen" heading hanging out to the left of its own
content. Both were fixed by sizing the flyer track and letting the player absorb the
remainder — do not go back to a fixed 50/50 or 8/4 split.

**Two players is the deliberate limit** — SoundCloud and Spotify. `socials.beatport` is a
link icon only; there is no Beatport player, and adding one was tried and rejected
(2026-08-02). If it comes up again, the constraints are:

- Beatport has no artist-level embed. `type=artist` and `type=label` both return "that item
  can't be displayed"; only `type=track` and `type=chart` render.
- Its artist pages return **403** to curl *and* to a real headless browser (Cloudflare bot
  protection). A scraper would pass locally and fail in CI, exactly as Cloudflare already
  blocks GitHub runners on our own domain.
- The v4 API does expose `/catalog/artists/<id>/tracks/`, but returns **401** without
  partner OAuth credentials. Do not work around that with borrowed client keys.

That leaves hand-copied track IDs, which freeze into a stale "top 10" and cost a third-party
frame each. Not worth it for a third player.

YouTube is not shown anywhere on the artist page: no player, no link card, and no icon in
the social strip. `socials.youtube` is still accepted in YAML (nothing is lost) but is
filtered out by `HIDDEN_SOCIAL_PLATFORMS` in `app/artist/[slug]/page.tsx` — delete the entry
there to bring it back. `youtubeEmbed` is rejected by `npm run check` so it cannot be set in
the belief that it renders. The footer still links to the AAA Events YouTube account, which
is the company's channel and separate from artist media.

### Upcoming events (flyer boxes)

Each future-dated entry in `gigs` renders as a flyer card. Set `flyer: "/flyers/<file>.jpg"`
to show real artwork; if omitted, a clean text poster is generated from the gig details.
Add `ticketLink` to show event details. Add `ticketStatus: available` only after availability is verified.
From iPad portrait upward, longer lists show adjacent flyers at both edges of middle pages
and have edge-mounted previous/next controls, a range counter, and page-position dots.
Compact read-only progress marks live in the range row so they do not add height below the
flyer cards. The player uses the same active-bar/inactive-dot language beside its named
switch. Below `md`, all flyer cards remain in the normal page flow. The player matches the
flyer-card viewport at `xl` and mounts only the active iframe. `Past shows` is a compact
outlined button at the end of the Upcoming Events heading row.

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
and then sends an idempotent Brevo email to the customer with a BCC copy to
`bookings@aaaartists.co`. Brevo is EU-hosted, chosen so booking-email content stays in the
EU/EEA. The customer and booking inbox receive the same original message;
replies go to the booking address. The Brevo API key and Turnstile secret are server-side
secrets and must never use a `NEXT_PUBLIC_` name. The public Turnstile site key is a build
variable because Next.js embeds it in the static export.

Production fails closed and shows a direct-email fallback when Turnstile is not configured.
See `docs/deployment.md` for the exact variables, secrets, and smoke tests.

## Events and structured data

There is no site-wide events page. Dates are shown on each artist's page (`Upcoming Events`
and `Past Dates` in `app/artist/[slug]/EventsSection.tsx`), and the Worker permanently
redirects the retired `/events` URL to `/artists`.

Every future-dated gig requires a stable `eventId`. Reuse the same ID for every artist on a
shared event: each performer's page emits its own `MusicEvent`, and the shared ID travels as
the schema `identifier` so consumers can tell it is one real event. Dates accept exact
`YYYY-MM-DD` values or month-only `YYYY-MM` values when the day is TBC. Month-only events
stay visible but do not produce exact-date `MusicEvent` schema. A ticket URL does not imply
availability; add `ticketStatus: available` only when it has been verified.

Each flyer card carries `id="event-<eventId>"`, which is the fragment its JSON-LD `@id` and
`url` point at — keep the two in sync. Nested artist pages use visible breadcrumbs with
matching JSON-LD. Spotify, YouTube, and SoundCloud frames make no provider request until the
visitor has consented — see below.

## Media consent

Embedding a third-party player hands the visitor's IP to that provider and may set storage
on their device, which under UK GDPR/PECR needs consent first. `MediaConsentBanner` appears
only on artist pages with an embeddable player and stores the answer in `localStorage` under
`aaa-media-consent-v1` (never sent to a server). `granted` embeds players automatically
site-wide; `denied` or unanswered keeps them disabled behind a compact preference control.
There is no per-player click-to-load bypass. The footer and `/privacy` carry controls to
reset or switch the answer, because withdrawing consent must be as easy as giving it.

E2E specs that are not about consent call `seedMediaConsent(page)` from
`tests/e2e/helpers.ts`; it answers "denied", which keeps the banner hidden and stops any
test reaching a real provider.

## Artist events automation

`npm run fetch:events` proposes upcoming gigs from Skiddle and Bandsintown and, in the
workflow, opens a **draft** pull request. It never merges, never deploys, and never rewrites a
gig a human verified — proposals are additive only.

Artists are matched by explicit id in an optional `sources:` block per YAML file
(`skiddle`, `bandsintown`, `ra`), never by name search: the roster has real name collisions,
and a guessed match would attribute a stranger's gig to an artist. No id for a source means
that source is skipped. `gen-artists.mjs` validates the block and strips it from the generated
JSON.

RA.co is a **review link only** — `ra.co/dj/<slug>` returns an outright Cloudflare block to
scripts and headless browsers alike, so it cannot be fetched from CI. Do not add an RA
scraper; it would pass locally and fail in Actions. Ticketmaster is supported by the adapter
pattern but deliberately unused.

`propose-yaml.mjs` edits YAML as text because `js-yaml` cannot round-trip the comments that
carry the verification trail. Never swap it for a load/dump cycle. Every write must leave the
file parseable, the gig order intact, and every existing gig byte-identical.

See `docs/artist-events-automation.md`. The schedule stays off until the API keys exist and
one manual run has been reviewed.

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
- Events live on the artist pages only (the `/events` page was removed 2026-08-02 and now
  301s to `/artists`). TBC month dates are supported, and structured data no longer makes
  unverified availability or exact-date claims.
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
