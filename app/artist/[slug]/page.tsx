import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SocialIcon from "@/components/SocialIcons";
import { artists, getArtistBySlug } from "@/data/artists";
import type { Metadata } from "next";
import { SITE_URL, createPageMetadata, sentenceDescription, serializeJsonLd } from "@/lib/site";
import { currentEventDate, isExactEventDate, isUpcomingEventDate } from "@/lib/events";
import EventsSection from "./EventsSection";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props {
  params: Promise<{ slug: string }>;
}

// Platforms accepted in `data/artists/*.yml` but not surfaced on the artist page.
// The roster's material is audio, and no artist has YouTube content worth
// featuring right now, so the URLs stay in the data (nothing is lost) while the
// page stays audio-only. Delete an entry here to bring a platform back.
const HIDDEN_SOCIAL_PLATFORMS = new Set(["youtube"]);

const EVENT_AVAILABILITY = {
  available: "https://schema.org/InStock",
  "sold-out": "https://schema.org/SoldOut",
  unavailable: "https://schema.org/Discontinued",
} as const;

export async function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return { title: "Artist Not Found" };
  const description = sentenceDescription(artist.bio);
  return createPageMetadata({
    title: artist.name,
    description,
    path: `/artist/${artist.slug}`,
    socialTitle: `${artist.name} — AAA Artists`,
    image: artist.image,
    imageAlt: artist.name,
    openGraphType: artist.artistType === "solo" ? "profile" : "website",
  });
}

