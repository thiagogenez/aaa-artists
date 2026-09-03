import Image from "next/image";
import Link from "next/link";
import { artists } from "@/data/artists";
import { SITE_DESCRIPTION, SITE_NAME, createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: `Electronic Music DJ Booking Agency — ${SITE_NAME}`,
  socialTitle: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: "/",
  imageAlt: SITE_NAME,
  absoluteTitle: true,
});

export default function HomePage() {
  const featuredArtists = artists
    .filter((artist) => artist.image !== "/artists/placeholder.jpg")
    .slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[90vh] flex-col items-center justify-start overflow-hidden px-6 pt-[120px] pb-24 text-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="relative z-10 max-w-4xl">
          {/* Logo with a targeting cross — four rays, each fading out at the logo
              edge and at its far end, sitting behind the text (-z-10). */}
          {/* mb-28 (112px) + the headline's half-leading ≈ the 120px gap between the
              navbar and the logo above, so the logo sits with symmetric breathing room. */}
          <div className="relative mx-auto mb-28 w-24 md:w-32">
            {/* Background grid — anchored to the logo and phase-shifted half a cell so a
                grid line runs through the logo centre, aligning the crosshair to the grid.
                Hidden below md (elements are fluid there, so grid alignment can't hold) and
                radially faded toward the edges so nothing misaligned ever reaches the eye. */}
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 hidden h-[300vh] w-[300vw] -translate-x-1/2 -translate-y-1/2 md:block"
              style={{
                backgroundImage:
                  "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                backgroundPosition: "calc(50% + 30px) calc(50% + 30px)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 70vw 150vh at center, black 40%, transparent 85%)",
                maskImage:
                  "radial-gradient(ellipse 70vw 150vh at center, black 40%, transparent 85%)",
              }}
            />
            {/* Ray up */}
            <span
              className="pointer-events-none absolute bottom-full left-1/2 -z-10 h-[14vh] w-px -translate-x-1/2"
              style={{
                background: "linear-gradient(to top, transparent, var(--border) 50%, transparent)",
              }}
            />
            {/* Ray down */}
            <span
              className="pointer-events-none absolute top-full left-1/2 -z-10 h-[14vh] w-px -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, var(--border) 50%, transparent)",
              }}
            />
            {/* Ray left */}
            <span
              className="pointer-events-none absolute right-full top-1/2 -z-10 h-px w-[28vw] -translate-y-1/2"
              style={{
                background: "linear-gradient(to left, transparent, var(--border) 50%, transparent)",
              }}
            />
            {/* Ray right */}
            <span
              className="pointer-events-none absolute left-full top-1/2 -z-10 h-px w-[28vw] -translate-y-1/2"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--border) 50%, transparent)",
              }}
            />
            <Image
              src="/logo.png"
              alt="AAA Artists"
              width={320}
              height={280}
              className="relative z-10 h-auto w-full"
              style={{ filter: "var(--logo-filter)" }}
              priority
            />
          </div>

          {/* Headline — 7 words, outcome-focused */}
          <h1
            className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl"
            style={{ color: "var(--text)" }}
          >
            World-class electronic music,
            <br />
            <span style={{ color: "var(--text-40)" }}>booked right.</span>
          </h1>

          {/* Subheadline — 15 words */}
          <p
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed md:text-xl"
            style={{ color: "var(--text-60)" }}
          >
            From uplifting trance to hard techno, we connect great artists with the right events.
          </p>

          {/* CTAs — from md up, sized to the grid: 4 cells wide, 1 cell tall, 2-cell gap,
              so their edges sit on grid lines (fluid below md, where the grid-locked
              widths would overflow the viewport). Both opaque so no grid line cuts through. */}
          {/* The leading slot (left on desktop, top on mobile) always carries the
              solid treatment, so the emphasis stays with the position rather than
              travelling with either link. */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6 md:gap-[120px]">
            <Link
              href="/artists"
              className="btn-cta group inline-flex h-[60px] w-full items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest sm:w-[240px]"
            >
              See Our Roster
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="btn-outline inline-flex h-[60px] w-full items-center justify-center text-sm font-semibold uppercase tracking-widest sm:w-[240px]"
              style={{ backgroundColor: "var(--bg)" }}
            >
              Book Artists
            </Link>
          </div>

          {/* Stats — About-style cells; from md up each is grid-sized (180×120px = 3×2 cells)
              so their edges sit on grid lines and the background grid acts as the dividers.
              Below md the cells are fluid — fixed widths would clip inside overflow-hidden. */}
          <div className="mt-16 flex justify-center">
            <div className="grid w-full grid-cols-2 sm:grid-cols-4 md:w-auto">
              {[
                [String(artists.length), "Artists Represented"],
                ["2023", "Founded"],
                ["3", "Years Running Events"],
                ["7+", "World-Renowned Headliners Hosted"],
              ].map(([num, label]) => (
                <div
                  key={label}
                  className="group relative flex h-[120px] w-full flex-col items-center justify-center gap-1 overflow-hidden px-3 text-center transition-all duration-300 md:w-[180px]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ backgroundColor: "var(--surface)" }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ backgroundColor: "var(--card-line)" }}
                  />
                  <p
                    className="relative text-2xl font-bold transition-all duration-300 group-hover:-translate-y-0.5"
                    style={{ color: "var(--text)" }}
                  >
                    {num}
                  </p>
                  <p
                    className="relative text-xs uppercase tracking-widest"
                    style={{ color: "var(--text-30)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        className="border-t px-6 py-24"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
      >
        <div className="site-shell">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p
                className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]"
                style={{ color: "var(--text-30)" }}
              >
                Who We Are
              </p>
              <h2
                className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl"
                style={{ color: "var(--text)" }}
              >
                More than an agency.
                <br />
                <span style={{ color: "var(--text-30)" }}>We build careers.</span>
              </h2>
              <div
                className="space-y-4 text-base leading-relaxed"
                style={{ color: "var(--text-60)" }}
              >
                <p>
                  AAA Artists is the next chapter of AAA Events. We started in 2023 as a group of
                  trance fans organising our first event in London, and grew into AAA pres. Fusion:
                  trance nights in London and at ADE with some of the scene&apos;s biggest names on
                  the bill.
                </p>
                <p>
                  Now we&apos;re putting that promoter experience to work for our own roster. We
                  work closely with each artist to build a career over time, not just fill the next
                  date. Trance comes first, and the roster stretches into techno, melodic techno,
                  progressive and hard techno. We pick for quality rather than quantity.
                </p>
                <p>
                  If you want to book one of our artists, or you're an artist looking for
                  representation, we'd like to hear from you.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/artists"
                  className="link-quiet group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest"
                >
                  Meet the roster
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Featured artist tiles */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4" data-testid="featured-artists">
                {featuredArtists.map((artist) => (
                  <Link
                    key={artist.slug}
                    href={`/artist/${artist.slug}`}
                    className="group relative aspect-square overflow-hidden border transition-all duration-300"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  >
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      style={{ filter: "var(--artist-photo-filter)" }}
                      sizes="(max-width: 1024px) 0px, 25vw"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 p-4"
                      style={{ background: "var(--artist-photo-gradient)" }}
                    >
                      <p className="text-sm font-semibold text-white">{artist.name}</p>
                      <p className="text-xs text-white/75">{artist.genre}</p>
                    </div>
                    <div
                      className="absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: "var(--card-line)" }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section
        className="border-t px-6 py-24"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div className="site-shell">
          <p
            className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--text-30)" }}
          >
            Genres
          </p>
          <h2
            className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Across the electronic spectrum
          </h2>
          <div
            className="grid grid-cols-2 gap-px sm:grid-cols-4"
            style={{ backgroundColor: "var(--border)" }}
          >
            {[
              { genre: "Trance", desc: "Uplifting and melodic" },
              { genre: "Progressive", desc: "Deep and cinematic" },
              { genre: "Techno", desc: "From melodic to raw and driving" },
              { genre: "Hard Techno", desc: "Hard kicks, big energy" },
            ].map(({ genre, desc }) => (
              <div
                key={genre}
                className="group relative flex flex-col gap-2 overflow-hidden p-8 text-center transition-all duration-300"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: "var(--surface)" }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: "var(--card-line)" }}
                />
                <p
                  className="relative text-xl font-bold transition-all duration-300 group-hover:-translate-y-0.5"
                  style={{ color: "var(--text)" }}
                >
                  {genre}
                </p>
                <p
                  className="relative text-sm transition-all duration-300"
                  style={{ color: "var(--text-30)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t px-6 py-24"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--text-30)" }}
          >
            Ready to book?
          </p>
          <h2
            className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Bring the right artist to your event
          </h2>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "var(--text-40)" }}>
            Running a club night, a festival, or a warehouse party? Tell us what you're planning and
            we'll help you find the right artist for the crowd.
          </p>
          <Link
            href="/contact"
            className="btn-cta inline-block px-10 py-4 text-sm font-semibold uppercase tracking-widest"
          >
            Send a Booking Enquiry
          </Link>
        </div>
      </section>
    </>
  );
}
