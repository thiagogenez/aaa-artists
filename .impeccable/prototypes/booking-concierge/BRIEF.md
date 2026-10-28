# Booking Concierge prototype brief

- **Mode and job:** Operate. Promoters and event organisers build one event enquiry containing a
  mixed lineup of known artists and open recommendation slots, then provide shared event, total
  budget, contact, and review information.
- **Approved direction:** Running-order lineup builder, approved comp
  `.impeccable/mocks/booking-concierge-b.png`. The lineup is the dominant object; selecting a slot
  opens its editor beside it. The current production form remains untouched.
- **Interaction:** Six steps — Artists, Event, Timings, Budget, Contact, Review. A slot may be a
  selected artist or `Help me choose`; both types can coexist. Role, style/energy, and BPM range
  can describe either type. BPM minimum and maximum use bounded selects rather than free numeric
  entry. Event date and event time can each remain unconfirmed. Confirmed event hours seed an
  illustrative role-based agenda; when time remains unconfirmed, the same agenda uses relative
  labels such as `T+1h`. Event fields use separate, consistently headed panels for date/time,
  identity, location, and audience/access rather than one continuous arbitrary grid.
  Rooms/stages is a required bounded choice of one to four stages, with an explicit unconfirmed
  option. One artist uses a direct timing editor; the spatial planner appears only when the enquiry
  contains multiple artists. Its time axis runs vertically and its stages run across columns,
  allowing the customer to move or resize sets against a customer-selected 15-, 30-, or 60-minute
  grid. Full hours use stronger ruler marks. The agenda toolbar treats event start as `T`, duration
  as `D`, shows the derived `T+D`, and offers 12- or 24-hour display. The snap control sits directly
  beside the grid rather than among the event settings. Reducing `D` never hides an existing set:
  the viewport continues to the latest set, marks the region beyond `T+D`, and reports it in the
  progressively updated agenda summary below. One clear `Add artist` action opens a stage-aware
  editor inline with the agenda instead of repeating an action on every lane or using an overlay.
  Selecting an existing block uses the same inline editing region. The `vis-timeline` instance is
  retained while these controls update its datasets and window in place, avoiding visual reloads.
  The selected block exposes `T` and `T+D` grips.
  A persistent `New stage` drop column creates a uniquely numbered stage when an artist is dropped
  there. Empty source stages are removed after the drop and the event's stage count follows the
  resulting agenda; generated names never reuse a previous stage number in the same session.
  Stages carry distinct restrained theme-aware colors, brighter in dark mode and quieter in light
  mode, while names continue to provide non-color identification. The initial suggestion has no
  reset action; subsequent operations expose only contextual Undo.
  A drop preserves the manipulated set, then moves nearby sets to the closest free position; only
  auto-suggested durations may be shortened, and every automatic adjustment offers Undo. An
  overlap remains visible only when a customised set prevents a safe solution. Total budget
  remains shared across every artist.
- **Prototype boundary:** Local, clickable, responsive light/dark demonstration with no backend,
  matching engine, persistence guarantee, or enquiry delivery. Recommendation controls capture
  intent only and must not present generated matches as available functionality. The prototype
  keeps the vertical handmade calendar as its default and exposes the earlier horizontal
  `vis-timeline` 8.5.4 comparison through `?engine=vis`. That dependency does not natively support
  the approved vertical-time/stage-column composition and is therefore evidence, not the selected
  production engine. The spike preserves the AAA styling, stage groups, 15-minute snapping,
  drag, resize, add/undo actions, dark/light themes, and the mobile agenda fallback. Its standalone
  browser build costs about 157 kB gzip plus 4 kB gzip of CSS, so production should test a bundled
  import and complete keyboard/screen-reader review before selecting the scheduler engine.
- **Responsive rule:** Desktop keeps lineup and active editor side by side. Mobile places the
  active editor directly beneath its selected slot, making their relationship explicit, while
  step actions follow the complete editor without obscuring controls. Event panels remain stacked
  in one continuous sequence at every viewport size. Timings use a spatial, draggable timeline on
  desktop and an agenda grouped by stage on mobile; both share the same exact stage, start, and
  duration controls.

## Approved composition inventory

| Ingredient | Commitment | Prototype medium |
| --- | --- | --- |
| Page ground | Near-black `#0b0b0c`; light theme uses established `#f8f8f8` | CSS token |
| Panels | Flat bodies, lifted gray headers, 1px rules, square corners | HTML/CSS |
| Primary text | Sampled `#f4f3f3`; system sans with direct weight hierarchy | HTML/CSS |
| Primary action | Sampled off-white `#f7f7f7` with black text | Button/CSS |
| Site identity | Existing AAA Artists logo; no new raster identity asset | `public/logo.png` copy |
| Progress | Six labels with a monochrome active state | Ordered navigation/CSS |
| Running order | Tabular numbers, sequence rule, selected slot | List/CSS geometry |
| Slot editor | Familiar radio-like paths plus role, energy, and BPM controls | Form HTML/JS |
| Stage agenda | Vertical time ruler, up to four stage columns, one add action, drag/resize, reflow/undo | HTML/JS |
| Agenda summary | Event window, duration, overflow count, chronological artist list | HTML/JS |
| Step actions | Equal-size Back and Next actions; no duplicate summary in the dock | Button/CSS |
| Responsive state | Two columns become one; controls retain 44px targets | CSS media query |
| Motion | One brief clipped step reveal; reduced-motion removes it | CSS animation |

No image-native content from the comp ships in the prototype. The approved comp is a north-star
reference, not a raster layer in the interface.
