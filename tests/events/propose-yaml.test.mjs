import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as yaml from "js-yaml";
import {
  formatGigBlock,
  insertGigs,
  insertGigsChecked,
  locateGigs,
} from "../../scripts/lib/propose-yaml.mjs";

/** A file shaped like the real ones: comments above items, mixed quote styles,
 *  a trailing comment inside an entry. */
const SAMPLE = `name: Test Artist
slug: test-artist
socials:
  soundcloud: https://soundcloud.com/test # real account (test2 is someone else)
# Verified gigs only. Oldest first.
gigs:
  - date: '2025-08-24'
    venue: Ministry of Sound
    city: London
    country: UK
  # Tomorrowland debut — Weekend 2
  - date: "2026-07-24"
    eventId: tomorrowland-2026
    venue: Tomorrowland
    city: Boom
    country: Belgium
    flyer: /flyers/tl.webp # official poster
  - date: "2026-11-30"
    eventId: globe-2026
    venue: The Globe
    city: Newcastle upon Tyne
    country: UK
`;

const candidate = (overrides = {}) => ({
  date: "2026-09-12",
  venue: "Egg London",
  city: "London",
  country: "UK",
  source: "skiddle",
  ...overrides,
});

test("finds the gigs list and every entry in it", () => {
  const block = locateGigs(SAMPLE.split("\n"));
  assert.equal(block.items.length, 3);
  assert.deepEqual(
    block.items.map((item) => item.date),
    ["2025-08-24", "2026-07-24", "2026-11-30"]
  );
});

test("keeps every comment in the file", () => {
  const { text } = insertGigsChecked(SAMPLE, [candidate()], {
    comment: () => "proposed from skiddle",
  });
  for (const comment of [
    "# real account (test2 is someone else)",
    "# Verified gigs only. Oldest first.",
    "# Tomorrowland debut — Weekend 2",
    "# official poster",
  ]) {
    assert.ok(text.includes(comment), `lost comment: ${comment}`);
  }
});

test("inserts in date order and above the following entry's comment", () => {
  const { text } = insertGigsChecked(SAMPLE, [candidate({ date: "2026-01-15" })]);
  const doc = yaml.load(text);
  assert.deepEqual(
    doc.gigs.map((gig) => String(gig.date)),
    ["2025-08-24", "2026-01-15", "2026-07-24", "2026-11-30"]
  );
  // The Tomorrowland comment must still sit directly above the Tomorrowland gig.
  const lines = text.split("\n");
  const commentAt = lines.findIndex((line) => line.includes("Tomorrowland debut"));
  assert.ok(lines[commentAt + 1].includes("2026-07-24"), "a comment was orphaned from its gig");
});

test("appends when the new gig is the latest", () => {
  const { text } = insertGigsChecked(SAMPLE, [candidate({ date: "2027-03-01" })]);
  const dates = yaml.load(text).gigs.map((gig) => String(gig.date));
  assert.equal(dates.at(-1), "2027-03-01");
});

test("applies several gigs at once without disturbing the order", () => {
  const { text, applied } = insertGigsChecked(SAMPLE, [
    candidate({ date: "2026-12-24", venue: "Egg London" }),
    candidate({ date: "2026-02-02", venue: "Basing House" }),
    candidate({ date: "2026-08-15", venue: "Fabric" }),
  ]);
  assert.equal(applied.length, 3);
  assert.deepEqual(
    yaml.load(text).gigs.map((gig) => String(gig.date)),
    ["2025-08-24", "2026-02-02", "2026-07-24", "2026-08-15", "2026-11-30", "2026-12-24"]
  );
});

test("leaves every pre-existing gig byte-identical", () => {
  const before = yaml.load(SAMPLE).gigs;
  const { text } = insertGigsChecked(SAMPLE, [candidate()]);
  const after = yaml.load(text).gigs;
  for (const original of before) {
    const match = after.find((gig) => String(gig.date) === String(original.date));
    assert.deepEqual(match, original, `gig ${original.date} was altered`);
  }
});

