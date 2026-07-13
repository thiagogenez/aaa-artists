"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artist, Gig } from "@/data/artists";
import PastDates from "./PastDates";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

/** Upcoming & Past events, split by the *viewer's* current date.
 *
 *  The page is statically exported, so a build-time split would freeze: gigs
 *  would never move from Upcoming to Past until a rebuild. Instead the server
 *  renders with `buildNow` (so server and first client render match — no
 *  hydration mismatch) and an effect swaps in the real current date after
 *  mount, letting the UI correct itself at view time. */
export default function EventsSection({ artist, buildNow }: { artist: Artist; buildNow: string }) {
  const [now, setNow] = useState(buildNow);
  useEffect(() => {
    setNow(new Date().toISOString().slice(0, 10));
  }, []);

  const upcomingGigs = artist.upcomingGigs.filter((g) => g.date >= now);
  // Past includes any listed-as-upcoming gigs whose date has since passed,
  // kept in date order (oldest → newest; PastDates shows newest first).
  const pastGigs = [...artist.pastGigs, ...artist.upcomingGigs]
    .filter((g) => g.date < now)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    /* Events — Upcoming & Past side by side so neither side looks empty */
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
              <PastDates gigs={pastGigs} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
