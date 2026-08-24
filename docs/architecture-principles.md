# Architecture principles

Five rules, and the inventory that makes the last one enforceable. Written for issue #57.

These are review criteria, not tooling. Some are partly machine-checked (`npm run arch`,
`npm run knip`); the rest are what a reviewer — human or agent — is expected to apply.

## 1. Avoid overengineering

The test: **could this have been a smaller thing that already exists?**

This repository has a strong bias that has served it well and should be preserved:

- No database. Artist content is seven YAML files.
- No CMS. The build script validates the YAML and generates JSON.
- No state library. React state, plus `localStorage` for the one persisted choice.
- No animation library. The whole motion system is six keyframes of CSS.
- No component library. The design system is CSS variables and Tailwind.

Every one of those is a dependency that was **not** added, and the site is a booking front door
for a seven-artist roster. Before adding a runtime dependency, say in the pull request what it
does that the platform does not, and what its weight costs — `npm run check:performance` will
tell you the second part in kilobytes.

Recent applications of this rule, so the reasoning is not lost:

- Motion was built in CSS rather than with Framer Motion: it would have shipped a runtime to a
  static site to do what keyframes already do.
- Screen transitions use native cross-document view transitions rather than a router.
- Observability is Cloudflare's own Workers Logs, not a vendor SDK.

## 2. Avoid absurd bottlenecks

Know where the site can actually be slow, and do not add to those places casually.

| Real bottleneck | Why | Guard |
| --- | --- | --- |
| `/contact` JavaScript | 225 KB gzipped, the heaviest route, mostly `intl-tel-input` | Budget in `performance-budget.json`; reduction tracked on #58 |
| Third-party media frames | SoundCloud and Spotify answer when they answer | Consent gate, `loading="lazy"`, skeleton, 6s fallback |
| Event flyer artwork | 1.6 MB and growing with every gig added | Asset budget in `performance-budget.json` |
| The Worker's Brevo call | One outbound HTTP request in the request path | 10s `AbortSignal.timeout`, rate limits, idempotency key |
| City suggestion datasets | One JSON fetch per country, some are large | Cached per country, binary search over sorted data, skeleton while loading |

Things that look like bottlenecks and are not: the artist YAML (built at build time, never read
at runtime) and the static export itself (served from Cloudflare's edge).

## 3. Componentise from the start

A page file should read as a list of components, not as a wall of markup. Extract when a piece
is used twice, or when it owns its own state.

The honest exception in this repository is `app/contact/ContactView.tsx`, which is over 2,000
lines. It is one cohesive form with a lot of interdependent state and it works, but it is the
one file where "componentise from the start" was not followed, and it is the hardest file to
change safely. Do not add to it without extracting something first.

## 4. DRY with judgement, not prematurely

Two occurrences are a coincidence. Three are a pattern.

The rule that matters more here is the inverse: **a duplicate that drifts is worse than a
duplicate that is obvious.** `data/formOptions.ts` used to re-declare `CAPACITY_RANGES` and
`BUDGET_RANGES`, which the Worker validates against from `config/booking.js`. Nothing read the
copies, and editing them would have produced form values the Worker rejects. Knip found it; it
is deleted. That is the shape of duplication worth removing — shared meaning across a boundary,
not two functions that happen to look alike today.

Where the boundary is: `config/` is the only code both the browser and the Worker may import.
`npm run arch` enforces it for TypeScript, ESLint enforces it for the Worker's JavaScript.

## 5. Do not rebuild what already exists

**Read this list before writing a new component.** This is the rule most often broken by an
agent starting a fresh session, and it has already happened once in this repository:
`ThirdPartyEmbed` and `SpotifyPlayer` each built their own iframe, so a loading skeleton added
to one did not appear in the other. The fix was to move the shared behaviour into
`ThirdPartyConsent`, the gate both already passed through.

### Components

| Component | Use it for | Do not |
| --- | --- | --- |
| `ThirdPartyConsent` | **Any** third-party iframe. Owns the consent gate, the loading skeleton, and the load-failure fallback | Render a provider iframe without it |
| `ThirdPartyEmbed` | A consented iframe you supply the `src` for | Duplicate its structure for a new provider |
| `SpotifyPlayer` | The Spotify embed, theme-aware | Build a second Spotify frame |
| `MediaConsentBanner` | The one-time accept/decline prompt | Add a second consent prompt of any kind |
| `MediaConsentSettings` | A control that reopens or changes the media choice | Write bespoke consent-reset UI |
| `useMediaConsent` | Reading the current choice | Read `localStorage` directly |
| `Navbar`, `Footer` | Site chrome, from `config/navigation.ts` | Hard-code navigation links in a page |
| `Breadcrumbs` | A nested page's trail, emits matching JSON-LD | Hand-write breadcrumb markup or schema |
| `SocialIcons` | Any social platform icon | Paste an SVG inline |
| `ThemeProvider` / `useTheme` | Anything that must follow light/dark | Read the `html` class yourself |
| `ArtistCard` | An artist tile in a grid | Build a second artist card |
| `PastShowsDialog` | The past-shows modal | Add a second modal pattern without reusing its `dialog-panel` motion |

### Shared modules

| Module | Owns |
| --- | --- |
| `config/booking.js` | Enquiry limits, enums, validation constants. **Shared with the Worker** |
| `config/site.js` | Canonical origin, public identity, contact addresses |
| `config/navigation.ts` | Header and footer link definitions |
| `config/privacy.js` | Verified controller facts and the privacy release gate |
| `data/artists.ts` | Artist types and lookups. Never import the generated JSON directly |
| `lib/events.ts` | Gig date formatting, upcoming/past logic, date badges |
| `lib/media-consent.ts` | Reading and writing the consent choice, and its storage key |
| `lib/site.ts` | Page metadata helpers, absolute URLs |
| `worker/observability.js` | Structured logging. Never `console.log` in the Worker directly |

### CSS you should reuse rather than reinvent

`.skeleton`, `.media-frame-enter`, `.image-fade`, `.panel-enter`, `.panel-exit`, `.banner-enter`,
`.reveal`, `.progress-track`, `.dialog-panel`, `.pressable`, `.btn-cta`, `.btn-outline`,
`.btn-outline-photo`, `.link-quiet`, `.site-shell`. Durations and easings come from the
`--motion-*` tokens; see `docs/motion.md`.

**If you add a reusable component or shared module, add it to this file in the same pull
request.** A stale inventory is worse than none, because it is trusted.
