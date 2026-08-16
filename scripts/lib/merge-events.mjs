// Combine candidate gigs from several source adapters into one deduplicated
// list per artist.
//
// A "candidate" is the site's own gig shape plus provenance metadata:
//
//   { date, venue, city, country, ticketLink?, ticketStatus?, freeEntry?,
//     source, sourceUrl?, flyerUrl? }
//
// The provenance fields exist for the pull-request body only — `gigFields()`
// strips them before anything is written to YAML.

/** Fields that belong in data/artists/*.yml. Anything else is provenance. */
const GIG_FIELDS = ["date", "venue", "city", "country", "ticketLink", "ticketStatus", "freeEntry"];

const DATE_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;

/** Venue names vary between platforms ("XOYO" / "Xoyo London" / "The Cause").
 *  Normalizing lets the same gig from two sources collapse into one. */
export function normalizeVenue(venue) {
  return String(venue ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: "Café" and "Cafe" are one venue
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Two records describe the same gig when they share a date and a venue. */
export function candidateKey(candidate) {
  return `${candidate.date}|${normalizeVenue(candidate.venue)}`;
}

/** Do two venue names refer to the same place?
 *
 *  Sources qualify venue names differently — Skiddle returns "The Globe
 *  Newcastle" where the site says "The Globe", and "The Egg   London" for "Egg
 *  London". Exact string equality reported both as brand-new gigs on the first
 *  live run. One name's words being a subset of the other's is the signal; the
 *  date has to match exactly as well, so this cannot merge unrelated venues. */
export function sameVenue(a, b) {
  const left = new Set(normalizeVenue(a).split(" ").filter(Boolean));
  const right = new Set(normalizeVenue(b).split(" ").filter(Boolean));
  if (left.size === 0 || right.size === 0) return false;
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  return [...small].every((word) => large.has(word));
}

/** Country spellings used by the sources, mapped to the site's own. Skiddle
 *  reports the UK as "GB"; mixing both in the YAML would be untidy rather than
 *  wrong, so only unambiguous aliases are translated. */
const COUNTRY_ALIASES = new Map([
  ["gb", "UK"],
  ["united kingdom", "UK"],
  ["gbr", "UK"],
  ["nl", "Netherlands"],
  ["be", "Belgium"],
  ["mt", "Malta"],
  ["es", "Spain"],
  ["de", "Germany"],
  ["pt", "Portugal"],
]);

export function normalizeCountry(country) {
  const text = String(country ?? "").trim();
  return COUNTRY_ALIASES.get(text.toLowerCase()) ?? text;
}

export function isUsableCandidate(candidate) {
  return Boolean(
    candidate &&
      DATE_PATTERN.test(String(candidate.date ?? "")) &&
      String(candidate.venue ?? "").trim() &&
      String(candidate.city ?? "").trim() &&
      String(candidate.country ?? "").trim()
  );
}

/** Today or later, comparing month-only dates by month. Mirrors
 *  isUpcomingEventDate in lib/events.ts. */
export function isUpcoming(date, today) {
  return date.length === 7 ? date >= today.slice(0, 7) : date >= today;
}

/** Which of two records for the same gig to keep.
 *
 *  A record carrying a ticket link is more useful to a reviewer than a bare
 *  listing, and a verified ticket status more useful still — but neither is
 *  invented here, both come from the source. */
function score(candidate) {
  return (
    (candidate.ticketStatus ? 4 : 0) +
    (candidate.ticketLink ? 2 : 0) +
    (candidate.freeEntry ? 1 : 0)
  );
}

/** Merge two records of the same gig, preferring the richer one but keeping any
 *  detail the other uniquely supplied. */
function combine(existing, next) {
  const [primary, secondary] = score(next) > score(existing) ? [next, existing] : [existing, next];
  const merged = { ...secondary, ...primary };
  // A source reporting free entry and another reporting a ticket status
  // contradict each other; drop the status rather than assert both.
  if (merged.freeEntry && merged.ticketStatus) delete merged.ticketStatus;
  merged.sources = [
    ...new Set([...(existing.sources ?? [existing.source]), ...(next.sources ?? [next.source])]),
  ].filter(Boolean);
  return merged;
}

/** Deduplicate candidates from every adapter into one date-ordered list. */
export function mergeCandidates(lists, today = new Date().toISOString().slice(0, 10)) {
  const byKey = new Map();
  for (const candidate of lists.flat()) {
    if (!isUsableCandidate(candidate) || !isUpcoming(candidate.date, today)) continue;
    const key = candidateKey(candidate);
    const seeded = {
      ...candidate,
      country: normalizeCountry(candidate.country),
      sources: candidate.sources ?? [candidate.source].filter(Boolean),
    };
    const existing = byKey.get(key);
    byKey.set(key, existing ? combine(existing, seeded) : seeded);
  }
  return [...byKey.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || normalizeVenue(a.venue).localeCompare(normalizeVenue(b.venue))
  );
}

/** Split merged candidates against the gigs already in the artist's YAML.
 *
 *  Nothing existing is ever rewritten. A candidate matching a known gig is
 *  reported — as `unchanged`, or as `enrichable` when the source knows a detail
 *  the file does not — so a human decides, per the automation's design. */
export function diffAgainstExisting(candidates, existingGigs) {
  const known = (existingGigs ?? []).filter((gig) => gig?.date && gig?.venue);

  const additions = [];
  const enrichable = [];
  const unchanged = [];
  const dateConfirmations = [];
  const conflicts = [];

  for (const candidate of candidates) {
    const match = known.find(
      (gig) => String(gig.date) === candidate.date && sameVenue(gig.venue, candidate.venue)
    );

    if (!match) {
      // A month-only gig means "this month, exact day TBC". A source reporting an
      // exact day inside that month is very likely the same booking, but the
      // venue may be named quite differently (a festival's name versus its site),
      // so this is surfaced for a person rather than merged or added.
      const tbc = known.find(
        (gig) => String(gig.date).length === 7 && candidate.date.startsWith(`${gig.date}-`)
      );
      if (tbc) {
        dateConfirmations.push({ candidate, existing: tbc });
        continue;
      }
      // Same date, different venue. An artist can play two rooms in a night, but
      // far more often this is one booking recorded under a different venue name
      // — a moved event, or the promoter's name versus the room's. Adding it
      // blind would silently duplicate a gig, so a person decides.
      const clash = known.find((gig) => String(gig.date) === candidate.date);
      if (clash) conflicts.push({ candidate, existing: clash });
      else additions.push(candidate);
      continue;
    }
    const gained = [];
    if (candidate.ticketLink && !match.ticketLink) gained.push("ticketLink");
    if (candidate.ticketStatus && !match.ticketStatus) gained.push("ticketStatus");
    if (candidate.freeEntry && !match.freeEntry) gained.push("freeEntry");
    if (gained.length > 0) enrichable.push({ candidate, existing: match, gained });
    else unchanged.push(candidate);
  }

  return { additions, enrichable, unchanged, dateConfirmations, conflicts };
}

/** Strip provenance so only real gig fields reach the YAML. */
export function gigFields(candidate) {
  const gig = {};
  for (const field of GIG_FIELDS) {
    if (candidate[field] !== undefined) gig[field] = candidate[field];
  }
  return gig;
}

/** A stable, readable eventId suggestion. Always reviewed by a human before
 *  merge: artists sharing a line-up must reuse one id, which this cannot know. */
export function suggestEventId(candidate) {
  const venue = normalizeVenue(candidate.venue).replace(/\s+/g, "-");
  return `${venue}-${candidate.date}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}
