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
  // Pointer devices flip on hover/focus; touch devices flip on the first tap.
  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <div
      className="group relative mx-auto aspect-square w-full max-w-md select-none sm:max-w-none lg:aspect-auto lg:h-[380px]"
      onMouseEnter={() => { if (canHover()) setFlipped(true); }}
      onMouseLeave={() => { if (canHover()) setFlipped(false); }}
      onFocus={() => { if (canHover()) setFlipped(true); }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFlipped(false);
      }}
    >
      {/* ── Front face — the whole card links to the profile ── */}
      <Link
        href={profileHref}
        aria-label={`${artist.name}, ${artist.genre} — view profile`}
        onClick={(e) => {
          // On touch, the first tap flips the card instead of navigating.
          if (!canHover() && !flipped) {
            e.preventDefault();
            setFlipped(true);
          }
        }}
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
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
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
        {/* Tap hint — touch devices only (no hover) */}
        <span
          className="pointer-events-none absolute right-3 top-3 hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70 [@media(hover:none)]:block"
          style={{ borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          Tap
        </span>
      </Link>

      {/* ── Back face — the artist photo, blurred + darkened, with details in focus ── */}
      <div
        className="absolute inset-0 flex flex-col overflow-hidden border"
        style={{
          borderColor: "var(--border)",
          pointerEvents: flipped ? "auto" : "none",
          transform: flipped ? `${P} rotateY(0deg)` : `${P} rotateY(-90deg)`,
          transition: flipped ? EASE_OUT_DELAY : EASE_IN,
        }}
      >
        {/* Blurred photo background (decorative — the front already labels it) */}
        <Image
          src={artist.image}
          alt=""
          aria-hidden
          fill
          className="scale-110 object-cover blur-[3px]"
          style={{ filter: "var(--artist-photo-filter)" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Dark scrim so the white content stays legible */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.86) 55%, rgba(0,0,0,0.93) 100%)" }}
        />

        <div className="relative flex h-full flex-col p-6">
          {/* AAA logo — upper-left corner */}
          <Image
            src="/logo.png"
            alt="AAA Artists"
            width={80}
            height={70}
            className="mb-5 h-8 w-auto self-start"
            style={{ filter: "invert(1)" }}
          />

          {/* Artist info */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
                {artist.genre}
              </p>
              <h2 className="mb-3 text-xl font-bold leading-tight text-white sm:text-2xl">
                {artist.name}
              </h2>
              <p className="line-clamp-2 text-sm leading-relaxed text-white/75">
                {artist.tagline}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={profileHref}
                tabIndex={flipped ? 0 : -1}
                aria-hidden={!flipped}
                className="inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
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
                className="inline-flex w-full items-center justify-center py-2.5 text-sm font-semibold uppercase tracking-widest text-white/80 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.35)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ffffff";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                }}
              >
                Book {artist.name}
              </Link>
            </div>
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
