import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import SocialIcon from "@/components/SocialIcons";
import { artists, getArtistBySlug } from "@/data/artists";
import type { Artist, Gig } from "@/data/artists";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return { title: "Artist Not Found" };
  const description = artist.bio.slice(0, 160);
  return {
    title: artist.name,
    description,
    alternates: { canonical: `/artist/${artist.slug}` },
    openGraph: {
      title: `${artist.name} — AAA Artists`,
      description,
      url: `/artist/${artist.slug}`,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Convert a public Spotify URL into its embed equivalent. */
function spotifyEmbedSrc(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(artist|album|track|playlist|episode|show)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  // Theme (theme=0 dark / theme=1 light) is appended client-side in <SpotifyPlayer>.
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`;
}

/** Convert a YouTube video or playlist URL into its embed equivalent. */
function youtubeEmbedSrc(url: string): string | null {
  const playlist = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (playlist) return `https://www.youtube.com/embed/videoseries?list=${playlist[1]}`;
  const video =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ?? url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (video) return `https://www.youtube.com/embed/${video[1]}`;
  return null;
}

/** A bordered box wrapping an embedded player. */
function MediaBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-40)" }}>
          {label}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}

/** A clickable card for platforms that only have a profile link (no embed). */
function MediaLinkCard({ platform, label, href }: { platform: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline group flex items-center justify-between gap-4 px-5 py-4"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <span className="flex items-center gap-3">
        <SocialIcon platform={platform} />
        <span className="text-sm font-semibold uppercase tracking-widest">{label}</span>
      </span>
      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

/** A flyer-style box for an upcoming event. Uses artwork when provided,
 *  otherwise renders a generated poster from the gig details. */
function FlyerCard({ artist, gig }: { artist: Artist; gig: Gig }) {
  const month = new Date(gig.date).toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const day = new Date(gig.date).toLocaleDateString("en-GB", { day: "numeric" });

  return (
    <div className="group flex flex-col border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
        {gig.flyer ? (
          <Image
            src={gig.flyer}
            alt={`${artist.name} at ${gig.venue}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          /* Generated poster — clean text flyer when no artwork is supplied */
          <div
            className="absolute inset-0 flex flex-col justify-between p-5 text-white"
            style={{ background: "linear-gradient(155deg, #1a1a1a 0%, #0a0a0a 55%, #000 100%)" }}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">AAA Artists</span>
              <div className="text-right leading-none">
                <p className="text-2xl font-bold">{day}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">{month}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Live</p>
              <p className="text-xl font-bold leading-tight">{artist.name}</p>
              <div className="my-3 h-px w-10 bg-white/30" />
              <p className="text-sm font-semibold leading-tight text-white/90">{gig.venue}</p>
              <p className="text-xs text-white/50">{gig.city}, {gig.country}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{gig.venue}</p>
          <p className="text-xs" style={{ color: "var(--text-40)" }}>{gig.city}, {gig.country}</p>
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-60)" }}>{formatDate(gig.date)}</p>
        </div>
        {gig.ticketLink && gig.ticketLink !== "#" ? (
          <a
            href={gig.ticketLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta inline-flex min-h-[44px] w-full items-center justify-center py-3 text-center text-xs font-semibold uppercase tracking-widest"
          >
            Get Tickets
          </a>
        ) : (
          <span
            className="inline-flex min-h-[44px] w-full items-center justify-center py-3 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ border: "1px solid var(--border)", color: "var(--text-30)" }}
          >
            Tickets soon
          </span>
        )}
      </div>
    </div>
  );
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const now = new Date().toISOString().slice(0, 10);
  const pastGigs = artist.pastGigs.filter((g) => g.date < now);
  const upcomingGigs = artist.upcomingGigs.filter((g) => g.date >= now);

  // Resolve media embeds (live players) and link-only platforms (cards).
  // Spotify: prefer an explicit spotifyEmbed, otherwise build a player from the
  // artist's Spotify profile URL (socials.spotify) so any artist with an account
  // gets a live player next to SoundCloud.
  const spotifySrc = artist.spotifyEmbed
    ? spotifyEmbedSrc(artist.spotifyEmbed)
    : artist.socials.spotify
      ? spotifyEmbedSrc(artist.socials.spotify)
      : null;
  const youtubeSrc = artist.youtubeEmbed ? youtubeEmbedSrc(artist.youtubeEmbed) : null;
  const linkCards = [
    !spotifySrc && artist.socials.spotify ? { platform: "spotify", label: "Spotify", href: artist.socials.spotify } : null,
    !youtubeSrc && artist.socials.youtube ? { platform: "youtube", label: "YouTube", href: artist.socials.youtube } : null,
  ].filter((c): c is { platform: string; label: string; href: string } => c !== null);

  const hasMedia =
    Boolean(artist.socials.soundcloud) || Boolean(spotifySrc) || Boolean(youtubeSrc) || linkCards.length > 0;
  // "Watch" only applies when there's an actual video player.
  const mediaHeading = youtubeSrc ? "Listen & Watch" : "Listen";

  // Per-artist structured data for richer search results.
  const artistLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: artist.name,
    genre: artist.genre,
    description: artist.bio,
    url: `${SITE_URL}/artist/${artist.slug}`,
    image: `${SITE_URL}${artist.image}`,
    sameAs: Object.values(artist.socials).filter(Boolean),
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artistLd) }}
      />
      {/* Artist hero */}
      <div className="relative border-b px-6 py-20" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <Link
            href="/artists"
            className="link-quiet mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Artists
          </Link>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
            {/* Artist photo */}
            <div className="mx-auto flex w-full max-w-[320px] flex-col gap-4 lg:mx-0 lg:max-w-none">
              <div className="relative aspect-square overflow-hidden border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
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
              {Object.keys(artist.socials).length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {Object.entries(artist.socials).map(([platform, url]) =>
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
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                {artist.genre}
              </p>
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>{artist.name}</h1>
              <p className="mb-6 text-lg italic" style={{ color: "var(--text-40)" }}>{artist.tagline}</p>
              <p className="max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-60)" }}>{artist.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Media — Listen & Watch */}
      {hasMedia && (
        <div className="border-t px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>{mediaHeading}</h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* SoundCloud */}
              {artist.socials.soundcloud && (
                <MediaBox label="SoundCloud">
                  {/* visual=true uses the track artwork as a (usually dark) full-bleed
                      background — SoundCloud's own dark-looking player, with artwork shown
                      correctly. It renders dark once a real track/profile URL is set; with
                      placeholder URLs it falls back to the light "can't load" state. */}
                  <iframe
                    width="100%"
                    height="352"
                    allow="autoplay"
                    loading="lazy"
                    title={`${artist.name} on SoundCloud`}
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.socials.soundcloud)}&color=%23888888&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
                    className="block w-full"
                    style={{ border: 0 }}
                  />
                </MediaBox>
              )}

              {/* Spotify — player follows the site theme (light/dark) */}
              {spotifySrc && (
                <MediaBox label="Spotify">
                  <SpotifyPlayer src={spotifySrc} title={`${artist.name} on Spotify`} />
                </MediaBox>
              )}

              {/* YouTube */}
              {youtubeSrc && (
                <MediaBox label="YouTube">
                  <div className="aspect-video w-full">
                    <iframe
                      src={youtubeSrc}
                      title={`${artist.name} on YouTube`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                      style={{ border: 0 }}
                    />
                  </div>
                </MediaBox>
              )}
            </div>

            {/* Link-only platforms */}
            {linkCards.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {linkCards.map((c) => (
                  <MediaLinkCard key={c.platform} platform={c.platform} label={c.label} href={c.href} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events — Upcoming & Past side by side so neither side looks empty */}
      <div className="border-t px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-12">
            {/* Upcoming */}
            <div className="flex flex-col">
              <h2 className="mb-8 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Upcoming Events</h2>
              {upcomingGigs.length === 0 ? (
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-5 border border-dashed px-6 py-14 text-center"
                  style={{ borderColor: "var(--border)", minHeight: "220px" }}
                >
                  <p className="max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-40)" }}>
                    No dates announced right now. {artist.name} is available for bookings.
                  </p>
                  <Link
                    href={`/contact?artist=${encodeURIComponent(artist.name)}`}
                    className="btn-cta inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-widest"
                  >
                    Book {artist.name}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {upcomingGigs.map((gig, i) => (
                    <FlyerCard key={i} artist={artist} gig={gig} />
                  ))}
                </div>
              )}
            </div>

            {/* Past */}
            <div className="flex flex-col lg:border-l lg:pl-12" style={{ borderColor: "var(--border)" }}>
              <h2 className="mb-8 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Past Dates</h2>
              {pastGigs.length === 0 ? (
                <div
                  className="flex flex-1 items-center justify-center border border-dashed px-6 py-14 text-center"
                  style={{ borderColor: "var(--border)", minHeight: "220px" }}
                >
                  <p className="text-sm" style={{ color: "var(--text-40)" }}>No past dates on record yet.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {[...pastGigs].reverse().map((gig, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-4 border p-5 opacity-60"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{gig.venue}</p>
                        <p className="text-xs" style={{ color: "var(--text-40)" }}>
                          {gig.city}, {gig.country}
                        </p>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-40)" }}>{formatDate(gig.date)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Other artists */}
      <div className="border-t px-6 py-20" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
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
