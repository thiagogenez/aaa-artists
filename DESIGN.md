---
name: AAA Artists
description: A precise monochrome-led system with spectral color for artist discovery.
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
  progressive-blue: "#65a2ff"
  uplifting-cyan: "#31d6e7"
  tech-trance-green: "#63e694"
  euro-trance-violet: "#b27aff"
  hard-trance-pink: "#ff62b4"
  melodic-techno-yellow: "#ffe44f"
  peak-time-techno-orange: "#ff9147"
  hard-techno-red: "#ff4d68"
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
  metadata:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
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

AAA Artists uses a monochrome structural system with a controlled spectral signal for artist
discovery. The identity is precise, restrained, confident, underground, and useful: editorial
hierarchy and deliberate spacing carry more weight than decoration. It should feel connected to
a serious promoter and artist agency, never like a generic marketplace.

The logo, black-and-white product chrome, and equal light/dark themes remain the anchors. Color is
functional rather than decorative: cool hues identify Trance styles, warm hues identify Techno
styles, and BPM remains encoded by position. Corporate software styling, uncontrolled festival
graphics, and luxury-agency ornament are anti-references.

**Key Characteristics:**

- Monochrome product chrome led by the AAA Artists logo.
- A stable cool-to-warm spectrum identifies musical styles across themes.
- Equal-quality light and dark experiences.
- Square geometry, thin rules, and tonal surfaces.
- Bold headlines paired with compact uppercase labels.
- Artist imagery and audio provide the expressive content.

## Colors

Black, white, and steel greys carry the interface hierarchy. A fixed spectral palette identifies
musical styles without changing between light and dark themes.

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

### Functional Spectrum

- **Trance:** Progressive Blue, Uplifting Cyan, Tech Trance Green, Euro Trance Violet, and Hard
  Trance Pink form a cool progression.
- **Techno:** Melodic Techno Yellow, Peak-Time Techno Orange, and Hard Techno Red form a warm
  progression.
- **Application:** Style color appears in filter controls, selected style labels, card accent
  rules, and Spectrum ranges. It identifies style; it never replaces BPM position or written
  labels.

**The Theme Parity Rule.** Light and dark are equal products. Neither may be treated as an
afterthought or simple colour inversion.

**The Spectral Signal Rule.** Product chrome remains black, white, and grey. The discovery
spectrum is the one systematic color layer, and its hues remain identical in both themes.

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
- **Metadata** (600, 0.875rem, 1.4 line-height): Compact result summaries and supporting data that
  must remain readable without competing with body copy.
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

The core form language is rectilinear: square corners, one-pixel structural borders, straight
dividers, and cropped rectangular media. Selected style controls use a two-pixel color stroke;
artist cards use a one-pixel color accent beneath the image. Circular geometry is limited to
naturally circular controls or small touch guidance, not used as a general card or button style.

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
- **Tertiary reset:** Contextual reset actions such as `Clear styles` and `Clear all filters` use
  the same quiet underlined text treatment without a surrounding box. They appear only when there
  is state to clear and retain a minimum 44px interaction target.

### Discovery Style Controls

- **All-styles state:** No selected style means every style in the active genre is shown. Express
  this as a neutral contextual status, never as a peer tile beside musical styles.
- **Selection summary:** When styles are active, replace the all-styles message with the selected
  count and show `Clear styles` as a quiet inline action beside that status. It never becomes a
  peer tile or changes the option layout.
- **Resting:** One-pixel neutral border with a colored style marker.
- **Selected:** One-pixel colored border plus a one-pixel inset stroke, producing a stable
  two-pixel selection without changing the control's size.
- **Focus:** A separate two-pixel outer outline appears only for keyboard focus.
- **Labels:** Because the selected Genre supplies context, visible Style labels omit the repeated
  genre suffix (`Progressive`, not `Progressive Trance`). Preserve the full label for accessible
  names and anywhere the Genre is not already explicit.
- **Layout:** Style controls form one compact, content-width row aligned to the start. Never stretch
  them into equal columns or wrap an odd final row. When the row cannot fit, it scrolls horizontally
  with usable 44px targets and a visible, themed scrollbar.

### Discovery Filter Resets

- **Hierarchy:** `All` is the Genre reset, `Clear styles` resets only the Style multiselect, and
  `Clear all filters` resets the complete discovery state. Do not add a redundant `Clear genre`.
- **Placement:** The global reset is the final action inside the filter panel, aligned right after
  all filter groups. Grid / Spectrum remains exclusively a view switch.
- **Grid feedback:** The filter footer summarizes the artists and distinct styles represented by
  the current Grid result. Do not include BPM there or insert a second summary bar before the cards.
- **Spectrum feedback:** Keep the aggregate artists, styles, and BPM coverage summary because it
  explains the macro roster view.

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
movement. A one-pixel style-colored rule beneath the image identifies the artist's selected or
primary style without competing with the photograph. Text and actions remain high-contrast over
media.

### Booking Sections

Booking sections use bordered collapsibles, tonal headers, tabular step numbers, and clear
open/closed state. Fields group labels, controls, hints, and errors by proximity. Optional choices
should read as part of the field group they affect rather than as competing cards.

## Do's and Don'ts

### Do:

- **Do** preserve the logo as a black-and-white identity anchor in both themes.
- **Do** refine the monochrome-led system through hierarchy, spacing, imagery, and interaction
  craft.
- **Do** use the fixed cool Trance and warm Techno spectrum only to identify musical styles.
- **Do** verify every visual change in light and dark, on mobile and desktop.
- **Do** use artist media and audio as the expressive layer while interface chrome stays restrained.
- **Do** keep interaction, keyboard focus, and touch state visible.

### Don't:

- **Don't** replace the incumbent identity when the task asks for refinement.
- **Don't** use spectral colors decoratively or change their hues between light and dark themes.
- **Don't** imitate a corporate dashboard, colourful festival campaign, or luxury-agency aesthetic.
- **Don't** round every surface or use shadows to make ordinary containers feel important.
- **Don't** create extra bordered cards when proximity can express the relationship.
