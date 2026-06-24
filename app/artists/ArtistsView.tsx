"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { artists } from "@/data/artists";
import type { Artist } from "@/data/artists";

function ArtistCard({ artist, priority = false }: { artist: Artist; priority?: boolean }) {
  const [open, setOpen] = useState(false);

  const profileHref = `/artist/${artist.slug}`;
  const actionsId = `artist-card-${artist.slug}-actions`;
  // Pointer devices reveal the actions on hover/focus; touch devices on the first tap.
  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <div
      className="group relative mx-auto aspect-square w-full max-w-md touch-manipulation select-none overflow-hidden border sm:max-w-none lg:aspect-auto lg:h-[380px]"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
      onMouseEnter={() => { if (canHover()) setOpen(true); }}
      onMouseLeave={() => { if (canHover()) setOpen(false); }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onClick={() => { if (!canHover()) setOpen((o) => !o); }}
    >
      <Image
        src={artist.image}
        alt={artist.name}
        fill
        priority={priority}
        className="object-cover transition-transform duration-300"
        style={{ filter: "var(--artist-photo-filter)", transform: open ? "scale(1.04)" : "scale(1)" }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />

      {/* Darkening wash on reveal */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: "var(--card-wash)", opacity: open ? 1 : 0 }}
      />

      {/* Resting label — artist name + genre; fades out as the actions slide up */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 p-5 transition-opacity duration-300"
        style={{ background: "var(--artist-photo-gradient)", opacity: open ? 0 : 1 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          {artist.genre}
        </p>
        <p className="text-base font-bold text-white sm:text-lg">{artist.name}</p>
      </div>

      {/* Tap hint — touch devices only, while closed */}
      {!open && (
        <span
          className="pointer-events-none absolute right-3 top-3 hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70 [@media(hover:none)]:block"
          style={{ borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          Tap
        </span>
      )}

      {/* Slide-up action panel — View Profile + Book, revealed on hover/focus/tap */}
      <div
        id={actionsId}
        className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 transition-transform duration-300 ease-out"
        style={{
          background: "var(--artist-photo-gradient)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <Link
          href={profileHref}
          aria-label={`View ${artist.name} profile`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
        >
          View Profile
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href={`/contact?artist=${encodeURIComponent(artist.name)}`}
          aria-label={`Book ${artist.name}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-[44px] w-full items-center justify-center py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.5)", color: "#ffffff" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)";
            e.currentTarget.style.borderColor = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
          }}
        >
          Book {artist.name}
        </Link>
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
    <div className="min-h-screen overscroll-contain px-4 pb-16 pt-20 sm:px-6 sm:py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-16">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {artists.map((artist, index) => (
            <ArtistCard key={artist.slug} artist={artist} priority={index === 0} />
          ))}
          <BookingCard />
        </div>
      </div>
    </div>
  );
}
