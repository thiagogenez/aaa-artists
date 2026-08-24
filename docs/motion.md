# Motion, skeletons and loading states

The motion system, and — just as important — where motion was deliberately withheld.
Added for issue #40.

Built with the vendored `design-motion-principles` skill
([kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles),
MIT, pinned in `skills-lock.json`).

## The register

This is a marketing and booking site, which maps to **Jakub Krehel primary** (production
polish: 200–500ms, subtle, no bounce) with **Emil Kowalski applied selectively** to anything
repeated — navigation and form controls stay under 200ms.

Tokens live once, in `app/globals.css`:

| Token | Value | Used for |
| --- | --- | --- |
| `--motion-fast` | 140ms | Repeated interactions: nav, buttons, toggles |
| `--motion-base` | 260ms | The default: panels, reveals, state changes |
| `--motion-slow` | 420ms | Something arriving for the first time |
| `--motion-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things arriving decelerate into place |
| `--motion-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving get out of the way |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Elements changing while staying visible |

Built-in `ease` is deliberately unused — it has no strength. Rules that hold everywhere:
**only `transform` / `opacity` / `filter` are animated**, an exit is always subtler than its
enter, and nothing loops except an indicator that stops when the work stops.

## What animates, and why

| Where | Motion | Purpose |
| --- | --- | --- |
| Third-party players (`ThirdPartyConsent`) | Labelled skeleton until the frame loads | The only real wait on an artist page. Previously an empty box |
| Artist photographs (`ArtistCard`) | Skeleton behind, fade + deblur on decode | The card had a grey square until the image painted |
| Below-the-fold artist cards | `loading="lazy"` | The first card stays priority-loaded |
| Artist grid | Scroll reveal, `animation-timeline: view()` | Orientation while scrolling a long roster |
| Mobile menu (`Navbar`) | Enter 260ms, exit 140ms and half the distance | A panel that appears out of nothing is disorienting |
| Consent banner | Rises from its docked edge, 420ms, once | It is asking for something; it should register |
| Booking submit | `aria-busy` + indeterminate progress bar | The longest wait on the site: Turnstile → Worker → Brevo |
| Booking confirmation | Panel enter | It replaces the entire form |
| Past-shows modal (`PastShowsDialog`) | Panel scale + translate, backdrop fade, both ways | A modal that appears in one frame reads as a page swap, not an overlay |
| Between screens | Cross-document view transitions | Every navigation is a real document load; this is what makes them feel like one site |
| Every interactive element | Press feedback, 1.5% scale in 100ms | A phone has no hover: without this a tap has no feedback until the next screen paints |
| Form sections (`Collapsible`) | Panel enter on open, instant close | Opening reveals new content; closing is the visitor removing it |
| City suggestions | Three skeleton rows while the country dataset loads | It is a real fetch, and the field used to jump when results arrived |
| Media provider switch | Keyed panel enter | Without a key the new player replaced the old one in the same frame, reading as a flicker |

## What deliberately does NOT animate

The instruction that started this work was "skeleton, lazy loading and smooth animation on
every element". That was not implemented as written, because the skill's own doctrine argues
against it:

> **The Frequency Gate** — "Frequent (100s/day) → No animation or instant transition.
> Keyboard-initiated → Never animate."
> **The Golden Rule** — "The best animation is that which goes unnoticed."

So:

- **No skeletons on page copy, headings, artist bios, gig lists, or the footer.** This is a
  static export: that content is already in the HTML the browser received. A skeleton in front
  of it would be a deliberate delay, dressed up as responsiveness.
- **No JavaScript page-transition machinery.** Screens do transition, but through native
  cross-document view transitions: a 120ms fade out, a 260ms fade in, and the navbar and footer
  named so they stay still rather than cross-fading with the content behind them. Anything more
  elaborate would slide furniture that never moved. Browsers without support navigate normally.
- **No animated hero.** The home hero's grid and crosshair are anchored to the logo and must
  stay resize-proof (`CLAUDE.md`, "Design system"). Motion there would fight the alignment.
- **No looping attention motion.** No pulsing dots, breathing CTAs or glowing rings. The only
  loops are the skeleton sweep and the submit progress bar, and both stop when the thing they
  describe stops.
- **No motion library.** Everything is CSS. Adding Framer Motion for this would ship a runtime
  to a static site to do what six keyframes already do.

## Reduced motion

`app/globals.css` already collapsed animations under `prefers-reduced-motion: reduce`, and
everything added here sits inside that. Two extra guarantees:

- The scroll reveal is wrapped in `@media (prefers-reduced-motion: no-preference)` **and**
  `@supports (animation-timeline: view())`. Content is visible by default; the animation is
  purely additive. A browser without support shows a finished page, not an empty one.
- `tests/e2e/motion.spec.ts` runs the mobile menu and the artist grid with
  `reducedMotion: "reduce"` and asserts the content ends up visible and the menu still closes.

## Traps worth knowing about

**Tailwind layer order.** The motion classes live in `@layer components`. Outside a layer they
have the same specificity as Tailwind utilities but come later in the file, so `.progress-track
{ position: relative }` silently beat `absolute` at the call site and the progress bar rendered
0px wide and inline. If a utility ever "stops working" on one of these elements, this is why.

**Fades that can hide content.** `.image-fade` starts at `opacity: 0` and is cleared by a load
handler, which fails in two ways: a cached image can finish before hydration (handled by
checking `complete` on the ref), and scripting can be off entirely (handled by
`@media (scripting: none)`). Any future fade-in needs both escape hatches, or it will hide the
thing it was meant to reveal.

**Token names collide with Tailwind's.** The easing tokens are `--motion-ease-out`,
`--motion-ease-in` and `--motion-ease-standard`, not the obvious `--ease-*`. Tailwind v4 ships
its own `--ease-in` / `--ease-out` / `--ease-in-out` theme tokens, and the first version of this
system used those names: Tailwind's values won, so every "custom" enter curve was silently
Tailwind's generic `cubic-bezier(0, 0, 0.2, 1)`. It compiled, it looked plausible, and it was
wrong. Never name a token something Tailwind already defines.

**Animating a dialog changes what a test measures.** `tests/e2e/site.spec.ts` asserts that the
past-shows modal is centred, and it began failing the moment the panel animated into place —
it was measuring a position the dialog was still travelling through. The fix is to await
`getAnimations()` before measuring, not to remove the motion. Any test that measures the
geometry of an animated element needs the same wait.

## The two systems that keep this consistent

1. **Every duration and easing in the codebase resolves to a token.** There is no
   `duration-300` or `0.2s ease` left in `app/` or `components/`; the three ad-hoc scales that
   existed (150ms, 200ms, 300ms) were snapped onto `--motion-fast` and `--motion-base`.
2. **Tailwind's own defaults point at the tokens.** `@theme` sets
   `--default-transition-timing-function` and `--default-transition-duration`, so a bare
   `transition-colors` anywhere in the codebase matches the hand-written motion without the
   author having to know that.

`transition-all` was removed everywhere (20 uses). It animates layout properties, which is both
a performance problem and the reason hover states on the About and home cards felt slightly
heavy: they were transitioning geometry alongside colour.
