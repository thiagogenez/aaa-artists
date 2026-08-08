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
| Peak Time / Driving | 128–145 BPM | FROGR, Thiago Genez |
| Hard Techno | 148–160 BPM | Thiago Genez |

Thiago is not classified as Progressive Trance.

## V2 interaction currently implemented

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

The colour works because the website remains mostly monochrome. Colour appears when the visitor makes a choice and then travels into the matching roster cards and booking panel.

Recommended next improvement:

- Convert the four accents into semantic design tokens rather than local prototype values.
- Define tuned light-theme and dark-theme versions of each accent.
- Use the accents consistently for selected controls, matching-card rules, focus indicators and small status markers.
- Keep body backgrounds, navigation, typography and unselected cards neutral.
- Verify text and control contrast for every colour in both themes.
- Avoid using all four colours simultaneously across unrelated sections; their meaning should remain connected to sound discovery.
- Test whether vivid colours should appear elsewhere as brief interactive signals, not permanent large surfaces.

## Responsive state

- Desktop: four sound controls in one row, three-column roster and reserved side panel.
- Tablet: two-column sound controls, two-column roster and side panel.
- Mobile: compact 2×2 sound selector, single-column roster and booking panel above the cards.
- Interactive targets are at least 44 px.
- Automated checks confirm there is no horizontal overflow.

## Current files

- `app/roster-prototype/page.tsx` — isolated prototype route and artist membership data.
- `app/roster-prototype/PrototypeRoster.tsx` — filtering, sorting, selection and booking-panel interaction.
- `app/roster-prototype/prototype.module.css` — responsive layout, typography, colours and motion.
- `tests/e2e/roster-prototype.spec.ts` — desktop, tablet and mobile interaction coverage.
- `docs/roster-discovery-v1.md` — the agreed initial concept before the V2 refinement.
- `docs/roster-discovery-v2-handoff.md` — this continuation record.

## Verification completed

- Production build passes.
- TypeScript passes.
- Prototype Playwright suite passes 9 tests across desktop Chromium, tablet WebKit and mobile WebKit.
- Lint has no errors and retains the existing unrelated warning in `components/ThemeProvider.tsx`.
- Default desktop and mobile layouts were visually inspected.
- Progressive selected state was visually inspected after its motion completed.

## Start here next session

1. Open `/roster-prototype` and review the default, Progressive and Uplifting states in both themes.
2. Review the `Best matches` versus `Other sounds` balance at real browser size.
3. Turn the display-heading treatment into reusable typography tokens or utilities.
4. Audit where the display style should appear across the existing website without changing body copy.
5. Define semantic light/dark tokens for the four cluster accents and run contrast checks.
6. Refine the artist booking panel after reviewing it with real selected artists.
7. Decide whether the prototype is ready to replace the current homepage genre section.

## Do not do yet

- Do not replace the production homepage genre section yet.
- Do not apply the heavy display treatment to all body text.
- Do not spread the four genre colours throughout unrelated website components.
- Do not introduce audio autoplay, looping animation or a return to spatial mapping.
- Do not edit generated artist JSON directly; source artist content remains in `data/artists/*.yml`.
