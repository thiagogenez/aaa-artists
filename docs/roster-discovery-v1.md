# Roster Discovery Prototype — V1

Status: agreed initial direction  
Prototype route: `/roster-prototype`

Continuation: [`roster-discovery-v2-handoff.md`](./roster-discovery-v2-handoff.md)

## Purpose

Help promoters and event organisers discover the right AAA artist by starting with the sound and energy they want for their event.

This is a booking experience, not a scientific chart. The interface uses clear genre filters, real artist imagery and purposeful movement while keeping the underlying classification easy to understand.

## Decisions we are keeping

- Do not use a map, quadrant, scatter plot or abstract artist positioning.
- Keep artist names visible at all times.
- Present the roster as a strong editorial image grid.
- Let genre selection sort and visually prioritise the relevant artists.
- Keep the large headline treatment:

  > Find the right sound  
  > for your room.

- Preserve the headline's heavy weight, tight tracking and muted second line.
- Use a restrained monochrome foundation, with stronger colour appearing through interaction.
- Give every artist equal default visual weight. No artist is the centre of the composition.

## Sound clusters and BPM ranges

| Cluster | BPM range | Artists |
| --- | --- | --- |
| Progressive Trance | 126–134 BPM | Mr B, Krevix |
| Uplifting Trance | 136–142 BPM | XiJaro & Pitch, C-Systems, SAGO, Krevix, FROGR, Thiago Genez |
| Peak Time / Driving | 128–145 BPM | FROGR, Thiago Genez |
| Hard Techno | 148–160 BPM | Thiago Genez |

Thiago is not classified as Progressive Trance.

## Default state

- Show the four cluster controls with their genre name, BPM range and artist count.
- Show all seven artists in the roster grid.
- Keep every artist image and name at full emphasis.
- Do not select or promote an artist by default.
- The side panel invites the visitor to choose an artist.

## Genre-selection behaviour

When a visitor selects a cluster such as **Progressive Trance**:

1. The selected cluster control receives its active colour.
2. Matching artists move smoothly to the beginning of the grid.
3. Mr B and Krevix remain in full colour and full emphasis.
4. Artists without the Progressive tag move after them and receive a non-selected treatment.
5. The result text updates to `2 artists match Progressive`.
6. A `Show all sounds` action restores the original roster.

### Non-selected artist treatment

Non-selected artists remain visible and clickable. They are not removed from the roster.

- Desaturate their images.
- Reduce their visual intensity to approximately 40% rather than making them unreadable.
- Keep artist names legible.
- Place them after the matching artists.
- Introduce them as `Other sounds` if a clearer grouping is needed.
- On hover or keyboard focus, temporarily increase their emphasis so visitors can still explore them.

The distinction must not depend on colour alone. Grid order, result text and selected-state labels also communicate which artists match.

## Artist-selection behaviour

Selecting an artist opens the reserved detail panel without navigating away immediately. The panel contains only booking-relevant information:

- Artist name.
- Short positioning statement.
- Matching sound clusters.
- BPM ranges associated with those clusters.
- `View artist` action.
- `Enquire` action.

Artist names remain visible on the cards before, during and after interaction.

## Motion principles

- Use movement to explain changes in the data.
- Animate the artist-grid reordering over roughly 350–460 ms with gentle ease-out timing.
- Use one short entrance sequence when the section first appears.
- Do not add continuous floating, pulsing or looping animation.
- Hover, focus and tap must produce equivalent results.
- Respect `prefers-reduced-motion`; filtering then updates immediately.
- Animation must not cause the page around the roster to jump.

## Responsive behaviour

- Desktop: four cluster controls in one row, three-column artist grid and a reserved detail panel.
- Tablet: two-column cluster controls and two-column artist grid.
- Mobile V1: stacked cluster controls, single-column artist grid and the detail panel above the grid.
- All interactive targets must be at least 44 px high.
- The page must not scroll horizontally.

## Booking path

The intended visitor journey is:

1. Choose the desired sound.
2. See the matching artists move forward.
3. Select an artist.
4. Review their range.
5. View the full profile or send a booking enquiry.

## V2 improvement candidates

- Make the cluster controls more compact without reducing BPM readability.
- Use a compact 2×2 cluster selector on mobile instead of four tall controls.
- Let the selected cluster colour travel briefly into the matching card underlines.
- Give non-selected artists a clearer `Other sounds` grouping.
- Refine the artist detail panel around booking decisions.
- Review the balance between matching and non-selected card emphasis in both themes.

## Out of scope for V1

- Genre maps or quadrants.
- Artist coordinates or connector lines.
- Hidden artist names.
- Autoplaying audio or video.
- Automatic cycling through genres.
- Changing the production homepage before the prototype is approved.
