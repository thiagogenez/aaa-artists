# Roster Discovery Prototype — V2 Handoff

Last updated: 2026-08-09  
Status: active prototype; continue from this point in the next design session  
Prototype route: `/roster-prototype`  
Earlier concept record: [`roster-discovery-v1.md`](./roster-discovery-v1.md)

## Session outcome

The roster has moved away from the original heatmap, map and quadrant ideas. The current direction is much clearer, more energetic and better suited to an artist-booking website.

The visitor now starts with a sound cluster and sees the roster reorganise around that choice. Artist names remain visible, matching artists move forward and non-matching artists remain available without competing for attention.

This is the design direction to continue.

## User feedback to preserve

- The editorial artist roster looks significantly better than the heatmap idea.
- The animated movement when a sound is selected feels useful and visually interesting.
- The headline treatment is a strong part of the design:

  > Find the right sound  
  > for your room.

- The vivid cluster colours work well with both the light and dark themes.
- Explore applying the same typography character more broadly across the website.
- Improve and formalise the colour system without losing the neutral, editorial foundation.

## Locked design decisions

- No heatmap, map, quadrant, artist coordinates or connector lines.
- Use a strong editorial image grid for the roster.
- Keep artist names visible at all times.
- Every artist has equal weight in the default state.
- Selecting a sound sorts the roster instead of hiding artists.
- Matching artists move into a labelled `Best matches` group.
- Non-matching artists move into `Other sounds` with reduced—but still readable—emphasis.
- Colour is used for interaction and meaning, not as a constant decorative background.
- Hover is never the only way to access information; focus and tap receive equivalent behaviour.
- The production homepage remains unchanged until the prototype is approved.

## Current cluster data

| Cluster | BPM range | Artists |
| --- | --- | --- |
| Progressive Trance | 126–134 BPM | Mr B, Krevix |
| Uplifting Trance | 136–142 BPM | XiJaro & Pitch, C-Systems, SAGO, Krevix, FROGR, Thiago Genez |
| Techno (Peak Time / Driving) | 128–145 BPM | FROGR, Thiago Genez |
| Hard Techno | 148–160 BPM | Thiago Genez |

Thiago is not classified as Progressive Trance.

## V2 interaction — historical baseline

This section records the earlier implementation. The V4 section below describes the current prototype and supersedes the roster counts, stretched rows and separate booking panel.

### Default state

- Four sound controls show the cluster name, BPM range and roster count.
- All seven artist cards are shown at full emphasis.
- No artist is selected by default.
- The side panel invites the visitor to choose an artist.

### Selected sound

For example, selecting Progressive Trance:

1. The Progressive control fills with its violet accent.
2. Krevix and Mr B move into `Best matches`.
3. Their card underlines receive the Progressive accent.
4. The other five artists move into `Other sounds`.
5. Non-matching cards become desaturated and approximately 40% prominent.
6. Their names remain legible and their cards remain clickable.
7. The result text changes to `2 artists match Progressive`.
8. `Show all sounds` restores the full roster.

### Selected artist

Selecting an artist opens a reserved booking panel containing:

- Artist name.
- Short positioning statement.
- Sound profile.
- Associated BPM ranges.
- Full profile action.
- Booking enquiry action.
- Short note explaining that fees, availability and routing are handled through the enquiry.

### Motion

- Artist sorting uses a FLIP-style position transition.
- Reordering runs for approximately 460 ms with gentle ease-out timing.
- Matching-card accent lines animate after selection.
- There is one short entrance sequence when the prototype first loads.
- There is no perpetual floating, pulsing or automatic genre cycling.
- `prefers-reduced-motion` receives immediate state changes.

## Typography direction

The headline currently uses the site's system sans-serif stack. Its character comes primarily from:

- Very heavy weight.
- Large scale.
- Tight negative letter spacing.
- Compact line height.
- A muted second line.
- Strong contrast against smaller uppercase supporting labels.

The next step should be to turn this into a reusable **display-heading system**, not apply the same extreme typography to every piece of text.

Recommended website-wide typography hierarchy:

1. **Display headings:** use the prototype's heavy, tightly tracked treatment for important page and section statements.
2. **Section headings:** use a slightly smaller and less compressed version of the same family.
3. **Navigation and labels:** retain the small uppercase, widely tracked treatment.
4. **Body copy:** retain a neutral, readable system sans-serif with normal tracking and comfortable line height.

This gives the whole website the same personality without sacrificing readability.

## Colour direction

Current prototype accents:

| Cluster | Working accent |
| --- | --- |
| Progressive Trance | Violet |
| Uplifting Trance | Vivid pink |
| Peak Time / Driving | Orange |
| Hard Techno | Acid yellow-green |

The colour works because the website remains mostly monochrome. Colour appears when the visitor makes a choice and then travels into matching roster cards and their profile backs.

