"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { artists } from "@/data/artists";
import type { Artist } from "@/data/artists";

// Uses the perspective() CSS function on each face individually.
// This avoids transform-style:preserve-3d + backface-visibility:hidden,
// which breaks silently in Safari/WebKit.
const P = "perspective(1400px)";
const EASE_IN = "transform 0.28s ease-in";
const EASE_OUT_DELAY = "transform 0.28s ease-out 0.28s";

function ArtistCard({ artist }: { artist: Artist }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ height: "380px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      {/* ── Front face ── */}
      <div
        className="absolute inset-0 border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-2)",
          transform: flipped ? `${P} rotateY(90deg)` : `${P} rotateY(0deg)`,
          transition: flipped ? EASE_IN : EASE_OUT_DELAY,
        }}
      >
        <Image
          src="/artists/placeholder.jpg"
          alt={artist.name}
          fill
          className="object-cover"
          style={{ filter: "grayscale(55%) contrast(1.1) brightness(0.85)" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Bottom gradient + name */}
        <div
          className="absolute inset-x-0 bottom-0 p-5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {artist.genre}
          </p>
          <p className="text-lg font-bold text-white">{artist.name}</p>
        </div>
        {/* Tap hint badge */}
        <div
          className="absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/60"
          style={{ borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          Tap
        </div>
      </div>

      {/* ── Back face ── */}
      <div
        className="absolute inset-0 flex flex-col border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-2)",
          transform: flipped ? `${P} rotateY(0deg)` : `${P} rotateY(-90deg)`,
          transition: flipped ? EASE_OUT_DELAY : EASE_IN,
        }}
      >
        {/* AAA logo strip */}
        <div
          className="flex items-center justify-center border-b py-5"
          style={{ borderColor: "var(--border)" }}
        >
          <Image
            src="/logo.png"
            alt="AAA Artists"
            width={80}
            height={70}
            className="h-9 w-auto"
            style={{ filter: "var(--logo-filter)" }}
          />
        </div>

        {/* Artist info */}
        <div className="flex flex-1 flex-col justify-between p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              {artist.genre}
            </p>
            <h2 className="mb-3 text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
              {artist.name}
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
              {artist.tagline}
            </p>
          </div>

          <Link
            href={`/artist/${artist.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex w-full items-center justify-center gap-2 border py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            View Profile
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Artists
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            Our Artists
          </h1>
          <p className="mx-auto max-w-xl text-base" style={{ color: "var(--text-40)" }}>
            Seven artists, one agency. Tap any card to learn more.
          </p>
        </div>

        {/* Artist grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.slug} artist={artist} />
          ))}
        </div>

        {/* Booking CTA */}
        <div className="mt-20 border p-8 text-center md:p-10" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            Book an artist
          </p>
          <h2 className="mb-4 text-2xl font-bold" style={{ color: "var(--text)" }}>
            Interested in booking one of our artists?
          </h2>
          <p className="mb-8 text-sm" style={{ color: "var(--text-40)" }}>
            Reach out with your event details: date, venue, capacity, and which artist you have in mind.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
            style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
          >
            Send a Booking Enquiry
          </Link>
        </div>
      </div>
    </div>
  );
}
