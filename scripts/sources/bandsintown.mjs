// Bandsintown adapter.
//
// Purpose-built for artist tour dates, so it is the most direct source — but it
// only knows what the artist maintains on their own Bandsintown profile. Not
// every roster artist has one, which is why the id comes from the artist's
// `sources.bandsintown` and an artist without one is skipped rather than
// searched for by name.

import { fetchJson, isoDate, text } from "../lib/source-http.mjs";

export const id = "bandsintown";
export const credential = "BANDSINTOWN_APP_ID";

/** Bandsintown reports offer status as available / sold out. Anything else is
 *  left unset — the site never claims availability it has not verified. */
function ticketing(event) {
  const offer = (event.offers ?? []).find((candidate) => candidate?.type === "Tickets");
  if (!offer?.url) return {};
  const status = String(offer.status ?? "").toLowerCase();
  if (status === "available") return { ticketLink: offer.url, ticketStatus: "available" };
  if (status === "sold out") return { ticketLink: offer.url, ticketStatus: "sold-out" };
  return { ticketLink: offer.url };
}

export async function fetchEvents(artist, env, { since } = {}) {
  const appId = env[credential];
  const artistId = artist.sources?.[id];
  if (!appId || !artistId) return [];

  // `since` is the local backfill path only; the workflow asks for upcoming.
  const window = since ? `${since},2100-01-01` : "upcoming";
  const url = `https://rest.bandsintown.com/artists/${encodeURIComponent(artistId)}/events`
    + `?app_id=${encodeURIComponent(appId)}&date=${encodeURIComponent(window)}`;
  const payload = await fetchJson(id, url);
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((event) => {
    const date = isoDate(event?.datetime);
    const venue = text(event?.venue?.name);
    if (!date || !venue) return [];
    return [{
      date,
      venue,
      city: text(event?.venue?.city),
      country: text(event?.venue?.country),
      ...ticketing(event),
      source: id,
      sourceUrl: event?.url,
      flyerUrl: event?.artist?.image_url,
    }];
  });
}