Recommended next improvement:

- Convert the four accents into semantic design tokens rather than local prototype values.
- Define tuned light-theme and dark-theme versions of each accent.
- Use the accents consistently for selected controls, matching-card rules, focus indicators and small status markers.
- Keep body backgrounds, navigation, typography and unselected cards neutral.
- Verify text and control contrast for every colour in both themes.
- Avoid using all four colours simultaneously across unrelated sections; their meaning should remain connected to sound discovery.
- Test whether vivid colours should appear elsewhere as brief interactive signals, not permanent large surfaces.

## Responsive state

- Desktop: the selector forms one row with `Trance` above Progressive/Uplifting and `Techno` above Peak Time/Driving/Hard Techno; a stronger central rule separates the families.
- Tablet and mobile: the selector becomes a `Trance` row followed by a `Techno` row, with two controls in each family.
- Artist cards use four equal columns on desktop, two on tablet and one on mobile.
- Artist actions use the production hover/focus/tap reveal; there is no flip or separate detail panel.
- Interactive targets are at least 44 px.
- Automated checks confirm there is no horizontal overflow.

## Current files

- `app/roster-prototype/page.tsx` — isolated prototype route and artist membership data.
- `app/roster-prototype/PrototypeRoster.tsx` — filtering, sorting and accessible artist-card interaction.
- `app/roster-prototype/prototype.module.css` — responsive layout, typography, colours and motion.
- `tests/e2e/roster-prototype.spec.ts` — desktop, tablet and mobile interaction coverage.
- `docs/roster-discovery-v1.md` — the agreed initial concept before the V2 refinement.
- `docs/roster-discovery-v2-handoff.md` — this continuation record.

## Verification completed

- Production build passes.
- TypeScript passes.
- Prototype Playwright suite passes 10 tests across desktop Chromium, tablet WebKit and mobile WebKit, with 2 expected project-specific skips.
- Lint has no errors and retains the existing unrelated warning in `components/ThemeProvider.tsx`.
- Default desktop and mobile layouts were visually inspected.
- Progressive selected state was visually inspected after its motion completed.
- V4 BPM controls, full-size card back, compact card front/back and Progressive mobile state were visually inspected.
- V5 active-genre toggle, equal desktop/mobile card geometry, faded `Other sounds` state and production-style touch reveal were visually inspected.
- V6 Trance/Techno grouping, neutral deselected state and stronger `Other sounds` de-emphasis were visually inspected on desktop and mobile in light and dark themes.
- V7 editorial family markers, compact alternative cards, equalizer response and move-and-scale filtering were visually inspected at desktop and mobile widths.
- V8 Signal Bridge and Shared T variants, selected-hover waveform, and mobile result handoff were visually inspected at 1440 px and 375 px.
- V9 Editorial Pair, Trance + Techno, Crossfade and Signal Rail variants plus the softer 94% alternative-card scale were visually inspected at 1440 px and 375 px.
- V10 locked Editorial Pair without the comparison controls or coloured family background was visually inspected in light/dark desktop and light mobile themes.

## V6 refinement — sound families and clearer interaction states

V6 makes the four-cluster model understandable before the visitor starts filtering:

- Progressive and Uplifting sit under a visible `Trance` family; Peak Time/Driving and Hard Techno sit under `Techno`.
- The Peak Time cluster follows Beatport's full taxonomy, `Techno (Peak Time / Driving)`, while its control uses the shorter `Peak Time / Driving` label because the family heading already supplies `Techno`.
- Desktop uses a stronger vertical family divider. Tablet and mobile stack the two family rows so the relationship survives narrow layouts.
- A selected genre receives the full accent fill. Inactive hover gets a short accent rule and keyboard focus gets a visible outline, so deselecting can never look selected merely because the pointer or focus remains on the control.
- `Other sounds` keeps the same card geometry, but the photograph rests at 32% intensity and the readable artist label at 64%. Hover, focus or tap restores the card before revealing the production-style action panel.

## V7 refinement — editorial families and signal motion

V7 removes the academic/table-like presentation while preserving the Trance/Techno model:

- `Trance` and `Techno` are now oversized, low-contrast editorial markers behind their respective control pairs rather than boxed header rows.
- Whitespace, a restrained family-colour glow and two independent control groups replace the central table divider.
- The inactive call to action is `Reveal artists`; the misleading diagonal navigation arrow is replaced by a five-bar equalizer icon.
- The equalizer plays one short response on hover, keyboard focus or selection and then settles. It does not loop, and reduced-motion mode disables it.
- In a filtered state, `Other sounds` cards use the same production card but render at 88% size. Matching artists retain full size.
- The FLIP sort now interpolates both position and scale, so filtering produces one connected move-and-zoom gesture rather than a size snap followed by movement.

