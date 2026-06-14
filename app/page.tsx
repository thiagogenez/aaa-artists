import Image from "next/image";
import Link from "next/link";
import { artists } from "@/data/artists";

export default function HomePage() {
  const featuredArtists = artists.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Vertical line top */}
        <div
          className="absolute top-0 left-1/2 h-24 w-px -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, transparent, var(--border))" }}
        />

        <div className="relative z-10 max-w-4xl">
          {/* Logo — brand mark, not the hero centrepiece */}
          <div className="relative mx-auto mb-8 w-24 overflow-hidden md:w-32">
            <Image
              src="/logo.jpg"
              alt="AAA Events"
              width={320}
              height={160}
              className="h-auto w-full"
              style={{ filter: "var(--logo-filter)" }}
              priority
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[12%]"
              style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[12%]"
              style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[8%]"
              style={{ background: "linear-gradient(to right, var(--bg), transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[8%]"
              style={{ background: "linear-gradient(to left, var(--bg), transparent)" }} />
          </div>

          {/* Headline — 7 words, outcome-focused */}
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            World-class electronic music,
            <br />
            <span style={{ color: "var(--text-40)" }}>booked right.</span>
          </h1>

          {/* Subheadline — 15 words */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed md:text-xl" style={{ color: "var(--text-60)" }}>
            From melodic trance to hard techno — connecting world-class artists
            with unforgettable events worldwide.
          </p>

          {/* CTAs — booking is primary */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
            >
              Book an Artist
            </Link>
            <Link
              href="/our-djs"
              className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
            >
              See Our Roster →
            </Link>
          </div>

          {/* Social proof bar — pulled up from the About section */}
          <div className="mt-14 flex items-center justify-center gap-10 border-t pt-10" style={{ borderColor: "var(--border)" }}>
            {[["7+", "Artists"], ["50+", "Events per year"], ["20+", "Countries"]].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{num}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-30)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical line bottom */}
        <div
          className="absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2"
          style={{ background: "linear-gradient(to top, transparent, var(--border))" }}
        />
      </section>

      {/* About */}
      <section className="border-t px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Who We Are</p>
              <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
                More than an agency.
                <br />
                <span style={{ color: "var(--text-30)" }}>A movement.</span>
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  AAA Events was built on a simple belief: great music deserves great representation. We work
                  closely with our artists not just to fill bookings, but to build careers — shaping the right
                  opportunities, at the right venues, for the right audiences.
                </p>
                <p>
                  From intimate club nights to festival main stages, we have the connections, experience, and
                  passion to make every performance count. Our roster spans trance, progressive, techno and
                  beyond — united by a commitment to quality and authenticity.
                </p>
                <p>
                  If you are looking to book world-class electronic music talent, or you are an artist looking
                  for serious representation, we want to hear from you.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/our-djs"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="mb-2 h-12 w-12 flex items-center justify-center rounded-full transition-all"
                        style={{ backgroundColor: "var(--surface-2)" }}>
                        <span className="text-lg font-bold transition-all" style={{ color: "var(--text-30)" }}>
                          {artist.name.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{artist.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-40)" }}>{artist.genre}</p>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: "var(--text-30)" }} />
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
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Genres</p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
            Across the electronic spectrum
          </h2>
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: "var(--border)" }}>
            {[
              { genre: "Trance", desc: "Melodic, uplifting, euphoric" },
              { genre: "Progressive", desc: "Deep, cinematic, hypnotic" },
              { genre: "Techno", desc: "Raw, industrial, driving" },
              { genre: "Hardstyle", desc: "Powerful kicks, hard energy" },
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
                  className="absolute inset-x-0 top-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: "var(--text-20)" }}
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>Ready to book?</p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
            Bring world-class talent to your event
          </h2>
          <p className="mb-10 text-base" style={{ color: "var(--text-40)" }}>
            Whether you are running a club night, a festival, or a private event, we can connect you
            with the right artist for your audience.
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
