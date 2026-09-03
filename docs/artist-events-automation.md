# Artist events automation

Status: **built (Phase 1)** — runnable locally today. The scheduled workflow stays disabled
until the API keys exist and one manual run has been reviewed.

## Goal

Keep each artist's `gigs:` list current by fetching gig information from external sources on a
schedule and **proposing** the result as a draft pull request. The automation never publishes
anything itself: a person reviews and merges, and merging follows the normal staging-first
deploy flow.

This preserves the site's "verified gigs only" principle — a machine suggests, a human
confirms.

## Non-goals

- No automatic merging and no automatic production deploy. The bot opens **draft PRs** only.
- No deletion or rewriting of hand-verified gigs. Proposals are **additive**; anything that
  looks like a change to an existing entry is reported for a human to judge, never applied.
- No fabricated data. Every proposal cites its source, so it can be checked before merge.

## Source reality

Verified by probing each source, not assumed:

| Source | Automatable | Notes |
| --- | --- | --- |
| **Skiddle** | ✅ Official API | Free key. Ticket-led, so an event on sale there is a confirmed booking — the one source that can legitimately propose `ticketStatus`. Where the roster's tickets actually live. |
| **Bandsintown** | ✅ Official API | Free `app_id`. Artist tour dates, but only what the artist maintains on their own profile. Not every roster artist has one. |
| **RA.co** | ❌ Hard blocked | `ra.co/dj/<slug>/tour-dates` returns **403 "Sorry, you have been blocked"** to curl *and* to real headless Chromium. Its `/graphql` endpoint responds, but it is private, undocumented, sits behind the surface `robots.txt` marks off, and would be queried from GitHub datacenter IPs — the class Cloudflare already blocks against our own domain. **Review link only.** |
| **Ticketmaster** | ✅ Available, not used | Free Discovery API key, 5k calls/day; would add festival coverage. Deliberately skipped: the roster's ticketing is Skiddle and RA, so a third key earns nothing today. Adding it is one file in `scripts/sources/` plus an entry in `ADAPTERS` and `SOURCE_FIELDS`. |
| **Songkick** | ⚠️ Gated | Partner approval required. Optional, later. |
| **Social media** | ❌ Locked down | No clean gig API. Manual enrichment only. |

## Per-artist source ids

