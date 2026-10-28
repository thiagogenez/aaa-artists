---
version: 1
slug: "app-contact-contactview-tsx"
primary_target: "app/contact/ContactView.tsx"
related_targets: [".impeccable/prototypes/booking-concierge/index.html"]
---

# Booking Concierge prototype brief

- **Mode and job:** Operate. Promoters and event organisers build one event enquiry containing a
  mixed lineup of known artists and open recommendation slots, then provide shared event, total
  budget, contact, and review information.
- **Approved direction:** Running-order lineup builder, approved comp
  `.impeccable/mocks/booking-concierge-b.png`. The lineup is the dominant object; selecting a slot
  opens its editor beside it. The current production form remains untouched.
- **Interaction:** Five steps — Artists, Event, Schedule, Contact, Review. A slot may be a selected
  artist or `Help me choose`; both types can coexist. Event details and total budget are shared,
  while schedule and optional preference data belong to a slot.
- **Prototype boundary:** Local, clickable, responsive light/dark demonstration with no backend,
  matching engine, persistence guarantee, or enquiry delivery. Recommendation controls capture
  intent only and must not present generated matches as available functionality.
- **Responsive rule:** Desktop keeps lineup and active editor side by side. Mobile preserves the
  same DOM order, placing the lineup before its editor and keeping step actions reachable without
  horizontal scrolling.

## Approved composition inventory

| Ingredient | Commitment | Prototype medium |
| --- | --- | --- |
| Page ground | Near-black `#0b0b0c`; light theme uses established `#f8f8f8` | CSS token |
| Panels | Flat `#0c0c0c`, one-pixel `#373737` rules, square corners | Semantic HTML/CSS |
| Primary text | Sampled `#f4f3f3`; system sans with direct weight hierarchy | HTML/CSS |
| Primary action | Sampled off-white `#f7f7f7` with black text | Button/CSS |
| Site identity | Existing AAA Artists logo; no new raster identity asset | `public/logo.png` copy |
| Progress | Five sequential labels with active underline | Ordered navigation/CSS |
| Running order | Tabular numbers, vertical sequence rule, selected slot outline | List/CSS geometry |
| Slot editor | Familiar radio-like path choices and native form controls | Form HTML/JS |
| Responsive state | Two columns become one; controls retain 44px targets | CSS media query |
| Motion | One brief clipped step reveal; reduced-motion removes it | CSS animation |

No image-native content from the comp ships in the prototype. The approved comp is a north-star
reference, not a raster layer in the interface.
