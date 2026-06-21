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

  const profileHref = `/artist/${artist.slug}`;

  return (
    <div
      className="group relative mx-auto aspect-square w-full max-w-md select-none sm:max-w-none lg:aspect-auto lg:h-[380px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFlipped(false);
      }}
    >
      {/* ── Front face — the whole card links to the profile ── */}
      <Link
        href={profileHref}
        aria-label={`${artist.name}, ${artist.genre} — view profile`}
        className="absolute inset-0 block cursor-pointer overflow-hidden border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-2)",
          transform: flipped ? `${P} rotateY(90deg)` : `${P} rotateY(0deg)`,
          transition: flipped ? EASE_IN : EASE_OUT_DELAY,
        }}
      >
        <Image
          src={artist.image}
          alt={artist.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          style={{ filter: "var(--artist-photo-filter)" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Hover wash — same as the home cards */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundColor: "var(--card-wash)" }}
        />
        {/* Bottom gradient + name */}
        <div
          className="absolute inset-x-0 bottom-0 p-5"
          style={{ background: "var(--artist-photo-gradient)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            {artist.genre}
          </p>
          <p className="text-base font-bold text-white sm:text-lg">{artist.name}</p>
        </div>
        {/* Hover line sweep — bottom + center origin, matching the home featured tiles */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
          style={{ backgroundColor: "var(--card-line)" }}
        />
      </Link>

      {/* ── Back face — revealed on hover/focus ── */}
      <div
        className="absolute inset-0 flex flex-col border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-2)",
          pointerEvents: flipped ? "auto" : "none",
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
            className="h-11 w-auto"
            style={{ filter: "var(--logo-filter)" }}
          />
        </div>

        {/* Artist info */}
        <div className="flex flex-1 flex-col justify-between p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              {artist.genre}
            </p>
            <h2 className="mb-3 text-xl font-bold leading-tight sm:text-2xl" style={{ color: "var(--text)" }}>
              {artist.name}
            </h2>
            <p className="line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
              {artist.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={profileHref}
              tabIndex={flipped ? 0 : -1}
              aria-hidden={!flipped}
              className="inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
            >
              View Profile
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href={`/contact?artist=${encodeURIComponent(artist.name)}`}
              tabIndex={flipped ? 0 : -1}
              aria-hidden={!flipped}
              className="inline-flex w-full items-center justify-center py-2.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--text)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-40)";
              }}
            >
              Book {artist.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard() {
  return (
    <Link
      href="/contact"
      className="group relative mx-auto flex aspect-square w-full max-w-md flex-col justify-between overflow-hidden border p-6 transition-all sm:max-w-none lg:aspect-auto lg:h-[380px]"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
    >
      {/* Hover wash — same as the artist cards */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: "var(--card-wash)" }}
      />

      <div className="relative">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
          Bookings
        </p>
        <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
          Need the right artist for your event?
        </h2>
      </div>

      <div className="relative">
        <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-40)" }}>
          Send the date, venue, capacity, and the sound you want. We will help match the room.
        </p>
        <span
          className="inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-widest transition-all"
          style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
        >
          Enquire Now
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      {/* Hover line sweep — bottom + center origin, matching the artist cards */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundColor: "var(--card-line)" }}
      />
    </Link>
  );
}

export default function ArtistsPage() {
  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.slug} artist={artist} />
          ))}
          <BookingCard />
        </div>
      </div>
    </div>
  );
}
