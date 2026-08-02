import assert from "node:assert/strict";
import test from "node:test";
import * as bandsintown from "../../scripts/sources/bandsintown.mjs";
import * as skiddle from "../../scripts/sources/skiddle.mjs";

/** Run an adapter against a canned payload, with no real network. */
async function withResponse(payload, run, { status = 200 } = {}) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    };
  };
  try {
    return { result: await run(), calls };
  } finally {
    globalThis.fetch = original;
  }
}

test("adapters skip when their credential is missing", async () => {
  const artist = { sources: { skiddle: "123", bandsintown: "Krevix" } };
  assert.deepEqual(await skiddle.fetchEvents(artist, {}), []);
  assert.deepEqual(await bandsintown.fetchEvents(artist, {}), []);
});

test("adapters skip an artist with no id for that source", async () => {
  // The guard against wrong-artist gigs: no id means no lookup, never a guess.
  const env = { SKIDDLE_API_KEY: "k", BANDSINTOWN_APP_ID: "a" };
  assert.deepEqual(await skiddle.fetchEvents({ sources: {} }, env), []);
  assert.deepEqual(await bandsintown.fetchEvents({ sources: { skiddle: "1" } }, env), []);
  assert.deepEqual(await skiddle.fetchEvents({}, env), []);
});

test("skiddle maps an on-sale event and passes the artist id, not a name", async () => {
  const { result, calls } = await withResponse({
    results: [{
      startdate: "2026-10-23T14:00:00Z",
      venue: { name: "The Tequila Club", town: "Amsterdam", country: "Netherlands" },
      link: "https://www.skiddle.com/e/12345",
      ticketsavailable: "1",
      largeimageurl: "https://images.skiddle.com/e/12345.jpg",
    }],
  }, () => skiddle.fetchEvents({ sources: { skiddle: "987" } }, { SKIDDLE_API_KEY: "key" }));

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    date: "2026-10-23",
    venue: "The Tequila Club",
    city: "Amsterdam",
    country: "Netherlands",
    ticketLink: "https://www.skiddle.com/e/12345",
    ticketStatus: "available",
    source: "skiddle",
    sourceUrl: "https://www.skiddle.com/e/12345",
    flyerUrl: "https://images.skiddle.com/e/12345.jpg",
  });
  assert.match(calls[0], /a=987/, "must query by artist id");
  assert.match(calls[0], /api_key=key/);
});

test("skiddle reports free entry rather than an availability claim", async () => {
  const { result } = await withResponse({
    results: [{
      startdate: "2026-10-21",
      venue: { name: "Café Restaurant De Kroon", town: "Amsterdam", country: "Netherlands" },
      link: "https://www.skiddle.com/e/1",
      entryprice: "Free",
    }],
  }, () => skiddle.fetchEvents({ sources: { skiddle: "1" } }, { SKIDDLE_API_KEY: "key" }));

  assert.equal(result[0].freeEntry, true);
  assert.equal(result[0].ticketStatus, undefined, "free entry must never carry a ticket status");
});

test("skiddle leaves availability unset when the source does not confirm it", async () => {
  const { result } = await withResponse({
    results: [{
      startdate: "2026-12-01",
      venue: { name: "Egg London", town: "London" },
      link: "https://www.skiddle.com/e/2",
    }],
  }, () => skiddle.fetchEvents({ sources: { skiddle: "1" } }, { SKIDDLE_API_KEY: "key" }));

  assert.equal(result[0].ticketLink, "https://www.skiddle.com/e/2");
  assert.equal(result[0].ticketStatus, undefined);
  assert.equal(result[0].country, "UK", "Skiddle is UK-only when it omits the country");
});

test("bandsintown maps a dated event with its ticket offer", async () => {
  const { result, calls } = await withResponse([
    {
      datetime: "2026-07-19T21:30:00",
      url: "https://www.bandsintown.com/e/1",
      venue: { name: "Tomorrowland", city: "Boom", country: "Belgium" },
      offers: [{ type: "Tickets", url: "https://www.tomorrowland.com/", status: "available" }],
    },
    { datetime: "2026-08-01T20:00:00", venue: { city: "Nowhere" } },
  ], () => bandsintown.fetchEvents({ sources: { bandsintown: "Krevix" } }, { BANDSINTOWN_APP_ID: "app" }));

  assert.equal(result.length, 1, "an event without a venue name is dropped, not guessed");
  assert.equal(result[0].date, "2026-07-19");
  assert.equal(result[0].venue, "Tomorrowland");
  assert.equal(result[0].ticketStatus, "available");
  assert.match(calls[0], /artists\/Krevix\/events/);
  assert.match(calls[0], /app_id=app/);
});

test("bandsintown maps a sold-out offer to the site's own vocabulary", async () => {
  const { result } = await withResponse([{
    datetime: "2026-09-05T20:00:00",
    venue: { name: "Egg London", city: "London", country: "UK" },
    offers: [{ type: "Tickets", url: "https://tickets.test/1", status: "sold out" }],
  }], () => bandsintown.fetchEvents({ sources: { bandsintown: "X" } }, { BANDSINTOWN_APP_ID: "app" }));

  assert.equal(result[0].ticketStatus, "sold-out");
});

test("an HTTP failure raises a SourceError naming the source", async () => {
  await assert.rejects(
    () => withResponse({}, () => skiddle.fetchEvents({ sources: { skiddle: "1" } }, { SKIDDLE_API_KEY: "k" }), { status: 503 })
      .then(({ result }) => result),
    /skiddle: HTTP 503/,
  );
});

test("an unexpected payload shape yields nothing rather than throwing", async () => {
  const { result } = await withResponse({ unexpected: true }, () =>
    skiddle.fetchEvents({ sources: { skiddle: "1" } }, { SKIDDLE_API_KEY: "k" }));
  assert.deepEqual(result, []);

  const { result: bit } = await withResponse({ nope: 1 }, () =>
    bandsintown.fetchEvents({ sources: { bandsintown: "X" } }, { BANDSINTOWN_APP_ID: "a" }));
  assert.deepEqual(bit, []);
});
