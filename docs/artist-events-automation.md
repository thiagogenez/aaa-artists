# Artist events automation (design)

Status: **proposed** — this document describes the intended design. No code is built yet.

## Goal

Reduce the manual work of keeping each artist's `gigs:` list current by fetching gig
information from external sources on a schedule, and **proposing** changes as a draft pull
request for human review. The automation never publishes anything on its own: a person
reviews and merges, and merging follows the normal staging-first deploy flow.

This preserves the site's "verified gigs only" principle — a machine suggests, a human
confirms.

## Non-goals

- No automatic merging, no automatic production deploy. The bot only opens **draft PRs**.
- No deletion or overwriting of existing hand-verified gigs. Proposals are **additive**;
  anything that looks like a change to an existing entry is surfaced for a human to judge,
  not applied silently.
- No fabricated data. Every proposed gig cites its source and (where available) a ticket
  link, so it can be verified before merge, consistent with `feedback_site_copy` rules.

## Source reality

The sources differ enormously in how automatable they are. This is the single most
important constraint on the design.

| Source | Automatable | Notes |
| --- | --- | --- |
| **Skiddle** | ✅ Official API | Free API key (application form), JSON event search, UK-focused. Directly exposes "tickets on sale", which is a strong signal that a gig is confirmed. |
| **Bandsintown** | ✅ Official API | Free `app_id`, purpose-built for artist tour dates. Covers whatever the artist maintains on their Bandsintown profile. |
| **Songkick** | ⚠️ Gated | API requires partner approval; not instant or guaranteed free. Treated as optional/later. |
| **RA.co** | ❌ No public API | The site runs on a private GraphQL endpoint; RA's terms prohibit automated collection, it is bot-protected, and scraping is brittle. Used as a **review link**, not an automated source. |
| **Social media** | ❌ Locked down | Instagram/Facebook have no clean gig API. Manual enrichment only. |

**Decision:** automated fetching uses **Skiddle + Bandsintown** (real APIs). RA.co and the
artist's socials are included in the draft PR as **review links** so the human reviewer can
quickly eyeball anything the APIs missed — without a fragile scraper in CI. Songkick can be
added later if partner access is granted.

## Architecture

```
scripts/
  fetch-artist-events.mjs        # orchestrator: per artist, run adapters, merge, diff, write proposals
  sources/
    skiddle.mjs                  # adapter — needs SKIDDLE_API_KEY
    bandsintown.mjs              # adapter — needs BANDSINTOWN_APP_ID
  lib/
    merge-events.mjs             # combine + dedupe adapter output into candidate gigs
    propose-yaml.mjs             # diff candidates vs data/artists/*.yml; produce additive proposals
.github/workflows/
  refresh-artist-events.yml      # scheduled: run orchestrator, open a draft PR if anything changed
docs/
  artist-events-automation.md    # this document
```

### Adapter interface

Each source adapter exports one function with a common shape, so sources are pluggable and
independently testable:

```js
// returns normalized candidate gigs for one artist, or [] if unknown/unconfigured
export async function fetchEvents(artist, env) { /* ... */ }
```

A candidate gig is normalized to the site's existing `gigs:` shape
(`date`, `venue`, `city`, `country`, optional `ticketLink`, `ticketStatus`, `eventId`),
plus internal metadata (`source`, `sourceUrl`, `confidence`) used only for the PR body, not
written to YAML.

Adapters **skip gracefully** when their credential is absent (return `[]`), so a missing key
never breaks the run — it just narrows the sources.

### Merge and dedupe (`merge-events.mjs`)

- Combine candidates from all adapters for an artist.
- Dedupe by `(date, normalized venue)` — the same gig seen on Skiddle and Bandsintown
  collapses to one candidate.
- Prefer the richer/confirmed record when duplicates differ (e.g. a Skiddle entry with
  tickets on sale outranks a bare Bandsintown listing).
- Only future-or-today dates are proposed as upcoming; the existing date-driven schema then
  decides past vs upcoming at build time (see `CLAUDE.md`).

### Diff to YAML (`propose-yaml.mjs`)

- Compare merged candidates against the artist's current `gigs:` list.
- **New** gigs (no matching date+venue in the file) → propose adding.
- **Potential updates** (same gig, new detail such as a ticket link) → surface in the PR
  body as a suggestion, applied only if unambiguous and non-destructive.
- **Never** remove or rewrite an existing verified gig automatically.
- `eventId` for a genuinely new future gig is proposed but flagged for the reviewer to
  confirm/adjust (shared events must reuse one id across artists — a judgement call).
- YAML is edited conservatively to preserve comments and ordering as far as the tooling
  allows; where clean comment-preserving edits are not possible, the proposal is described
  in the PR body for the reviewer to apply.

## GitHub Actions workflow

`refresh-artist-events.yml`, scheduled (proposed: weekly, off the congested cron marks like
the existing refresh):

1. Check out, set up Node 24, `npm ci`.
2. Run `node scripts/fetch-artist-events.mjs` with `SKIDDLE_API_KEY` / `BANDSINTOWN_APP_ID`
   from GitHub Actions secrets.
3. If it produced changes to any `data/artists/*.yml`, create a branch
   `bot/artist-events-<date>` and open a **draft PR** whose body lists, per artist: each
   proposed gig, its source, ticket link, and the RA.co + social review links.
4. If nothing changed, do nothing (no empty PRs).

The draft PR then runs the normal `checks / verify` (`npm run check` validates the artist
YAML) and `checks / browser`. The reviewer edits if needed and merges; merging to `main`
auto-deploys to **staging** only, exactly like every other change. Production stays on the
manual dispatch. No Brevo email is used — the draft PR plus GitHub's own notifications are
the review surface, per the agreed flow.

## Secrets

GitHub Actions secrets (never `NEXT_PUBLIC_`, never committed):

- `SKIDDLE_API_KEY` — free Skiddle API key (application at skiddle.com/api/join.php).
- `BANDSINTOWN_APP_ID` — Bandsintown application id.

Adapters run only when their secret is present, so the workflow degrades gracefully.

## Phasing

- **Phase 1** — framework + Skiddle + Bandsintown adapters + merge/diff + workflow, runnable
  in `--dry-run` (prints proposed diffs, opens no PR) so we can validate against the real
  roster locally before wiring keys or enabling the schedule.
- **Phase 2** — RA.co review links refined; optionally a best-effort RA adapter if a
  low-risk access path proves stable.
- **Phase 3** — Songkick adapter if partner API access is granted; richer social review
  links.

## Open questions

- Cadence: weekly vs twice-weekly. Weekly is proposed to start.
- How aggressively to propose `ticketStatus: available` — only when a source explicitly
  reports tickets on sale, to avoid unverified availability claims (see `CLAUDE.md`).
- Whether one combined draft PR per run (all artists) or one per artist. One combined PR is
  proposed, to keep review in a single place.
