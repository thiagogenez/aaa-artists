import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — AAA Events",
  description: "AAA Events is a music booking and artist management agency representing world-class electronic music talent across trance, techno, progressive and beyond.",
};

const values = [
  {
    title: "Artist First",
    desc: "We build long-term relationships — not just one-off bookings. Every decision is made with the artist's career in mind.",
  },
  {
    title: "Quality Over Volume",
    desc: "We represent a focused roster. That means more attention, better deals, and the right match for every event.",
  },
  {
    title: "Global Reach",
    desc: "With connections across Europe, North America, Asia and beyond, we place our artists on the stages that matter.",
  },
  {
    title: "Transparent Communication",
    desc: "No surprises. Clear contracts, honest timelines, and straightforward communication with promoters and artists alike.",
  },
];

const stats = [
  { value: "7+", label: "Artists Represented" },
  { value: "50+", label: "Events Per Year" },
  { value: "20+", label: "Countries" },
  { value: "2018", label: "Founded" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero */}
      <section className="border-b px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            About Us
          </p>
          <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            We exist to put the right artists on the right stages.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-60)" }}>
            AAA Events is a music booking and artist management agency built by people who love electronic
            music. We represent a handpicked roster of world-class DJs and producers — and we work
            tirelessly to grow their careers, one great booking at a time.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b px-6 py-16" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: "var(--border)" }}>
            {stats.map(({ value, label }) => (
              <div key={label} className="px-8 py-10 text-center" style={{ backgroundColor: "var(--bg)" }}>
                <p className="text-4xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-40)" }}>{label}</p>
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
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                Our Story
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
                Born from a passion for electronic music
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  AAA Events started with a simple frustration: too many great artists were being
                  misrepresented, underbooked, or lost in the noise of a crowded market. We set out
                  to do things differently.
                </p>
                <p>
                  From our first booking to our hundredth event, the focus has never changed — put the
                  right artist in front of the right crowd, at the right venue, for the right fee.
                  That sounds simple, but it requires deep knowledge of the music, the market, and the
                  people involved.
                </p>
                <p>
                  Today we represent seven of the most exciting names across trance, progressive,
                  techno and hardstyle. Our artists have performed at some of the world's most
                  respected venues and festivals — and we are just getting started.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                For Promoters
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
                A booking partner you can rely on
              </h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                <p>
                  When you book through AAA Events, you get more than an artist — you get a professional
                  agency behind every step of the process. Clear communication, solid contracts, and
                  artists who show up prepared and ready to deliver.
                </p>
                <p>
                  We work with clubs, festivals, and private events of all sizes. Whether you need a
                  headline act or a support slot, we will find the right fit for your event and audience.
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
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
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
                  className="absolute inset-x-0 top-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: "var(--text-20)" }}
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            Work With Us
          </p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Artists. Promoters. Festivals.
          </h2>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "var(--text-40)" }}>
            Whether you want to book one of our artists for your event, or you are an artist looking
            for serious representation — we want to hear from you.
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
              href="/our-djs"
              className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
            >
              View Our DJs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
