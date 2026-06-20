import Image from "next/image";
import Link from "next/link";
import { artists } from "@/data/artists";

export default function HomePage() {
  const featuredArtists = artists.filter((artist) => artist.image !== "/artists/placeholder.jpg").slice(0, 4);

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
          <div className="relative mx-auto mb-8 w-24 md:w-32">
            {/* Background grid — anchored to the logo and phase-shifted half a cell so a
                grid line runs through the logo centre, aligning the crosshair to the grid */}
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[300vh] w-[300vw] -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundImage:
                  "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                backgroundPosition: "calc(50% + 30px) calc(50% + 30px)",
              }}
            />
            {/* Ray up */}
            <span
              className="pointer-events-none absolute bottom-full left-1/2 -z-10 h-[14vh] w-px -translate-x-1/2"
              style={{ background: "linear-gradient(to top, transparent, var(--border) 50%, transparent)" }}
            />
            {/* Ray down */}
            <span
              className="pointer-events-none absolute top-full left-1/2 -z-10 h-[14vh] w-px -translate-x-1/2"
              style={{ background: "linear-gradient(to bottom, transparent, var(--border) 50%, transparent)" }}
            />
            {/* Ray left */}
            <span
              className="pointer-events-none absolute right-full top-1/2 -z-10 h-px w-[28vw] -translate-y-1/2"
              style={{ background: "linear-gradient(to left, transparent, var(--border) 50%, transparent)" }}
            />
            {/* Ray right */}
            <span
              className="pointer-events-none absolute left-full top-1/2 -z-10 h-px w-[28vw] -translate-y-1/2"
              style={{ background: "linear-gradient(to right, transparent, var(--border) 50%, transparent)" }}
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
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            World-class electronic music,
            <br />
            <span style={{ color: "var(--text-40)" }}>booked right.</span>
          </h1>

          {/* Subheadline — 15 words */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed md:text-xl" style={{ color: "var(--text-60)" }}>
            From melodic trance to hard techno, we connect great artists
            with events around the world.
          </p>

          {/* CTAs — sized to the grid: 4 cells wide, 1 cell tall, 2-cell gap, so
              their edges sit on grid lines. Both opaque so no grid line cuts through. */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-[120px]">
            <Link
              href="/contact"
              className="inline-flex h-[60px] w-full items-center justify-center text-sm font-semibold uppercase tracking-widest transition-all sm:w-[240px]"
              style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
            >
              Book an Artist
            </Link>
            <Link
              href="/artists"
              className="inline-flex h-[60px] w-full items-center justify-center text-sm font-semibold uppercase tracking-widest transition-all sm:w-[240px]"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text-40)" }}
            >
              See Our Roster →
            </Link>
          </div>

          {/* Social proof bar — no manual rule; the background grid lines act as dividers */}
          <div className="mt-16 flex items-center justify-center gap-10">
            {[["7+", "Artists"], ["50+", "Shows / year"], ["20+", "Countries"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{num}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-30)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Who We Are</p>
              <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
                More than an agency.
                <br />
                <span style={{ color: "var(--text-30)" }}>We build careers.</span>
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  AAA Artists started from a simple idea: good music deserves good representation. We work
                  closely with each artist to build a career over time, not just fill the next date. That
                  means finding the right rooms and the right crowds for them.
                </p>
                <p>
                  We book everything from small club nights to festival main stages, and we know the
                  promoters and venues that suit each artist. The roster covers trance, progressive, techno
                  and hardstyle, picked for quality rather than quantity.
                </p>
                <p>
                  If you want to book one of our artists, or you're an artist looking for representation,
                  we'd like to hear from you.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/artists"
                  className="inline-block text-sm font-semibold uppercase tracking-widest transition-colors"
                  style={{ color: "var(--text-60)" }}
                >
                  Meet the roster →
                </Link>
              </div>
            </div>

            {/* Featured artist tiles */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
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
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      style={{ filter: "var(--artist-photo-filter)" }}
                      sizes="(max-width: 1024px) 0px, 25vw"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 p-4"
                      style={{ background: "var(--artist-photo-gradient)" }}
                    >
                      <p className="text-sm font-semibold text-white">{artist.name}</p>
                      <p className="text-xs text-white/55">{artist.genre}</p>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: "var(--card-line)" }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Genres</p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
            Across the electronic spectrum
          </h2>
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: "var(--border)" }}>
            {[
              { genre: "Trance", desc: "Melodic and uplifting" },
              { genre: "Progressive", desc: "Deep and cinematic" },
              { genre: "Techno", desc: "Raw and driving" },
              { genre: "Hardstyle", desc: "Hard kicks, big energy" },
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
                <p className="relative text-xl font-bold transition-all duration-300 group-hover:-translate-y-0.5" style={{ color: "var(--text)" }}>
                  {genre}
                </p>
                <p className="relative text-sm transition-all duration-300" style={{ color: "var(--text-30)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Ready to book?</p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
            Bring the right artist to your event
          </h2>
          <p className="mb-10 text-base" style={{ color: "var(--text-40)" }}>
            Running a club night, a festival, or a private party? Tell us what you're planning and
            we'll help you find the right artist for the crowd.
          </p>
          <Link
            href="/contact"
            className="inline-block px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-all"
            style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
          >
            Send a Booking Enquiry
          </Link>
        </div>
      </section>
    </>
  );
}
