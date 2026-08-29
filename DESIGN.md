---
name: AAA Artists
description: A precise monochrome system for artist discovery and direct booking.
colors:
  signal-black: "#0a0a0a"
  gallery-white: "#f8f8f8"
  stage-white: "#ebebeb"
  light-surface: "#e8e8e8"
  light-border: "#d0d0d0"
  dark-surface: "#141414"
  dark-border: "#2a2a2a"
  error-light: "#c0341d"
  error-dark: "#f87171"
typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.1em"
rounded:
  square: "0px"
spacing:
  tight: "0.375rem"
  compact: "0.75rem"
  standard: "1rem"
  group: "1.5rem"
  section: "6rem"
components:
  button-primary-light:
    backgroundColor: "{colors.signal-black}"
    textColor: "{colors.gallery-white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.75rem 1.25rem"
    height: "3rem"
  button-primary-dark:
    backgroundColor: "{colors.stage-white}"
    textColor: "{colors.signal-black}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.75rem 1.25rem"
    height: "3rem"
  input-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.signal-black}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0.75rem 1rem"
    height: "3.125rem"
  input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.stage-white}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "0.75rem 1rem"
    height: "3.125rem"
---

# Design System: AAA Artists

## Overview

**Creative North Star: "The Curated Signal"**

AAA Artists uses a monochrome visual signal to help visitors focus on artists, sound, and booking
decisions. The identity is precise, restrained, confident, underground, and useful: editorial
hierarchy and deliberate spacing carry more weight than decoration. It should feel connected to
a serious promoter and artist agency, never like a generic marketplace.

The existing logo, black-and-white palette, and equal light/dark themes are the anchors. Future
work should refine their clarity and craft rather than replace them. Colourful festival graphics,
corporate software styling, and luxury-agency ornament are anti-references.

**Key Characteristics:**

- Monochrome contrast led by the AAA Artists logo.
- Equal-quality light and dark experiences.
- Square geometry, thin rules, and tonal surfaces.
- Bold headlines paired with compact uppercase labels.
- Artist imagery and audio provide the expressive content.

## Colors

The palette is deliberately achromatic: black, white, and steel greys reverse roles between
themes while preserving hierarchy.

### Primary

- **Signal Black:** The deepest page, text, and action colour; it anchors the logo and the dark
  theme.
- **Gallery White:** The light-theme canvas and inverse action text; it keeps the roster
  presentation neutral.
- **Stage White:** The softer dark-theme foreground and primary dark-theme action surface.

### Neutral

- **Light Surface:** Raised form controls and grouped content in the light theme.
- **Light Border:** Structural divisions in the light theme.
- **Dark Surface:** Raised form controls and grouped content in the dark theme.
- **Dark Border:** Structural divisions in the dark theme.
- **Error Light / Error Dark:** Theme-specific validation colours used only for errors and recovery.

**The Theme Parity Rule.** Light and dark are equal products. Neither may be treated as an
afterthought or simple colour inversion.

**The Monochrome Signal Rule.** Product chrome remains black, white, and grey; artist media
supplies colour when the experience deliberately reveals it.

## Typography

**Display Font:** System UI (with `-apple-system` and sans-serif fallbacks)

**Body Font:** System UI (with `-apple-system` and sans-serif fallbacks)

**Character:** One pragmatic sans-serif voice shifts through scale, weight, case, and tracking.
Headlines are direct and heavy; labels are compact, uppercase, and widely tracked.

### Hierarchy

- **Display** (700, 3.75rem desktop, 1.25 line-height): Major page and hero statements.
- **Headline** (700, 2.25rem, 1.25 line-height): Section-level messages and mobile page titles.
- **Title** (700, 1.5rem, 1.25 line-height): Cards and strong local headings.
- **Body** (400, 1rem, 1.625 line-height): Explanatory and booking copy; keep sustained reading to
  a restrained measure.
- **Label** (600, 0.75rem, 0.1em tracking, uppercase): Navigation, field labels, steps, genres,
  and compact actions.

**The One Typeface Rule.** Hierarchy comes from disciplined scale, weight, and spacing; do not
introduce a decorative display face without an explicit identity decision.

## Layout

