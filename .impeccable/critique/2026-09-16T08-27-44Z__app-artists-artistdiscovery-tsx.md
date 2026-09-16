---
target: parte acima do Spectrum
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-16T08-27-44Z
slug: app-artists-artistdiscovery-tsx
---
# Impeccable critique: controls above Spectrum

## Direct answer

“Styles shown” is large because the control row is built as four grid tracks and that field explicitly spans two of them. Artist search receives one track and loses another 32 px to internal padding. At 1024 px this becomes approximately 244 px for Artists, 488 px for Styles shown, and 244 px for Moment; at 768 px, the search falls to about 180 px while Styles still receives 360 px. The layout only stacks below 640 px, so the imbalance is most visible on tablet and narrow desktop widths.

## Design health

| Heuristic | Score |
|---|---:|
| Visibility of system status | 4/4 |
| Match with the real world | 3/4 |
| User control and freedom | 4/4 |
| Consistency and standards | 4/4 |
| Error prevention | 3/4 |
| Recognition rather than recall | 3/4 |
| Flexibility and efficiency | 3/4 |
| Aesthetic and minimalist design | 2/4 |
| Error recovery | 3/4 |
| Help and documentation | 2/4 |
| **Total** | **31/40** |

## Design-specificity verdict

The area is recognizably built for artist booking rather than a generic dashboard: artist search, styles, night moment, BPM coverage, and comparison language all support a promoter's task. The weak point is hierarchy. Directly finding an artist is a stronger and more frequent intent than configuring which chart rows are visible, but the layout currently gives the configuration control more space.

## Overall impression

The controls are semantically strong and consistent, but the row communicates the wrong priority. The chart payoff is also delayed by two separate horizontal bands for summary and instructions. The best correction is structural, not decorative: make artist search dominant, let Styles shown and Moment remain secondary, and introduce an intermediate responsive composition before mobile.

## What works

- Search, pickers, reset actions, Escape handling, focus restoration, and selection feedback provide strong control and system status.
- Styles shown and Moment use the same interaction grammar.
- The monochrome interface with spectrum colors reserved for musical data fits the established design direction.
- “Each artist appears in every style they play” and the compare instruction explain the chart's distinctive behavior.
- Light and dark themes preserve the same information hierarchy and meaning.

## Priority issues

### P1 — Artist search is structurally de-prioritized

Styles shown spans two tracks while Artists receives one. Replace the four-track Spectrum layout with three explicit logical columns. A useful starting proportion is Artists 48%, Styles 30%, Moment 22%. The Styles popover already has its own absolute width, so its trigger does not need two columns.

Suggested command: `/impeccable:arrange`

### P1 — Tablet and narrow desktop have a responsive cliff

From 640–767 px the controls remain in four narrow tracks. The search input approaches or exceeds its inner allocation, and the popovers can run beyond the viewport edge. At intermediate widths, place Artists across the first row and Styles/Moment on a second row at roughly 60/40; below 640 px, retain the existing single-column disclosure. Alternatively, raise the stacked breakpoint to 767 px.

Suggested command: `/impeccable:adapt`

### P2 — Control boundaries and touch targets need hardening

Resting underlines are visually faint in both themes, and the picker triggers use a 38 px minimum height instead of the design system's 44 px touch-target floor. Strengthen the neutral resting boundary without competing with the active focus state, and raise the trigger height.

Suggested command: `/impeccable:harden`

### P2 — Summary and guidance postpone the chart

The result summary and instructional guide occupy two separate bands before the visualisation. Preserve the useful aggregate information, but combine it with the guide as one compact chart-introduction band. Replace mouse-specific “Point to trace…” with modality-neutral wording such as “Explore an artist to trace every style. Select to compare.”

Suggested command: `/impeccable:distill`

### P2 — Product language can become more self-explanatory

“Moment” and “Spectrum” make sense after using the feature, but a first-time promoter must infer them. “Night moment” and “BPM spectrum,” or a short support line such as “Where the set fits in the night,” would reduce interpretation cost. The Styles trigger should also receive explicit accessible label/value naming parity with Moment.

Suggested command: `/impeccable:clarify`

## Persona red flags

- A first-time promoter sees the largest control as the most important one and may assume Styles shown is the primary task.
- An experienced booker can type quickly, but the cramped field frustrates multi-artist comparison at common laptop/tablet widths.
- Keyboard and low-vision users benefit from good semantics, but faint resting boundaries and sub-44 px targets weaken control discovery and touch use.

## Minor observations

- The fixed-width Grid/Spectrum view switch is slightly heavier than necessary and could shrink from 21 rem to about 18–20 rem.
- Keep picker interaction parity while changing their layout.
- The detector found no static anti-pattern violations in `ArtistDiscovery.tsx`; the important problems here are relational layout and responsive behavior, which need visual/source reasoning rather than lint-style detection.
