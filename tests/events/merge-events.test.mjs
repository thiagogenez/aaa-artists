import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateKey,
  diffAgainstExisting,
  gigFields,
  isUpcoming,
  mergeCandidates,
  normalizeCountry,
  normalizeVenue,
  sameVenue,
  suggestEventId,
} from "../../scripts/lib/merge-events.mjs";

const TODAY = "2026-08-02";

function candidate(overrides = {}) {
  return {
    date: "2026-10-21",
    venue: "XOYO",
    city: "London",
    country: "UK",
    source: "skiddle",
    ...overrides,
  };
}

test("treats platform spellings of one venue as the same gig", () => {
  assert.equal(normalizeVenue("The Cause"), "cause");
  assert.equal(normalizeVenue("Café Restaurant De Kroon"), "cafe restaurant de kroon");
  assert.equal(normalizeVenue("XOYO"), normalizeVenue("xoyo"));
  assert.equal(
    candidateKey(candidate({ venue: "XOYO" })),
    candidateKey(candidate({ venue: "Xoyo" })),
  );
});

test("collapses the same gig reported by two sources and keeps the richer record", () => {
  const merged = mergeCandidates([
    [candidate({ source: "bandsintown" })],
    [candidate({ source: "skiddle", ticketLink: "https://skiddle.test/e/1", ticketStatus: "available" })],
  ], TODAY);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].ticketStatus, "available");
  assert.equal(merged[0].ticketLink, "https://skiddle.test/e/1");
  assert.deepEqual([...merged[0].sources].sort(), ["bandsintown", "skiddle"]);
});

test("never asserts free entry and a ticket status at once", () => {
  // gen-artists rejects a gig carrying both, so the merge must not create one.
  const merged = mergeCandidates([
    [candidate({ source: "skiddle", freeEntry: true })],
    [candidate({ source: "bandsintown", ticketLink: "https://bit.test/1", ticketStatus: "available" })],
  ], TODAY);

  assert.equal(merged.length, 1);
  assert.ok(!(merged[0].freeEntry && merged[0].ticketStatus), "free entry and ticket status are mutually exclusive");
});

test("drops past gigs and incomplete records", () => {
  const merged = mergeCandidates([[
    candidate({ date: "2025-01-01" }),
    candidate({ date: "2026-12-01", venue: "" }),
    candidate({ date: "not-a-date" }),
    candidate({ date: "2026-12-01", city: undefined }),
    candidate({ date: "2026-12-01", venue: "Egg London" }),
  ]], TODAY);

  assert.deepEqual(merged.map((entry) => entry.venue), ["Egg London"]);
});

test("keeps month-only dates upcoming for the whole month", () => {
  assert.equal(isUpcoming("2026-08", TODAY), true, "the current month is still upcoming");
  assert.equal(isUpcoming("2026-07", TODAY), false);
  assert.equal(isUpcoming("2026-08-01", TODAY), false, "an exact date yesterday is past");
});

test("proposes only genuinely new gigs and flags enrichable ones", () => {
  const existing = [
    { date: "2026-10-21", venue: "Café Restaurant De Kroon", city: "Amsterdam", country: "Netherlands" },
    { date: "2026-08-22", venue: "XOYO", city: "London", country: "UK", ticketLink: "https://skiddle.test/e/9" },
  ];
  const { additions, enrichable, unchanged } = diffAgainstExisting([
    candidate({ date: "2026-10-21", venue: "Cafe Restaurant de Kroon", city: "Amsterdam", country: "Netherlands", ticketLink: "https://skiddle.test/kroon" }),
    candidate({ date: "2026-08-22", venue: "XOYO", ticketLink: "https://skiddle.test/e/9" }),
    candidate({ date: "2026-11-14", venue: "Egg London" }),
  ], existing);

  assert.deepEqual(additions.map((entry) => entry.date), ["2026-11-14"]);
  assert.equal(enrichable.length, 1, "a known gig with a newly-found ticket link is reported, not applied");
  assert.deepEqual(enrichable[0].gained, ["ticketLink"]);
  assert.equal(unchanged.length, 1);
});

test("treats a qualified venue name as the same venue", () => {
  // Regression: the first live Skiddle run reported both of these as brand-new
  // gigs because the source qualifies venue names and the site does not.
  assert.equal(sameVenue("The Globe", "The Globe Newcastle"), true);
  assert.equal(sameVenue("Egg London", "The Egg   London"), true);
  assert.equal(sameVenue("XOYO", "Xoyo, London"), true);
  assert.equal(sameVenue("Basing House", "Egg London"), false);
  assert.equal(sameVenue("", "The Globe"), false);
});

test("does not re-propose a gig the file already has under a shorter venue name", () => {
  const { additions, enrichable } = diffAgainstExisting(
    [candidate({ date: "2026-10-31", venue: "The Globe Newcastle", city: "Newcastle Upon Tyne", country: "UK", ticketStatus: "available", ticketLink: "https://skiddle.test/e/1" })],
    [{ date: "2026-10-31", venue: "The Globe", city: "Newcastle upon Tyne", country: "UK", ticketLink: "https://skiddle.test/e/1" }],
  );
  assert.deepEqual(additions, []);
  assert.deepEqual(enrichable[0].gained, ["ticketStatus"]);
});

test("offers an exact day for a month-only gig instead of duplicating it", () => {
  // The file says "2026-08, exact day TBC"; the source knows 2026-08-07 but
  // names the site rather than the festival. Neither added nor silently merged.
  const { additions, dateConfirmations } = diffAgainstExisting(
    [candidate({ date: "2026-08-07", venue: "Abbots Ripton Cambridgeshire", city: "Huntingdon", country: "UK" })],
    [{ date: "2026-08", venue: "Timescape Festival", city: "Huntingdon", country: "UK" }],
  );
  assert.deepEqual(additions, [], "a TBC gig must not gain a duplicate");
  assert.equal(dateConfirmations.length, 1);
  assert.equal(dateConfirmations[0].existing.venue, "Timescape Festival");
  assert.equal(dateConfirmations[0].candidate.date, "2026-08-07");
});

test("maps source country spellings onto the site's own", () => {
  assert.equal(normalizeCountry("GB"), "UK", "Skiddle reports the UK as GB");
  assert.equal(normalizeCountry("United Kingdom"), "UK");
  assert.equal(normalizeCountry("Netherlands"), "Netherlands");
  assert.equal(normalizeCountry("Malta"), "Malta", "unknown countries pass through untouched");
  const [merged] = mergeCandidates([[candidate({ country: "GB" })]], TODAY);
  assert.equal(merged.country, "UK");
});

test("strips provenance before anything reaches YAML", () => {
  const gig = gigFields(candidate({
    ticketLink: "https://skiddle.test/e/1",
    sourceUrl: "https://skiddle.test/e/1",
    flyerUrl: "https://skiddle.test/img.jpg",
    sources: ["skiddle"],
  }));

  assert.deepEqual(Object.keys(gig).sort(), ["city", "country", "date", "ticketLink", "venue"]);
  for (const leaked of ["source", "sourceUrl", "flyerUrl", "sources"]) {
    assert.equal(leaked in gig, false, `${leaked} must not reach the artist YAML`);
  }
});

test("suggests a slug-safe eventId that gen-artists would accept", () => {
  const id = suggestEventId(candidate({ venue: "Café Restaurant De Kroon", date: "2026-10-21" }));
  assert.equal(id, "cafe-restaurant-de-kroon-2026-10-21");
  assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must satisfy the eventId rule in scripts/gen-artists.mjs");
});
