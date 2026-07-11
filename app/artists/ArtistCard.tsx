"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Only the fields the card renders — the page passes this slim shape so the
// full artist dataset (bios, gig history) stays out of the client bundle.
export type ArtistCardData = {
  slug: string;
  name: string;
  genre: string;
  image: string;
};

export default function ArtistCard({ artist, priority = false }: { artist: ArtistCardData; priority?: boolean }) {
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
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
          {artist.genre}
        </p>
        <p className="text-base font-bold text-white sm:text-lg">{artist.name}</p>
      </div>

      {/* Tap hint — touch devices only, while closed */}
      {!open && (
        <span
          className="pointer-events-none absolute right-3 top-3 hidden rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 [@media(hover:none)]:block"
          style={{ borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(0,0,0,0.55)" }}
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
          className="btn-outline-photo inline-flex min-h-[44px] w-full items-center justify-center py-2.5 text-sm font-semibold uppercase tracking-widest"
        >
          Book {artist.name}
        </Link>
      </div>
    </div>
  );
}
