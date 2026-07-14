import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { artists } from "@/data/artists";
import { createPageMetadata } from "@/lib/site";

const description = "See upcoming trance, progressive and techno events featuring DJs and producers represented by AAA Artists.";

export const metadata = createPageMetadata({
  title: "Upcoming Electronic Music Events",
  description,
  path: "/events",
  socialTitle: "Upcoming Electronic Music Events — AAA Artists",
  imageAlt: "AAA Artists events",
});

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function EventsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const events = artists
    .flatMap((artist) => artist.upcomingGigs.map((gig) => ({ artist, gig })))
    .filter(({ gig }) => gig.date >= today)
    .sort((first, second) => first.gig.date.localeCompare(second.gig.date));

  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Events", path: "/events" }]} />
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            Live dates
          </p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            Upcoming events
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            Upcoming appearances by the AAA Artists roster. Follow the ticket link for the latest event information.
          </p>
        </header>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ backgroundColor: "var(--border)" }}>
            {events.map(({ artist, gig }) => (
              <article
                key={`${artist.slug}-${gig.date}-${gig.venue}`}
                className="flex flex-col justify-between gap-8 p-6 sm:p-8"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div>
                  <time className="text-xs font-semibold uppercase tracking-widest" dateTime={gig.date} style={{ color: "var(--text-40)" }}>
                    {formatDate(gig.date)}
                  </time>
                  <h2 className="mt-3 text-2xl font-bold" style={{ color: "var(--text)" }}>{gig.venue}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-60)" }}>{gig.city}, {gig.country}</p>
                  <Link href={`/artist/${artist.slug}`} className="link-quiet mt-5 inline-flex text-sm font-semibold uppercase tracking-widest">
                    {artist.name}
                  </Link>
                </div>
                {gig.ticketLink ? (
                  <a
                    href={gig.ticketLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta inline-flex min-h-[44px] items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                  >
                    Event tickets
                  </a>
                ) : (
                  <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-30)" }}>Tickets to be announced</span>
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
