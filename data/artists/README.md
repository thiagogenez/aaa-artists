# Editing artists & gigs

All artist content lives here — **one YAML file per artist** (e.g. `01-xijaro-pitch.yml`).
YAML is forgiving: no braces, no quoting everything, and you can leave `# comments`.
The number prefix (`01-`, `02-`, …) sets the display order on the `/artists` page.

## Workflow

1. Edit a `.yml` file (or copy one to add a new artist — give it the next number).
2. Run **`npm run check`** any time to validate — it tells you exactly which file/field
   is wrong before anything breaks.
3. `npm run dev` / `npm run build` automatically regenerates `data/artists.data.json`
   (which the site reads). If the dev server is already running, run `npm run gen:artists`
   to refresh it.

> Quote dates as `"YYYY-MM-DD"`. Keep indentation with 2 spaces.

## Fields

```yaml
name: Xijaro & Pitch          # Display name
# disabled: true              # optional — hides the artist from the whole site
slug: xijaro-pitch            # URL → /artist/xijaro-pitch
genre: Trance / Progressive   # Shown muted above the name
tagline: Melodic trance, built for big rooms
bio: >-                       # Folded block — just write the paragraph
  Xijaro & Pitch are a trance duo known for big, melodic productions…
image: /artists/xijaro-pitch.webp   # Photo under /public

socials:                      # all optional
  instagram: https://…
  soundcloud: https://…       # a SoundCloud player appears on the artist page
  facebook: https://…
  spotify: https://…          # a live Spotify player appears (light/dark follows the theme)
  youtube: https://…          # shown as a link card
  beatport: https://…
# youtubeEmbed: https://…     # optional — a YouTube URL renders a live video player

gigs:                         # ONE list, oldest → newest; the date decides
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

## Tips

- **Hiding an artist:** add `disabled: true` near the top of their file and the artist
  disappears from the roster, home page, contact dropdown, and their `/artist/<slug>`
  page stops being built. Remove the line (or set it to `false`) to bring them back —
  nothing else in the file is touched. The build output lists who is disabled.
- **Spotify URL:** in the app, open the artist → Share → Copy link to artist, and paste
  the whole URL (the `?si=…` part is fine — the site extracts the ID).
- **Photos:** drop a `.webp`/`.jpg` in `public/artists/` and point `image:` at it.
- **Flyers:** drop artwork in `public/flyers/` and set `flyer:` on the gig.
- **Dates:** use `YYYY-MM-DD`, or `YYYY-MM` when the exact day is TBC. Month-only dates are not emitted as exact-date event structured data.
- **Shared events:** every future-dated gig needs a stable `eventId`; use the same ID for every artist appearing at that event. Once the date passes the ID may stay — it is simply ignored.
- **Tickets:** omit `ticketStatus` unless availability has been checked. Allowed values are `available`, `sold-out`, and `unavailable`.
- A finished gig moves from "Upcoming" to the past-dates list automatically once its
  date passes — no edit needed. Just keep the list ordered oldest → newest when adding.