Artists are matched by **explicit id**, never by name search. The roster has real name
collisions — `soundcloud.com/krevix` is a different act (noted in that artist's own file), and
C-Systems is `csystems` on Beatport. A name search would quietly attribute strangers' gigs to
the roster, which is exactly the fabricated-data failure the site's rules exist to prevent.

```yaml
# data/artists/<artist>.yml — all keys optional
sources:
  skiddle: 1234567       # Skiddle artist id
  bandsintown: Krevix    # Bandsintown artist name/slug
  ra: krevix             # slug for the review link only; never fetched
```

An artist with no id for a source is **skipped for that source**. `scripts/gen-artists.mjs`
validates the block and strips it from `data/artists.data.json`, so none of it ships to the
browser.

## Architecture

```text
scripts/
  fetch-artist-events.mjs      # orchestrator; dry run unless --write
  sources/
    skiddle.mjs                # SKIDDLE_API_KEY
    bandsintown.mjs            # BANDSINTOWN_APP_ID
  lib/
    source-http.mjs            # bounded fetch; failures never end the run
    merge-events.mjs           # normalize, dedupe, diff against existing gigs
    propose-yaml.mjs           # ordered, comment-preserving insertion
tests/events/                  # fixtures only, no network
.github/workflows/
  fetch-artist-events.yml
```

Adapter contract: `fetchEvents(artist, env)` returns normalized candidates, or `[]` when its
credential or the artist's id is absent. A missing key narrows a run; it never fails one.

### Merge and dedupe

- Keyed on date + normalized venue, so "XOYO" and "Xoyo, London" collapse to one gig.
- The richer record wins; a ticket link beats a bare listing.
- `ticketStatus` only when a source explicitly reports sale status. Free entry becomes
  `freeEntry: true` — never both, because `npm run check` rejects a gig carrying both.
- Future-or-today only; month-only `YYYY-MM` dates stay upcoming for their whole month.
- `eventId` is generated as `<venue>-<date>` and **flagged for the reviewer**: artists sharing
  a line-up must reuse one id, which the script cannot know.
- Flyer artwork is **linked in the PR body, never downloaded** — promoter artwork is
  copyrighted, and committing it is a human's licensing decision.

### Writing YAML

`js-yaml` cannot round-trip comments, and the artist files are full of them — they are the
human verification trail. So `propose-yaml.mjs` parses only to decide *where* a gig belongs in
the oldest-to-newest order, then splices the block in as text and leaves every other byte
alone. Never replace this with a load/dump cycle.

Every write is checked before it is kept: the file still parses, the gig count grew by exactly
the number applied, every pre-existing gig is unchanged, and the order still holds. A
malformed candidate is dropped rather than written, and a file whose gigs are *already* out of
order is refused rather than edited.

## Workflow

`.github/workflows/fetch-artist-events.yml` — Mon/Wed/Fri at 02:37 UTC, plus
`workflow_dispatch`. Clear of the 01:11 date-rollover rebuild, which is a *rebuild* and
unrelated to this fetch.

1. Run the orchestrator with `--write --pr-body proposal.md`.
2. If nothing changed, stop — no empty pull requests.
3. Otherwise run `npm run check`, then open a **draft** PR on `bot/artist-events-<date>`.
4. If opening the draft PR fails after its branch is pushed, remove that remote branch so a
   failed run cannot leave an orphaned proposal behind.

This is the only workflow with write access (`contents: write`, `pull-requests: write`),
scoped to pushing a branch and opening a PR. It never deploys, so `DEPLOYMENT_AUTHORITY=github`
is unaffected: the draft PR runs the normal `checks / verify` and `checks / browser`, merging
deploys **staging** only, and production still requires the manual dispatch.

## Secrets

GitHub Actions secrets, never `NEXT_PUBLIC_`:

- `SKIDDLE_API_KEY` — apply at `skiddle.com/api/join.php`
- `BANDSINTOWN_APP_ID` — Bandsintown developer portal

## Running it

```bash
npm run fetch:events             # dry run — prints proposals, writes nothing
npm run fetch:events -- --write  # edits data/artists/*.yml locally
npm test                         # Worker + event-automation unit tests
```

With no keys set the dry run queries nothing and exits 0 — that is the safe first run.

## Live-run findings (2026-08-02)

The Skiddle adapter **has** been exercised against a live key. It worked, and the first real
run immediately exposed two false positives that fixture tests had not:

1. **Qualified venue names.** Skiddle returns "The Globe Newcastle" where the site says "The
   Globe", and "The Egg   London" for "Egg London" — so both were reported as brand-new gigs
   that already existed. Fixed by `sameVenue()`: one name's words being a subset of the
   other's counts as a match, and the date must be identical too.
2. **Month-only "TBC" dates.** C-Systems' Timescape gig is recorded as `2026-08` with the
   exact day TBC; Skiddle knows it is `2026-08-07` but names the site ("Abbots Ripton
   Cambridgeshire") rather than the festival. That was proposed as a duplicate. Now reported
   as a **date confirmation** — offered to the reviewer, never merged or added.

Skiddle also reports the UK as `GB`, which would have introduced a second spelling into the
YAML; `normalizeCountry()` maps the unambiguous aliases onto the site's own.

Both are regression-tested. The lesson generalises: fixtures prove the logic, only a live run
proves the assumptions about a source's data.

## Before enabling the schedule

- The **Bandsintown adapter has still not been run against a live key** — its field mapping is
  from documentation only, and may need the same kind of correction.
- Skiddle issued the key with a condition: *"for any commercial use of this API, please
  contact us on dev@skiddle.com … for approval before use."* Get that approval before the
  schedule runs.
- Trigger the workflow manually once and read the draft PR before letting the cron run.

## Later

- Ticketmaster adapter if festival coverage is wanted.
- Songkick if partner access is granted.
- An RA path would have to be local-only, never CI, and remains inadvisable.