test("quotes values that would otherwise change meaning in YAML", () => {
  const lines = formatGigBlock(candidate({ venue: "Bar: 22", city: "No", country: "UK" }), {
    eventId: "x-1",
  });
  const parsed = yaml.load(lines.map((line) => line.replace(/^ {2}/, "")).join("\n"))[0];
  assert.equal(parsed.venue, "Bar: 22");
  assert.equal(parsed.city, "No", "the YAML 1.1 boolean 'No' must survive as a string");
  assert.equal(typeof parsed.date, "string");
});

test("backfilled past gigs carry no eventId and no ticketing fields", () => {
  // Nobody can buy a ticket to a gig that has happened, PastDates never renders
  // one, and the hand-written history carries none — so a backfill must not
  // introduce a stale "ticketStatus: available" on a past date.
  const { text, applied } = insertGigsChecked(
    SAMPLE,
    [
      candidate({
        date: "2025-09-01",
        ticketLink: "https://skiddle.test/e/1",
        ticketStatus: "available",
      }),
    ],
    { today: "2026-08-02" }
  );
  assert.equal(applied[0].eventId, null, "history needs no eventId");
  const gig = yaml.load(text).gigs.find((entry) => String(entry.date) === "2025-09-01");
  assert.equal(gig.venue, "Egg London");
  assert.equal(gig.ticketLink, undefined);
  assert.equal(gig.ticketStatus, undefined);
});

test("upcoming gigs keep their ticketing fields and gain an eventId", () => {
  const { text, applied } = insertGigsChecked(
    SAMPLE,
    [
      candidate({
        date: "2026-12-01",
        ticketLink: "https://skiddle.test/e/2",
        ticketStatus: "available",
      }),
    ],
    { today: "2026-08-02" }
  );
  assert.equal(applied[0].eventId, "egg-london-2026-12-01");
  const gig = yaml.load(text).gigs.find((entry) => String(entry.date) === "2026-12-01");
  assert.equal(gig.ticketLink, "https://skiddle.test/e/2");
  assert.equal(gig.ticketStatus, "available");
});

test("writes freeEntry instead of a ticket status when entry is free", () => {
  const lines = formatGigBlock(
    candidate({ freeEntry: true, ticketLink: "https://skiddle.test/e/1" }),
    { eventId: "x-1" }
  );
  const block = lines.join("\n");
  assert.match(block, /freeEntry: true/);
  assert.doesNotMatch(block, /ticketStatus/);
});

test("drops a malformed candidate instead of writing it", () => {
  const { text, applied, skipped } = insertGigsChecked(SAMPLE, [
    candidate({ date: "not-a-date" }),
    candidate({ venue: "" }),
  ]);
  assert.equal(applied.length, 0);
  assert.equal(skipped.length, 2);
  assert.equal(text, SAMPLE, "a rejected candidate must leave the file untouched");
});

test("refuses to touch a file whose gigs are already out of order", () => {
  // Something is wrong with that file by hand; the automation must not layer
  // its own edit on top and make the mess harder to read.
  const unordered = `name: Muddled
gigs:
  - date: "2026-11-30"
    venue: The Globe
    city: Newcastle upon Tyne
    country: UK
  - date: "2026-01-05"
    venue: Egg London
    city: London
    country: UK
`;
  assert.throws(
    () => insertGigsChecked(unordered, [candidate({ date: "2026-06-01" })]),
    /oldest-to-newest/
  );
});

test("reports rather than throws when a file has no gigs list", () => {
  const { applied, skipped } = insertGigs("name: No Gigs\n", [candidate()]);
  assert.equal(applied.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].reason, /no gigs/);
});

test("round-trips against a real artist file", () => {
  const real = readFileSync("data/artists/04-frogr.yml", "utf8");
  const { text, applied } = insertGigsChecked(real, [
    candidate({ date: "2026-09-19", venue: "Egg London" }),
  ]);
  assert.equal(applied.length, 1);
  const doc = yaml.load(text);
  assert.equal(doc.gigs.length, yaml.load(real).gigs.length + 1);
  const dates = doc.gigs.map((gig) => String(gig.date));
  assert.deepEqual([...dates].sort(), dates, "real file must stay ordered oldest to newest");
});