## V8 refinement — connected typography study and mobile handoff

V8 deliberately keeps both family-mark directions available until one is approved:

- `Signal bridge` is the default: clearly readable `Trance` and `Techno` serif lettering is joined by a compact waveform, with one blended violet-to-orange atmosphere behind both words.
- `Shared T` renders `ECNAR` + a central shared `T` + `ECHNO`. Reading outward from the centre produces `TRANCE` and `TECHNO`; it is retained as the more experimental logo-like option.
- A temporary `Family-mark study` switcher exposes both treatments on the prototype. Remove the switcher and rejected variant after selection.
- The four genre controls now form one continuous responsive spectrum rather than two visually separated family containers. Their explicit genre names preserve clarity regardless of the decorative mark.
- When a selected genre is hovered with a pointer, its equalizer continues moving until the pointer leaves. Focus and touch keep the shorter one-shot response, and reduced-motion mode remains static.
- After a mobile visitor explicitly selects a genre, the viewport smoothly hands off to the result summary and `Best matches`; reduced-motion mode uses an immediate handoff. Deselecting does not force the visitor back to the selector.
- Artist hover treatments are restricted to hover-capable pointers so the mobile handoff cannot leave a false photographic hover state beneath the original touch coordinate.

## V9 refinement — four family-mark directions

V9 supersedes the V8 Signal Bridge/Shared T comparison with four clearer options:

1. `Editorial Pair` restores the original V7 `TRANCE` and `TECHNO` treatment and is the default baseline.
2. `Trance + Techno` keeps both words on one line and uses the mini waveform as their connective `+`.
3. `Crossfade` keeps both complete words readable while their colours transition from violet/pink into orange at the centre.
4. `Signal Rail` places smaller family labels at the ends of one uninterrupted waveform spanning the complete four-genre spectrum.

The temporary study switcher retains all four options for direct desktop and mobile comparison. V9 also reduces the size contrast for `Other sounds`: alternative cards now render at 94% rather than 88%, retaining the move-and-scale cue without making them feel like a separate component.

## V10 decision — Editorial Pair selected

- `Editorial Pair` is the selected family treatment.
- Removed the temporary typography-study switcher and the Plus, Crossfade and Signal Rail implementations.
- Removed the violet/orange glow behind `TRANCE` and `TECHNO`; the labels now sit directly on the page background in both themes.
- The 94% `Other sounds` card scale, genre waveform interaction and mobile handoff remain unchanged.

## V11 prototype — genre plus BPM mixer

V11 tests the discovery model as two connected choices instead of embedding fixed BPM ranges inside every genre control:

1. The visitor selects one of the four genre clusters.
2. The BPM fader unlocks and starts at that cluster's working midpoint.
3. Dragging from 120 to 160 BPM recalculates the roster using both genre membership and each artist's individual working range.
4. Artists that match both dimensions move into `Best matches`; artists outside either dimension remain discoverable in `Other sounds`, ordered by genre compatibility and BPM proximity.
5. If there is no exact match, the interface says so directly and keeps the nearest artists visible rather than showing an empty page.

The native range input supports mouse, touch and keyboard. It retains a 48 px interaction lane, a visible focus treatment and immediate state changes when reduced motion is requested. The existing FLIP movement runs only when a ranking or group position actually changes.

The following values are **working prototype assumptions**, held in `app/roster-prototype/prototypeData.ts` rather than the canonical artist YAML:

| Artist | Prototype genres | BPM centre ± delta | Derived range |
| --- | --- | --- | --- |
| Mr B | Progressive | 130 ± 4 | 126–134 |
| Krevix | Progressive, Uplifting | 136 ± 6 | 130–142 |
| XiJaro & Pitch | Uplifting | 140 ± 3 | 137–143 |
| C-Systems | Uplifting | 138 ± 4 | 134–142 |
| SAGO | Uplifting | 140 ± 3 | 137–143 |
| FROGR | Uplifting, Peak Time | 142 ± 6 | 136–148 |
| Thiago Genez | Uplifting, Peak Time, Hard Techno | 145 ± 15 | 130–160 |

These values validate the interaction only. Before promotion to production, confirm them with the artists and move an agreed, validated discovery schema into `data/artists/*.yml`.

## Frozen prototype routes

Both approved directions are preserved as working, directly testable routes:

| Version | Route | Purpose |
| --- | --- | --- |
| V10 — fixed ranges | `/roster-prototype/v10` | Viable rollback: four genre controls retain the Beatport cluster ranges, and selecting a genre sorts artists using genre membership only. |
| V11 — BPM mixer | `/roster-prototype/v11` | Current experiment: genre selection plus the 120–160 BPM fader and provisional artist-specific centre/delta data. |
| Current pointer | `/roster-prototype` | Currently renders V11. This route can be switched back to V10 with one explicit component prop if the mixer direction is rejected. |

