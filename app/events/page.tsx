import Link from "next/link";
import { artists } from "@/data/artists";
import { formatEventDate, isExactEventDate, normalizeUpcomingEvents } from "@/lib/events";
import { createPageMetadata, serializeJsonLd, SITE_URL } from "@/lib/site";

const description = "See upcoming trance, progressive and techno events featuring DJs and producers represented by AAA Artists.";

export const metadata = createPageMetadata({
  title: "Upcoming Electronic Music Events",
  description,
  path: "/events",
  socialTitle: "Upcoming Electronic Music Events — AAA Artists",
  imageAlt: "AAA Artists events",
});

const availability = {
  available: "https://schema.org/InStock",
  "sold-out": "https://schema.org/SoldOut",
  unavailable: "https://schema.org/Discontinued",
} as const;

export default function EventsPage() {
  const events = normalizeUpcomingEvents(artists);
  const eventLd = events.filter((event) => isExactEventDate(event.date)).map((event) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "@id": `${SITE_URL}/events#${event.id}`,
    name: `${event.performers.map((artist) => artist.name).join(", ")} at ${event.venue}`,
    startDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/events#${event.id}`,
    image: `${SITE_URL}${event.flyer ?? event.performers[0].image}`,
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        addressCountry: event.country,
      },
    },
    performer: event.performers.map((artist) => ({
      "@type": artist.artistType === "group" ? "MusicGroup" : "Person",
      name: artist.name,
      url: `${SITE_URL}/artist/${artist.slug}`,
    })),
    ...(event.ticketLink && event.ticketStatus && {
      offers: {
        "@type": "Offer",
        url: event.ticketLink,
        availability: availability[event.ticketStatus],
      },
    }),
  }));

  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      {eventLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventLd) }} />
      )}
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Live dates</p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>Upcoming events</h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            Upcoming appearances by the AAA Artists roster. Event links provide the latest information from the organiser.
          </p>
        </header>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ backgroundColor: "var(--border)" }}>
            {events.map((event) => (
              <article id={event.id} key={event.id} className="scroll-mt-24 flex flex-col justify-between gap-8 p-6 sm:p-8" style={{ backgroundColor: "var(--surface)" }}>
                <div>
                  <time className="text-xs font-semibold uppercase tracking-widest" dateTime={event.date} style={{ color: "var(--text-40)" }}>
                    {formatEventDate(event.date)}
                  </time>
                  <h2 className="mt-3 text-2xl font-bold" style={{ color: "var(--text)" }}>{event.venue}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-60)" }}>{event.city}, {event.country}</p>
                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                    {event.performers.map((artist) => (
                      <Link key={artist.slug} href={`/artist/${artist.slug}`} className="link-quiet inline-flex min-h-[44px] items-center text-sm font-semibold uppercase tracking-widest">
                        {artist.name}
                      </Link>
                    ))}
                  </div>
                </div>
                {event.ticketLink ? (
                  <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" className="btn-cta inline-flex min-h-[44px] items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest">
                    {event.ticketStatus === "available" ? "Event tickets" : "Event details"}
                  </a>
                ) : (
                  <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-30)" }}>Details to be announced</span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}>
            <p style={{ color: "var(--text-60)" }}>No public dates are announced right now.</p>
            <Link href="/contact" className="btn-cta mt-6 inline-flex px-6 py-3 text-xs font-semibold uppercase tracking-widest">Book artists</Link>
          </div>
        )}
      </div>
    </div>
  );
}
