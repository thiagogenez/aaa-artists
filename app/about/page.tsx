import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — AAA Artists",
  description: "AAA Artists is a music booking and artist management agency representing world-class electronic music talent across trance, techno, progressive and beyond.",
};

const values = [
  {
    title: "Artist First",
    desc: "We build long-term relationships, not one-off bookings. We make decisions with the artist's career in mind.",
  },
  {
    title: "Quality Over Volume",
    desc: "We keep the roster small. That means more attention per artist and better matches for each event.",
  },
  {
    title: "Global Reach",
    desc: "We have contacts across Europe, North America and Asia, and we use them to get artists onto the right stages.",
  },
  {
    title: "Transparent Communication",
    desc: "No surprises. Clear contracts, honest timelines, and the same straight talk with promoters and artists.",
  },
];

const stats = [
  { value: "7+", label: "Artists Represented" },
  { value: "50+", label: "Shows Per Year" },
  { value: "20+", label: "Countries" },
  { value: "2018", label: "Founded" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        {/* Background grid — centred, matching the home hero */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            About Us
          </p>
          <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            We put the right artists on the right stages.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-60)" }}>
            AAA Artists is a booking and management agency run by people who love electronic
            music. We represent a small roster of artists and producers, and we work to grow
            their careers one good booking at a time.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: "var(--border)" }}>
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="group relative overflow-hidden px-8 py-10 text-center transition-all duration-300"
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
                <p className="relative text-4xl font-bold transition-all duration-300 group-hover:-translate-y-0.5" style={{ color: "var(--text)" }}>{value}</p>
                <p className="relative mt-1 text-sm transition-all duration-300" style={{ color: "var(--text-40)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="border-b px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                Our Story
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
                Where we started
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  AAA Artists started from a simple frustration: too many good artists were badly
                  represented, underbooked, or just lost in a crowded market. We wanted to do it
                  differently.
                </p>
                <p>
                  The focus hasn't changed since the first booking. Put the right artist in front of
                  the right crowd, for a fair fee. That sounds simple, but it takes real knowledge of
                  the music and the people who run the venues.
                </p>
                <p>
                  Today we represent seven artists across trance, progressive, techno and hardstyle.
                  They've played respected clubs and festivals around the world, and we're still
                  adding to the roster.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                For Promoters
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
                A booking partner you can rely on
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  When you book through AAA Artists, you also get an agency that handles the details:
                  clear communication, straightforward contracts, and artists who turn up prepared.
                </p>
                <p>
                  We work with clubs, festivals, and private events of all sizes. Whether you need a
                  headline act or a support slot, we'll find the right fit for your event and crowd.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="inline-block px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
                  style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
                >
                  Make a Booking Enquiry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            How We Work
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
            Our values
          </h2>
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "var(--border)" }}>
            {values.map(({ title, desc }) => (
              <div
                key={title}
                className="group relative overflow-hidden p-8 transition-all duration-300"
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
                <h3 className="relative mb-3 text-base font-bold transition-all duration-300 group-hover:-translate-y-0.5" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="relative text-sm leading-relaxed transition-all duration-300" style={{ color: "var(--text-40)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            Work With Us
          </p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Artists. Promoters. Festivals.
          </h2>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "var(--text-40)" }}>
            Whether you want to book one of our artists, or you're an artist looking for
            representation, we'd like to hear from you.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
            >
              Book an Artist
            </Link>
            <Link
              href="/artists"
              className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
            >
              View Artists
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