The two routes share the artist cards, animation, accessibility behaviour and core layout through one versioned component. This prevents a rollback snapshot from becoming an unmaintained copy while keeping the discovery logic and mobile handoff distinct:

- V10 mobile selection moves to the roster results.
- V11 mobile selection moves to the BPM mixer.
- V10 action panels show the fixed cluster BPM ranges.
- V11 action panels show each artist's provisional derived BPM range.

## V3 refinement — editorial rhythm and reusable tokens

The next refinement keeps the V2 interaction model intact and improves how it fits a real booking page:

- Incomplete desktop and tablet grid rows now expand into intentional wide artist features instead of leaving empty grey cells.
- On mobile, the empty booking prompt is removed from the initial browsing path. The panel appears only after an artist is selected.
- The display headline, section heading and eyebrow treatment now use opt-in global typography utilities. This makes the visual language reusable without changing body copy or applying it across production pages prematurely.
- The four genre accents now use semantic light/dark theme tokens rather than component-local hex values.
- Accent and foreground pairs were tuned to meet at least WCAG AA contrast for text:

| Cluster | Light theme | Dark theme |
| --- | --- | --- |
| Progressive Trance | `#5b4bff` / white | `#8b7cff` / near-black |
| Uplifting Trance | `#ff4f91` / deep ink | `#ff70a6` / deep ink |
| Peak Time / Driving | `#ff6a32` / deep ink | `#ff8654` / deep ink |
| Hard Techno | `#c9f23b` / deep ink | `#d7ff5f` / deep ink |

The UI/UX review reinforced the existing motion decision: keep animation concentrated on the roster reorder and short state transitions, retain `prefers-reduced-motion`, and avoid adding ambient perpetual movement.

## V4 refinement — simpler data and in-card discovery

V4 responds to the first hands-on mobile review and supersedes the V3 incomplete-row treatment:

- Removed roster counts from sound controls and section labels.
- Removed the decorative artist order numbers.
- Split every BPM range into start, fixed-width dash and end columns so the separator is optically centred.
- Full-roster and matching cards now keep stable, uniform sizes; filtering no longer stretches cards according to the number left in a row.
- `Other sounds` uses a separate compact-card layout with quieter—but readable—emphasis.
- Removed the reserved `Booking fit` rail.
- Clicking or tapping an artist flips that same card to reveal its tagline, genres, BPM ranges, full-profile action and enquiry action.
- Only one artist card opens at a time. Opening moves keyboard focus to `Close`; closing returns focus to the artist trigger.
- The interaction uses click/tap rather than hover. Reduced-motion mode replaces the 3D rotation with an immediate face change.

The V4 interaction sequence was: choose a sound → scan stable matches → optionally explore compact alternatives → flip an artist in place → continue to profile or enquiry.

## V5 refinement — production card consistency

V5 supersedes the V4 compact-card and flip-card treatments:

- A selected genre control is now a true toggle. Clicking or tapping the active genre again restores the complete roster.
- The active control explicitly says `Show all artists` so the repeated-click behavior is visible.
- `Best matches`, `Other sounds` and the unfiltered roster all use the same card dimensions and responsive column rules.
- Incomplete rows remain incomplete; cards never stretch to fill spare columns.
- `Other sounds` is distinguished by its section label, sorted position and a 50% resting opacity—not by a different card component.
- Faded cards return to full emphasis on hover, keyboard focus or tap and remain fully interactive.
- Removed the card flip. Artist interaction now mirrors the production `/artists` card: image scale, subtle wash, resting-label fade and a bottom action panel that slides upward.
- The reveal adds one concise layer of discovery—genre memberships and BPM ranges—before the existing profile and booking actions.
- Pointer devices reveal on hover, keyboards reveal on visible focus and touch devices reveal on first tap. Only one prototype card is open at a time.

The current interaction sequence is: choose or toggle a sound → scan equal-size cards → reveal an artist in the familiar production pattern → continue to profile or booking.

## Start here next session

1. Open `/roster-prototype/v11` and continue the BPM mixer experiment.
2. Use `/roster-prototype/v10` whenever a direct comparison or rollback baseline is needed.
3. Confirm or replace the provisional artist BPM centre/delta values before moving them to YAML.
4. Review the production-style action reveal on a matching and faded artist card on a real phone.
5. Decide whether V10, V11 or a hybrid is ready to replace the current homepage genre section.

## Do not do yet

- Do not replace the production homepage genre section yet.
- Do not apply the heavy display treatment to all body text.
- Do not spread the four genre colours throughout unrelated website components.
- Do not introduce audio autoplay, looping animation or a return to spatial mapping.
- Do not edit generated artist JSON directly; source artist content remains in `data/artists/*.yml`.
