import type { Artist, Gig } from "@/data/artists";

export type NormalizedEvent = {
  id: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketLink?: string;
  ticketStatus?: Gig["ticketStatus"];
  flyer?: string;
  performers: Artist[];
};

export function isExactEventDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isUpcomingEventDate(date: string, today: string): boolean {
  return isExactEventDate(date) ? date >= today : date >= today.slice(0, 7);
}

export function formatEventDate(date: string): string {
  if (!isExactEventDate(date)) {
    return `${new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })} · exact date TBC`;
  }
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function eventDateBadge(date: string): { day: string; month: string } {
  const parsed = new Date(`${date}${isExactEventDate(date) ? "" : "-01"}T00:00:00Z`);
  return {
    day: isExactEventDate(date) ? parsed.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" }) : "TBC",
    month: parsed.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase(),
  };
}

export function normalizeUpcomingEvents(allArtists: Artist[], today = new Date().toISOString().slice(0, 10)): NormalizedEvent[] {
  const byId = new Map<string, NormalizedEvent>();
  for (const artist of allArtists) {
    for (const gig of artist.upcomingGigs) {
      if (!gig.eventId || !isUpcomingEventDate(gig.date, today)) continue;
      const existing = byId.get(gig.eventId);
      if (existing) {
        existing.performers.push(artist);
        continue;
      }
      byId.set(gig.eventId, {
        id: gig.eventId,
        date: gig.date,
        venue: gig.venue,
        city: gig.city,
        country: gig.country,
        ticketLink: gig.ticketLink,
        ticketStatus: gig.ticketStatus,
        flyer: gig.flyer,
        performers: [artist],
      });
    }
  }
  return [...byId.values()].sort((first, second) => first.date.localeCompare(second.date));
}
