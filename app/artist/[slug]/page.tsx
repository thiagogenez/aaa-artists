import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { artists, getArtistBySlug } from "@/data/artists";
import type { Artist, Gig } from "@/data/artists";
import type { Metadata } from "next";

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
  return {
    title: `${artist.name} — AAA Artists`,
    description: artist.bio.slice(0, 160),
  };
}

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    soundcloud: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M1.175 12.225c-.015 0-.023.015-.023.03l-.315 2.007.315 1.992c0 .015.008.03.023.03s.023-.015.023-.03l.353-1.992-.353-2.007c0-.015-.008-.03-.023-.03zm.956-.63c-.023 0-.038.015-.038.038l-.284 2.638.284 2.568c0 .023.015.038.038.038s.038-.015.038-.038l.322-2.568-.322-2.638c0-.023-.015-.038-.038-.038zm.957-.345c-.03 0-.053.023-.053.053l-.253 2.983.253 2.86c0 .03.023.053.053.053s.053-.023.053-.053l.284-2.86-.284-2.983c0-.03-.023-.053-.053-.053zm.957-.24c-.038 0-.068.03-.068.068l-.222 3.223.222 3.12c0 .038.03.068.068.068s.068-.03.068-.068l.253-3.12-.253-3.223c0-.038-.03-.068-.068-.068zm1.027 0c-.045 0-.083.038-.083.083l-.192 3.14.192 3.12c0 .045.038.083.083.083s.083-.038.083-.083l.222-3.12-.222-3.14c0-.045-.038-.083-.083-.083zm1.027-.48c-.053 0-.098.045-.098.098l-.162 3.62.162 3.525c0 .053.045.098.098.098s.098-.045.098-.098l.185-3.525-.185-3.62c0-.053-.045-.098-.098-.098zm1.042-.24c-.06 0-.113.053-.113.113l-.13 3.86.13 3.51c0 .06.053.113.113.113s.113-.053.113-.113l.148-3.51-.148-3.86c0-.06-.053-.113-.113-.113zm1.042.075c-.068 0-.128.06-.128.128l-.1 3.785.1 3.465c0 .068.06.128.128.128s.128-.06.128-.128l.115-3.465-.115-3.785c0-.068-.06-.128-.128-.128zm1.057-.09c-.075 0-.143.068-.143.143l-.068 3.875.068 3.42c0 .075.068.143.143.143s.143-.068.143-.143l.078-3.42-.078-3.875c0-.075-.068-.143-.143-.143zm1.072-.435c-.083 0-.158.075-.158.158l-.038 4.31.038 3.345c0 .083.075.158.158.158s.158-.075.158-.158l.045-3.345-.045-4.31c0-.083-.075-.158-.158-.158zm10.553 4.09c-.39-2.52-2.633-4.44-5.325-4.44-1.013 0-1.928.278-2.723.743V19.5c0 .083.068.143.15.143h7.898c.795 0 1.44-.645 1.44-1.44 0-.795-.645-1.44-1.44-1.44z" />
      </svg>
    ),
    facebook: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    spotify: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    beatport: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.35 5.4c2.483 0 4.5 2.017 4.5 4.5a4.48 4.48 0 0 1-1.317 3.183l1.783 1.784a6.77 6.77 0 0 0 1.984-4.967C19.3 6.614 16.186 3.5 12.35 3.5c-1.9 0-3.617.755-4.867 1.983l1.784 1.784A4.48 4.48 0 0 1 12.35 5.4zm0 2.7c.994 0 1.8.806 1.8 1.8a1.79 1.79 0 0 1-.527 1.273l1.786 1.785a4.19 4.19 0 0 0 .741-2.358 3.8 3.8 0 0 0-3.8-3.8 3.793 3.793 0 0 0-2.358.74l1.785 1.786A1.79 1.79 0 0 1 12.35 8.1zm-3.666 4.23l1.785 1.787A1.79 1.79 0 0 1 12.35 13.5c-.994 0-1.8-.806-1.8-1.8 0-.47.187-.897.49-1.211L9.255 8.703a3.793 3.793 0 0 0-.905 2.497 3.8 3.8 0 0 0 3.8 3.8c.918 0 1.76-.328 2.41-.869l1.785 1.786A6.482 6.482 0 0 1 12.35 17.4c-3.59 0-6.5-2.91-6.5-6.5a6.48 6.48 0 0 1 2.834-5.367z" />
      </svg>
    ),
  };
  return <>{icons[platform] ?? null}</>;
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
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
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
      className="group flex items-center justify-between gap-4 border px-5 py-4 transition-all"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text-60)" }}
    >
      <span className="flex items-center gap-3">
        <SocialIcon platform={platform} />
        <span className="text-sm font-semibold uppercase tracking-widest">{label}</span>
      </span>
      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
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
        {gig.ticketLink && (
          <a
            href={gig.ticketLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full py-2 text-center text-xs font-semibold uppercase tracking-widest transition-all"
            style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
          >
            Get Tickets
          </a>
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
  const spotifySrc = artist.spotifyEmbed ? spotifyEmbedSrc(artist.spotifyEmbed) : null;
  const youtubeSrc = artist.youtubeEmbed ? youtubeEmbedSrc(artist.youtubeEmbed) : null;
  const linkCards = [
    !spotifySrc && artist.socials.spotify ? { platform: "spotify", label: "Spotify", href: artist.socials.spotify } : null,
    !youtubeSrc && artist.socials.youtube ? { platform: "youtube", label: "YouTube", href: artist.socials.youtube } : null,
  ].filter((c): c is { platform: string; label: string; href: string } => c !== null);

  const hasMedia =
    Boolean(artist.socials.soundcloud) || Boolean(spotifySrc) || Boolean(youtubeSrc) || linkCards.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Artist hero */}
      <div className="relative border-b px-6 py-20" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <Link
            href="/artists"
            className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-30)" }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Artists
          </Link>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
            {/* Photo placeholder */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square overflow-hidden border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl font-bold" style={{ color: "var(--text-20)" }}>{artist.name.charAt(0)}</span>
                </div>
              </div>

              {/* Socials */}
              {Object.keys(artist.socials).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(artist.socials).map(([platform, url]) =>
                    url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={platform}
                        className="flex h-10 w-10 items-center justify-center border transition-all"
                        style={{ borderColor: "var(--border)", color: "var(--text-30)" }}
                      >
                        <SocialIcon platform={platform} />
                      </a>
                    ) : null
                  )}
                </div>
              )}

              {/* Book CTA */}
              <a
                href={`/contact?artist=${encodeURIComponent(artist.name)}`}
                className="w-full py-3 text-center text-sm font-semibold uppercase tracking-widest transition-all"
                style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
              >
                Book {artist.name}
              </a>
            </div>

            {/* Info */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
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
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Listen &amp; Watch</p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* SoundCloud */}
              {artist.socials.soundcloud && (
                <MediaBox label="SoundCloud">
                  <iframe
                    width="100%"
                    height="320"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    title={`${artist.name} on SoundCloud`}
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.socials.soundcloud)}&color=%23888888&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
                    className="block w-full"
                  />
                </MediaBox>
              )}

              {/* Spotify */}
              {spotifySrc && (
                <MediaBox label="Spotify">
                  <iframe
                    src={spotifySrc}
                    width="100%"
                    height="320"
                    frameBorder="0"
                    loading="lazy"
                    title={`${artist.name} on Spotify`}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="block w-full"
                  />
                </MediaBox>
              )}

              {/* YouTube */}
              {youtubeSrc && (
                <MediaBox label="YouTube">
                  <div className="aspect-video w-full">
                    <iframe
                      src={youtubeSrc}
                      title={`${artist.name} on YouTube`}
                      frameBorder="0"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
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

      {/* Upcoming events — flyer boxes */}
      <div className="border-t px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Upcoming Events</p>
          {upcomingGigs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-30)" }}>No upcoming dates announced yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {upcomingGigs.map((gig, i) => (
                <FlyerCard key={i} artist={artist} gig={gig} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past dates */}
      <div className="border-t px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Past Dates</p>
          {pastGigs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-30)" }}>No past dates on record.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

      {/* Other artists */}
      <div className="border-t px-6 py-20" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-20)" }}>
            Also on the Roster
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {artists
              .filter((a) => a.slug !== slug)
              .map((a) => (
                <Link
                  key={a.slug}
                  href={`/artist/${a.slug}`}
                  className="border px-5 py-2.5 text-sm transition-all"
                  style={{ borderColor: "var(--border)", color: "var(--text-40)" }}
                >
                  {a.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
