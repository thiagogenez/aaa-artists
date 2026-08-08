import Link from "next/link";
import { artists } from "@/data/artists";
import ArtistCard from "./ArtistCard";
import { createPageMetadata } from "@/lib/site";

const description =
  "Browse the AAA Artists roster — DJs and producers across trance, progressive, techno, melodic techno and hard techno. View a profile or book an artist for your event.";

export const metadata = createPageMetadata({
  title: "Electronic Music DJs & Producers",
  description,
  path: "/artists",
  socialTitle: "Artists — AAA Artists",
  imageAlt: "AAA Artists roster",
});

function BookingCard({ wide = false }: { wide?: boolean }) {
  return (
    <Link
      href="/contact"
      className={`group relative mx-auto flex aspect-square w-full max-w-md flex-col justify-between overflow-hidden border p-6 transition-all sm:max-w-none lg:aspect-auto lg:h-[380px] ${
        wide ? "sm:col-span-2 sm:aspect-auto sm:min-h-[280px]" : ""
      }`}
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
          className="btn-cta inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold uppercase tracking-widest"
        >
          Book Artists
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
    <div className="min-h-screen overscroll-contain px-6 pb-16 pt-20 sm:py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="site-shell">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Artists
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            Our Artists
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: "var(--text-40)" }}>
            {artists.length} artists, one agency. Hover or tap any card to learn more.
          </p>
        </div>

        {/* Artist grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {artists.map((artist, index) => (
            <ArtistCard
              key={artist.slug}
              artist={{ slug: artist.slug, name: artist.name, genre: artist.genre, image: artist.image }}
              priority={index === 0}
            />
          ))}
          {/* With an even roster the grid would end one short — let the booking
              card take two spots so every row closes full. */}
          <BookingCard wide={artists.length % 2 === 0} />
        </div>
      </div>
    </div>
  );
}
