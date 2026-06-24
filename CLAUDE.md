# AAA Artists Website

The artist-management website for **AAA Artists**, built as a Next.js prototype.

AAA Artists & Events is one company with two public-facing brands. This site covers the
**artists** side only — bookings, rosters, and artist media. The events side lives on a
separate website, so there are no event/Fusion pages here. The footer still links to the
shared **AAA Events** social accounts until dedicated artist socials exist.

## Tech stack

- **Next.js 16** (App Router, static export)
- **Tailwind CSS v4** (configured via `postcss.config.mjs`, no `tailwind.config.ts` needed)
- **TypeScript**
- No database — all artist data lives in `data/artists.ts`

## Running locally

```bash
npm run dev        # starts dev server at http://localhost:3000
npm run build      # production build
```

## Project structure

```text
app/
  page.tsx               # Home page (hero, about, genres, CTA)
  artists/page.tsx       # Artist grid (/artists)
  artist/[slug]/page.tsx # Individual artist detail (media boxes + upcoming flyers)
  contact/page.tsx       # Booking enquiry form (/contact)
  about/page.tsx         # About page
  layout.tsx             # Root layout (navbar + footer)
  globals.css            # Tailwind import + CSS theme variables
components/
  Navbar.tsx             # Fixed top navigation — Home, Artists, About, Book Now
  Footer.tsx             # Site footer (links to AAA Events socials)
data/
  artists/               # ONE friendly YAML file per artist — EDIT THESE
  artists.ts             # types + getArtistBySlug (imports the generated JSON; don't edit content)
  artists.data.json      # generated from data/artists/*.yml (git-ignored, do not edit)
scripts/
  gen-artists.mjs        # builds artists.data.json from the YAML + validates it
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
pastGigs:                     # dates in the past — shown dimmed
  - date: "2025-10-18"
    venue: Privilege
    city: Ibiza
    country: Spain
upcomingGigs:                 # future dates — shown as flyer cards
  - date: "2026-07-04"
    venue: A State of Trance Festival
    city: Utrecht
    country: Netherlands
    ticketLink: https://…     # optional — shows a "Get Tickets" button (omit → "Tickets soon")
    flyer: /flyers/asot.webp  # optional — real poster art (omit → auto-generated poster)
```

**Workflow:** edit a YAML file → `npm run dev` (or `npm run build`) automatically
regenerates `data/artists.data.json` that the site reads. Run **`npm run check`** any
time to validate the files — it lists exactly which file/field is wrong before anything
breaks. Quote dates as `"YYYY-MM-DD"`. To add a new artist, copy an existing file with
the next number prefix.

### Media boxes ("Listen & Watch")

The artist page shows a grid of media boxes. SoundCloud renders a live embed from
`socials.soundcloud`. Spotify and YouTube render a live player when `spotifyEmbed` /
`youtubeEmbed` are set; otherwise they fall back to a clickable link card built from
`socials.spotify` / `socials.youtube`.

### Upcoming events (flyer boxes)

Each entry in `upcomingGigs` renders as a flyer card. Set `flyer: "/flyers/<file>.jpg"`
to show real artwork; if omitted, a clean text poster is generated from the gig details.
Add `ticketLink` to show a "Get Tickets" button.

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

Then update the `image` field in `data/artists.ts` to point to it (already pre-set).
The artist page and roster cards will automatically show the photo.

## Booking form

The booking enquiry form lives in `app/contact/page.tsx` and is grouped into sections
(your details, the booking, venue & audience, budget & extras, message).

Delivery uses **Formspree** (no backend, works with static export). Set the form ID in
`NEXT_PUBLIC_FORMSPREE_ID` (see `.env.local.example`) and enquiries POST straight to your
Formspree inbox/dashboard. If that variable is empty, the form falls back to opening the
visitor's email client via `mailto:booking@aaaevents.com`. To change the fallback email,
search the project for `booking@aaaevents.com`.

> Note: `NEXT_PUBLIC_*` variables are inlined at build time, so changing the form ID
> requires a rebuild (or setting it in the Vercel dashboard, which rebuilds on deploy).

## Logo

The logo (`public/logo.png` — the AAA Artists mark) is displayed via `<Image>` in
`Navbar.tsx`, `Footer.tsx`, `app/page.tsx`, and `app/artists/page.tsx`. A CSS `--logo-filter`
inverts it automatically in dark mode. To swap the logo, replace the file or update those
`<Image>` components.

## Git commits

Do not add a `Co-Authored-By: Claude ...` trailer or any AI/assistant attribution to
commit messages. Keep commit messages to the change description only.

## Deploying

The easiest option is [Vercel](https://vercel.com) — connect the repo and it deploys automatically on every push. Zero config needed for a Next.js project.

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