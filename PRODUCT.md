# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

AAA Artists primarily serves promoters, venues, and event organisers who need to discover and
book trance artists for an event.

## Product Purpose

AAA Artists presents a curated roster of bookable artists, helps organisers filter that roster
according to what they are looking for, and centralises direct booking enquiries. The artist is
the product being discovered and booked. Success means an organiser can narrow the roster and
make an informed choice — even without prior knowledge of the artists — provide the information
needed for a booking conversation, and continue that conversation with the agency.

## Positioning

AAA Artists is the artist agency from the team behind AAA Events. Its offer is trance-first, with
audio-first artist pages and a direct first-party booking path rather than a generic talent
marketplace.

## Operating Context

Visitors browse the roster, listen to artist media after making a consent choice, review artist
dates, and submit an enquiry for one or more artists. Visitors who are unsure which artist fits
can ask the agency to contact them and discuss the choice. The intended product direction is to
let clients filter artists using relevant musical, stylistic, and event-fit information rather
than presenting an undifferentiated list and expecting them to choose alone.

## Capabilities and Constraints

- Artist and event content is maintained in `data/artists/*.yml`; generated data is not an
  editorial source.
- Artist pages are audio-first and support consent-gated Spotify and SoundCloud embeds.
- Client-facing artist filtering based on genre, style, BPM, and other relevant suitability
  criteria is a confirmed part of this site but is not implemented. The filter dimensions,
  artist data model, matching behaviour, and user experience still require product discussion
  and development.
- Dates live on artist pages; there is no standalone events page.
- Booking enquiries use the same-origin `/api/enquiries` route and keep secrets and email
  delivery server-side.
- The site is a Next.js App Router static export served through a Cloudflare Worker.
- Staging is deployed automatically from `main`; production requires an explicit manual release.
- Legal and privacy claims must remain factual and must not be inferred from incomplete project
  information.

## Brand Commitments

- The product name is AAA Artists and its relationship to AAA Events is part of its identity.
- The roster, supplied artist media, event data, logo, and existing editorial content are
  authoritative assets.
- The product remains focused on trance artists and booking rather than expanding into a generic
  events marketplace.

## Evidence on Hand

- Artist profiles, media links, and event records in `data/artists/`.
- The existing production site and repository implementation.
- No testimonials, customer logos, performance benchmarks, or booking-volume claims are
  established; future work must not fabricate them.

## Product Principles

- Help visitors narrow the roster using factual musical and event-fit criteria instead of
  requiring prior knowledge of the artists.
- Keep the path from interest to direct enquiry clear and trustworthy.
- Let artist audio and factual event information carry the experience.
- Ask for consent before loading third-party media.
- Preserve editorial and legal truth instead of inventing persuasive claims.
