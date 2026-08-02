// Skiddle adapter.
//
// UK-focused and ticket-led, so it is the strongest confirmation signal: an
// event on sale through Skiddle is a real, dated booking. That also makes it the
// one source that can legitimately propose `ticketStatus`.

import { fetchJson, isoDate, text } from "../lib/source-http.mjs";

export const id = "skiddle";
export const credential = "SKIDDLE_API_KEY";

/** Skiddle exposes both an on-sale flag and a "free" entry price. Free entry is
 *  reported as `freeEntry`, never as a ticket status — the site treats those as
 *  mutually exclusive (see gen-artists validation). */
function ticketing(event) {
  const link = text(event?.link);
  const free = event?.entryprice != null && /^(free|£?0(\.00)?)$/i.test(String(event.entryprice).trim());
  if (free) return link ? { freeEntry: true, ticketLink: link } : { freeEntry: true };
  if (!link) return {};
  if (event?.tickets === true || String(event?.ticketsavailable) === "1") {
    return { ticketLink: link, ticketStatus: "available" };
  }
  if (String(event?.soldout) === "1") return { ticketLink: link, ticketStatus: "sold-out" };
  return { ticketLink: link };
}

export async function fetchEvents(artist, env, { since } = {}) {
  const apiKey = env[credential];
  const artistId = artist.sources?.[id];
  if (!apiKey || !artistId) return [];

  // Without minDate the search returns upcoming events only. `since` is the
  // local backfill path (see --since in fetch-artist-events.mjs); the scheduled
  // workflow never sets it.
  const url = "https://www.skiddle.com/api/v1/events/search/"
    + `?api_key=${encodeURIComponent(apiKey)}`
    + `&a=${encodeURIComponent(artistId)}`
    + (since ? `&minDate=${encodeURIComponent(since)}` : "")
    + "&order=date&limit=50&description=0";
  const payload = await fetchJson(id, url);
  const results = Array.isArray(payload?.results) ? payload.results : [];

  return results.flatMap((event) => {
    const date = isoDate(event?.startdate ?? event?.date);
    const venue = text(event?.venue?.name);
    if (!date || !venue) return [];
    return [{
      date,
      venue,
      city: text(event?.venue?.town ?? event?.venue?.city),
      country: text(event?.venue?.country) ?? "UK",
      ...ticketing(event),
      source: id,
      sourceUrl: text(event?.link),
      flyerUrl: text(event?.largeimageurl ?? event?.imageurl),
    }];
  });
}