The shared shell spans the viewport up to 1440px, while each section owns its horizontal padding.
Pages use generous vertical separation and precise internal grouping. The home page may align
major elements to its 60px grid, but that grid is a signature of the hero rather than a universal
page overlay.

Responsive structure moves from one column to two at 640px and to the full desktop composition at
1024px where the content requires it. Navigation also switches at 1024px so tablet layouts retain
the mobile menu. Touch targets remain at least 44px, form controls use 16px text to avoid mobile
browser zoom, and DOM order must remain the reading and focus order.

**The Proximity Before Boxes Rule.** Use spacing to establish related groups before adding another
bordered container. A border must communicate a real structural boundary or state.

## Elevation & Depth

The system is flat by default. Thin borders and small tonal changes create hierarchy; ordinary
cards, fields, and navigation do not float. Shadows are reserved for temporary overlays that must
separate themselves from the page, such as the media-consent banner.

### Shadow Vocabulary

- **Consent Lift** (`0 -10px 30px var(--media-banner-shadow)`): Separates the fixed consent
  decision from page content without changing the underlying design language.

**The Flat-by-Default Rule.** Persistent surfaces use borders and tone. Shadow communicates
temporary overlay depth, not decoration.

## Shapes

The core form language is rectilinear: square corners, one-pixel borders, straight dividers, and
cropped rectangular media. Circular geometry is limited to naturally circular controls or small
touch guidance, not used as a general card or button style.

**The Square Instrument Rule.** Booking controls, CTAs, navigation controls, and content
containers remain square unless the function itself calls for a circle.

## Components

Components should feel precise and restrained, with state communicated through contrast, thin
rules, and small purposeful motion.

### Buttons

- **Shape:** Square corners with a minimum 44px touch target.
- **Primary:** Solid theme-inverted fill, compact uppercase label, and generous horizontal padding.
- **Hover / Focus:** A 200ms tonal shift on hover and a visible two-pixel focus outline; movement
  is subtle and limited to directional affordances.
- **Outline:** One-pixel structural border and muted text at rest, brightening together on hover
  or keyboard focus.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** Page-subtle or theme surface tones.
- **Shadow Strategy:** Flat; see Elevation & Depth.
- **Border:** One-pixel theme border when the card is a meaningful unit.
- **Internal Padding:** Compact on mobile, increasing at established breakpoints.

### Inputs / Fields

- **Style:** Full-width theme surface, one-pixel border, square corners, 16px input text.
- **Focus:** Global visible focus outline; compound fields use `focus-within` so the whole control
  reads as active.
- **Error / Disabled:** Theme-specific error border and associated recovery text; disabled
  controls reduce opacity without losing legibility.

### Navigation

Navigation uses the logo as the home anchor, uppercase widely tracked links, and a one-pixel
underline sweep for hover and current-page state. The fixed bar uses a slightly translucent theme
background and restrained backdrop blur. Mobile navigation preserves the same hierarchy with
44px targets.

### Artist Cards

Artist cards are image-led, square on small screens, and grid-aligned on desktop. Their resting
imagery is monochrome; hover, focus, or tap reveals actions with a dark gradient and controlled
movement. Text and actions remain high-contrast over media.

### Booking Sections

Booking sections use bordered collapsibles, tonal headers, tabular step numbers, and clear
open/closed state. Fields group labels, controls, hints, and errors by proximity. Optional choices
should read as part of the field group they affect rather than as competing cards.

## Do's and Don'ts

### Do:

- **Do** preserve the logo as a black-and-white identity anchor in both themes.
- **Do** refine the existing monochrome system through hierarchy, spacing, imagery, and
  interaction craft.
- **Do** verify every visual change in light and dark, on mobile and desktop.
- **Do** use artist media and audio as the expressive layer while interface chrome stays restrained.
- **Do** keep interaction, keyboard focus, and touch state visible.

### Don't:

- **Don't** replace the incumbent identity when the task asks for refinement.
- **Don't** introduce decorative colour into product chrome without an explicit identity decision.
- **Don't** imitate a corporate dashboard, colourful festival campaign, or luxury-agency aesthetic.
- **Don't** round every surface or use shadows to make ordinary containers feel important.
- **Don't** create extra bordered cards when proximity can express the relationship.