/** Convert a public Spotify URL into its embed equivalent. */
function spotifyEmbedSrc(url: string): string | null {
  const m = url.match(
    /open\.spotify\.com\/(artist|album|track|playlist|episode|show)\/([A-Za-z0-9]+)/
  );
  if (!m) return null;
  // Theme (theme=0 dark / theme=1 light) is appended client-side in <SpotifyPlayer>.
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`;
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  // Build-time date, passed to EventsSection as the SSR baseline; the client
  // re-splits past/upcoming with the real current date after hydration.
  const buildNow = currentEventDate();

  // Resolve media embeds (live players) and link-only platforms (cards).
  // Spotify: prefer an explicit spotifyEmbed, otherwise build a player from the
  // artist's Spotify profile URL (socials.spotify) so any artist with an account
  // gets a live player next to SoundCloud.
  const spotifySrc = artist.spotifyEmbed
    ? spotifyEmbedSrc(artist.spotifyEmbed)
    : artist.socials.spotify
      ? spotifyEmbedSrc(artist.socials.spotify)
      : null;
  const socialLinks = Object.entries(artist.socials).filter(
    ([platform]) => !HIDDEN_SOCIAL_PLATFORMS.has(platform)
  );

  // Per-artist structured data for richer search results.
  const artistLd = {
    "@context": "https://schema.org",
    "@type": artist.artistType === "group" ? "MusicGroup" : "Person",
    name: artist.name,
    genre: artist.genre,
    description: artist.bio,
    url: `${SITE_URL}/artist/${artist.slug}`,
    image: `${SITE_URL}${artist.image}`,
    sameAs: Object.values(artist.socials).filter(Boolean),
  };

  // Event structured data lives on the artist pages (there is no /events page).
  // Month-only dates are skipped: MusicEvent.startDate must be an exact date, and
  // a guessed day would be an unverified claim. When several roster artists play
  // the same event, each page emits its own node; the shared `identifier` (the
  // gig's eventId) marks them as the same real-world event.
  const eventLd = artist.gigs
    .filter(
      (gig) => isUpcomingEventDate(gig.date, buildNow) && isExactEventDate(gig.date) && gig.eventId
    )
    .map((gig) => ({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      "@id": `${SITE_URL}/artist/${artist.slug}#event-${gig.eventId}`,
      identifier: gig.eventId,
      name: `${artist.name} at ${gig.venue}`,
      startDate: gig.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      url: `${SITE_URL}/artist/${artist.slug}#event-${gig.eventId}`,
      image: `${SITE_URL}${gig.flyer ?? artist.image}`,
      location: {
        "@type": "Place",
        name: gig.venue,
        address: {
          "@type": "PostalAddress",
          addressLocality: gig.city,
          addressCountry: gig.country,
        },
      },
      performer: {
        "@type": artist.artistType === "group" ? "MusicGroup" : "Person",
        name: artist.name,
        url: `${SITE_URL}/artist/${artist.slug}`,
      },
      // schema.org's own boolean for free events — states the fact without
      // inventing a price or a currency the flyer never gave us.
      ...(gig.freeEntry && { isAccessibleForFree: true }),
      // A ticket URL alone is not proof of availability, so offers are emitted
      // only once ticketStatus has been verified.
      ...(gig.ticketLink &&
        gig.ticketStatus && {
          offers: {
            "@type": "Offer",
            url: gig.ticketLink,
            availability: EVENT_AVAILABILITY[gig.ticketStatus],
          },
        }),
    }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(artistLd) }}
      />
      {eventLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventLd) }}
        />
      )}
      {/* Artist hero */}
      <div
        className="relative border-b px-6 py-20"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
      >
        <div className="site-shell">
          <Breadcrumbs
            className="mb-8"
            items={[
              { name: "Home", path: "/" },
              { name: "Artists", path: "/artists" },
              { name: artist.name, path: `/artist/${artist.slug}` },
            ]}
          />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
            {/* Artist photo */}
            <div className="mx-auto flex w-full max-w-[320px] flex-col gap-4 lg:mx-0 lg:max-w-none">
              <div
                className="relative aspect-square overflow-hidden border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
              >
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  style={{ filter: "var(--artist-photo-filter)" }}
                  sizes="(max-width: 1024px) 320px, 300px"
                  priority
                />
              </div>

              {/* Socials */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {socialLinks.map(([platform, url]) =>
                    url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${artist.name} on ${platform}`}
                        title={platform}
                        className="btn-outline flex h-11 w-11 items-center justify-center"
                      >
                        <SocialIcon platform={platform} />
                      </a>
                    ) : null
                  )}
                </div>
              )}

              {/* Book CTA */}
              <Link
                href={`/contact?artist=${encodeURIComponent(artist.name)}`}
                className="btn-cta w-full py-3 text-center text-sm font-semibold uppercase tracking-widest"
              >
                Book {artist.name}
              </Link>
            </div>

            {/* Info */}
            <div>
              <p
                className="mb-2 text-sm font-semibold uppercase tracking-[0.4em]"
                style={{ color: "var(--text-30)" }}
              >
                {artist.genre}
              </p>
              <h1
                className="mb-4 text-4xl font-bold tracking-tight md:text-6xl"
                style={{ color: "var(--text)" }}
              >
                {artist.name}
              </h1>
              <p className="mb-6 text-lg italic" style={{ color: "var(--text-40)" }}>
                {artist.tagline}
              </p>
              <p
                className="max-w-2xl text-base leading-relaxed"
                style={{ color: "var(--text-60)" }}
              >
                {artist.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity — upcoming dates, players and progressively disclosed history */}
      <EventsSection artist={artist} buildNow={buildNow} spotifySrc={spotifySrc} />

      {/* Other artists */}
      <div
        className="border-t px-6 py-20"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div className="site-shell">
          <h2
            className="mb-10 text-center text-sm font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--text-30)" }}
          >
            Also on the Roster
          </h2>
          {/* Centered wrap (not a grid) so an incomplete last row — e.g. 5 tiles
              in a 6-wide layout — stays centred instead of hanging left */}
          <div className="flex flex-wrap justify-center gap-4">
            {artists
              .filter((a) => a.slug !== slug)
              .map((a) => (
                <Link
                  key={a.slug}
                  href={`/artist/${a.slug}`}
                  aria-label={`View ${a.name}`}
                  className="group relative aspect-square w-[calc((100%-1rem)/2)] overflow-hidden border sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-5rem)/6)]"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
                >
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                    style={{ filter: "var(--artist-photo-filter)" }}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  {/* Hover wash */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ backgroundColor: "var(--card-wash)" }}
                  />
                  {/* Label */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 p-3"
                    style={{ background: "var(--artist-photo-gradient)" }}
                  >
                    <p className="truncate text-xs font-semibold uppercase tracking-widest text-white/80">
                      {a.genre}
                    </p>
                    <p className="truncate text-sm font-bold text-white">{a.name}</p>
                  </div>
                  {/* Hover line sweep */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ backgroundColor: "var(--card-line)" }}
                  />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
