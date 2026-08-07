"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artist, Gig } from "@/data/artists";
import { eventDateBadge, formatEventDate, isUpcomingEventDate } from "@/lib/events";
import SocialIcon from "@/components/SocialIcons";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThirdPartyEmbed from "@/components/ThirdPartyEmbed";
import PastShowsDialog from "./PastShowsDialog";

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function subscribeToDateChange(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** A flyer-style box for an upcoming event. Uses artwork when provided,
 *  otherwise renders a generated poster from the gig details. */
function FlyerCard({ artist, gig }: { artist: Artist; gig: Gig }) {
  const { month, day } = eventDateBadge(gig.date);

  return (
    /* id matches the fragment used by this gig's MusicEvent JSON-LD on the page */
    <div
      id={gig.eventId ? `event-${gig.eventId}` : undefined}
      className="group flex h-full scroll-mt-24 flex-col border"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
        {gig.flyer ? (
          /* Whole poster always visible (object-contain), but instead of dead
             letterbox bars the same image is scaled up and blurred behind it, so
             any aspect ratio extends into an ambient backdrop of its own artwork. */
          <>
            <Image
              src={gig.flyer}
              alt=""
              aria-hidden="true"
              fill
              className="scale-125 object-cover blur-2xl"
              style={{ opacity: 0.5 }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* subtle darkening so the sharp poster stays the focal point */}
            <div className="absolute inset-0" style={{ backgroundColor: "var(--card-wash)" }} />
            <Image
              src={gig.flyer}
              alt={`${artist.name} at ${gig.venue}`}
              fill
              className="object-contain drop-shadow-xl"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </>
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
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-60)" }}>{formatEventDate(gig.date)}</p>
        </div>
        {/* "Tickets soon" is only true when tickets are actually expected. A free
            event says so — it is a selling point, not a missing ticket link. */}
        {gig.ticketLink && gig.ticketLink !== "#" ? (
          <a
            href={gig.ticketLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta inline-flex min-h-[44px] w-full items-center justify-center py-3 text-center text-xs font-semibold uppercase tracking-widest"
          >
            {gig.freeEntry
              ? "Free entry · Details"
              : gig.ticketStatus === "available"
                ? "Get tickets"
                : "Event details"}
          </a>
        ) : (
          <span
            className="inline-flex min-h-[44px] w-full items-center justify-center py-3 text-center text-xs font-semibold uppercase tracking-widest"
            style={{
              border: "1px solid var(--border)",
              color: gig.freeEntry ? "var(--text-60)" : "var(--text-30)",
            }}
          >
            {gig.freeEntry ? "Free entry" : "Tickets soon"}
          </span>
        )}
      </div>
    </div>
  );
}

/** Card width at `lg`. These have to be literal class strings — Tailwind scans
 *  source text, so a template-built class name would never be generated. */
const CARD_WIDTH: Record<number, string> = {
  1: "lg:w-full",
  2: "lg:w-[calc((100%-1.25rem)/2)]",
  3: "lg:w-[calc((100%-2.5rem)/3)] lg:max-w-[320px]",
};

/** Upcoming events. On desktop this is a horizontal slider showing `perView`
 *  cards at a time; below `lg` the cards simply stack into the page.
 *
 *  Horizontal is the only axis worth rolling on: the page already owns vertical
 *  scrolling, so an inner vertical scroller would capture the same wheel and
 *  swipe and read as a stuck page. */
function UpcomingSlider({ artist, gigs, perView }: { artist: Artist; gigs: Gig[]; perView: number }) {
  const PER_VIEW = perView;
  const desktopMaxIndex = Math.max(0, gigs.length - PER_VIEW);
  const [desktopIndex, setDesktopIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  function moveTo(nextIndex: number) {
    const viewport = viewportRef.current;
    const item = itemRefs.current[nextIndex];
    if (!viewport || !item) return;

    viewport.scrollTo({
      left: item.offsetLeft - viewport.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  // Only the desktop viewport scrolls, so the position always comes from scrollLeft.
  function syncIndexFromScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const distance = Math.abs(item.offsetLeft - viewport.offsetLeft - viewport.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setDesktopIndex(Math.min(closestIndex, desktopMaxIndex));
  }

  return (
    <div>
      {/* Controls are desktop-only. Below lg every card is simply stacked in the
          page, so there is nothing to page through — and no inner scroll area to
          fight the page's own scroll. */}
      <div className="mb-4 hidden min-h-11 lg:block">
        {/* Desktop: three horizontal cards at a time, controlled left/right. */}
        <div className="flex items-center justify-between gap-4">
          {/* Only worth a counter when there is something to page through —
              "1–2 of 2" is noise. The bar keeps its height either way so the
              flyers and the player stay level. */}
          <p className="text-xs" style={{ color: "var(--text-40)" }} aria-live="polite">
            {gigs.length > PER_VIEW && `${desktopIndex + 1}–${Math.min(gigs.length, desktopIndex + PER_VIEW)} of ${gigs.length}`}
          </p>
          {gigs.length > PER_VIEW && (
            <div className="flex gap-2" aria-label="Upcoming event controls">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(0, desktopIndex - PER_VIEW);
                  setDesktopIndex(next);
                  moveTo(next);
                }}
                disabled={desktopIndex === 0}
                aria-label="Previous upcoming events"
                className="btn-outline flex h-11 w-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(desktopMaxIndex, desktopIndex + PER_VIEW);
                  setDesktopIndex(next);
                  moveTo(next);
                }}
                disabled={desktopIndex === desktopMaxIndex}
                aria-label="Next upcoming events"
                className="btn-outline flex h-11 w-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={viewportRef}
        data-testid="upcoming-slider"
        tabIndex={0}
        aria-label="Upcoming events slider"
        onScroll={syncIndexFromScroll}
        /* Grid while the cards are stacked in the page (two-up once there is room
           for it), switching to a horizontal flex slider at lg. */
        className="grid grid-cols-1 gap-5 scroll-smooth motion-reduce:scroll-auto sm:grid-cols-2 lg:flex lg:flex-row lg:overflow-x-auto lg:snap-x lg:snap-mandatory [&::-webkit-scrollbar]:hidden lg:[scrollbar-width:none]"
      >
        {gigs.map((gig, index) => (
          <div
            key={gig.eventId ?? `${gig.date}-${gig.venue}`}
            ref={(item) => { itemRefs.current[index] = item; }}
            /* No width cap below lg: capping at 320px inside a ~790px tablet
               column left most of the row empty. The cap only applies to the
               slider, where card width has to stay predictable. */
            className={`w-full flex-none snap-start ${CARD_WIDTH[PER_VIEW] ?? CARD_WIDTH[3]}`}
          >
            <FlyerCard artist={artist} gig={gig} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** One player at a time, filling the height its column is given.
 *
 *  Two players stacked would make this column twice the height of the flyers
 *  beside it, so the second is a swap away rather than a scroll away. The
 *  active provider is named in the bar, so the arrows are never a guess. */
function MediaColumn({
  players,
  linkOnly,
}: {
  players: Array<{ label: string; node: React.ReactNode }>;
  linkOnly: string | null;
}) {
  const [index, setIndex] = useState(0);
  const active = players[Math.min(index, players.length - 1)];

  // Two items make "disabled at the ends" mean one arrow is always dead, so
  // this wraps instead.
  const step = (delta: number) => setIndex((i) => (i + delta + players.length) % players.length);

  return (
    <div className="flex h-full flex-col">
      {/* Mirrors the upcoming controls: label left, arrows right, same 44px row,
          so the two columns line up at their tops on desktop. */}
      <div className="mb-4 flex min-h-11 items-center justify-between gap-4">
        <p
          data-testid="player-label"
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-40)" }}
          aria-live="polite"
        >
          {active.label}
          {players.length > 1 && (
            <span style={{ color: "var(--text-30)" }}> · {index + 1} of {players.length}</span>
          )}
        </p>
        {players.length > 1 && (
          <div className="flex gap-2" aria-label="Player controls">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous player"
              className="btn-outline flex h-11 w-11 cursor-pointer items-center justify-center"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next player"
              className="btn-outline flex h-11 w-11 cursor-pointer items-center justify-center"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* min-h-0 lets the flex child actually shrink to the row height, which is
          what makes the player end level with the flyer cards. */}
      <div
        data-testid="media-player"
        className="min-h-0 flex-1 overflow-hidden border"
        /* The floor only bites below lg, where nothing stretches the column —
           it is what stops the stacked player collapsing to a few track rows. */
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", minHeight: "420px" }}
      >
        {active.node}
      </div>

      {linkOnly && (
        <div className="mt-4">
          <MediaLinkCard platform="spotify" label="Spotify" href={linkOnly} />
        </div>
      )}
    </div>
  );
}

/** Fallback for a configured profile URL that cannot be converted to an embed. */
function MediaLinkCard({ platform, label, href }: { platform: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline group flex cursor-pointer items-center justify-between gap-4 px-5 py-4"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <span className="flex items-center gap-3">
        <SocialIcon platform={platform} />
        <span className="text-sm font-semibold uppercase tracking-widest">{label}</span>
      </span>
      <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

/** Upcoming & Past events, split by the *viewer's* current date.
 *
 *  The page is statically exported, so a build-time split would freeze: gigs
 *  would never move from Upcoming to Past until a rebuild. Instead the server
 *  renders with `buildNow` (so server and first client render match — no
 *  hydration mismatch), then subscribes to the viewer's current date so the
 *  UI corrects itself after hydration and while a tab remains open. */
export default function EventsSection({
  artist,
  buildNow,
  spotifySrc,
}: {
  artist: Artist;
  buildNow: string;
  spotifySrc: string | null;
}) {
  const now = useSyncExternalStore(subscribeToDateChange, currentDate, () => buildNow);

  // `gigs` is guaranteed oldest → newest: scripts/gen-artists.mjs rejects any
  // artist file whose list is out of order, so `npm run check` fails before a
  // build can ship one. Filtering preserves that order, so neither list needs
  // sorting here. (PastShowsDialog renders its own newest-first view.)
  const upcomingGigs = artist.gigs.filter((g) => isUpcomingEventDate(g.date, now));
  const pastGigs = artist.gigs.filter((g) => !isUpcomingEventDate(g.date, now));
  const spotifyLinkOnly = (!spotifySrc && artist.socials.spotify) || null;

  const players: Array<{ label: string; node: React.ReactNode }> = [];
  if (artist.socials.soundcloud) {
    players.push({
      label: "SoundCloud",
      node: (
        <ThirdPartyEmbed
          provider="SoundCloud"
          title={`${artist.name} on SoundCloud`}
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.socials.soundcloud)}&color=%23888888&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&show_artwork=true`}
          allow="autoplay"
          className="h-full"
        />
      ),
    });
  }
  if (spotifySrc) {
    players.push({
      label: "Spotify",
      node: <SpotifyPlayer src={spotifySrc} title={`${artist.name} on Spotify`} className="h-full" />,
    });
  }
  const hasMedia = players.length > 0 || Boolean(spotifyLinkOnly);

  // The flyer column is sized in whole cards so the player takes whatever is
  // left: two dates leave a normal-width player, one date leaves a wide one.
  // Either way the row is full, which is what the old fixed split got wrong.
  const flyerSlots = Math.min(Math.max(upcomingGigs.length, 1), 2);
  const perView = hasMedia ? flyerSlots : 3;
  const trackWidth = flyerSlots * 340 + (flyerSlots - 1) * 20;

  return (
    <div
      data-testid="artist-activity"
      className="border-t px-6 py-16"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Dates and media share one row: the flyer track is sized in whole
            cards and the player absorbs the remainder, so a sparse artist gets
            a wide player instead of a half-empty row. Below lg it all stacks —
            the whole page commits to one breakpoint. */}
        <div
          className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[var(--flyer-track)_minmax(0,1fr)] lg:gap-6"
          style={{ "--flyer-track": `${trackWidth}px` } as React.CSSProperties}
        >
          <section data-testid="upcoming-events" className="flex min-w-0 flex-col">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Upcoming Events</h2>
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
            ) : <UpcomingSlider artist={artist} gigs={upcomingGigs} perView={perView} />}
          </section>

          {hasMedia && (
            <section data-testid="listen" className="flex min-w-0 flex-col">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Listen</h2>
              {players.length > 0 ? (
                <MediaColumn players={players} linkOnly={spotifyLinkOnly} />
              ) : (
                spotifyLinkOnly && <MediaLinkCard platform="spotify" label="Spotify" href={spotifyLinkOnly} />
              )}
            </section>
          )}
        </div>

        {/* Past — a link, not a column. Still on the page for credibility, but
            it no longer competes with the dates someone can actually book. */}
        <div data-testid="past-dates" className="mt-10 min-w-0">
          {pastGigs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-40)" }}>No past dates on record yet.</p>
          ) : (
            <PastShowsDialog gigs={pastGigs} />
          )}
        </div>
      </div>
    </div>
  );
}
