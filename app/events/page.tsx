import Image from "next/image";
import Link from "next/link";
import { events } from "@/data/events";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Past Events — AAA Events",
  description: "Browse the history of Fusion events by AAA Events — lineups, venues, and recordings from our previous parties.",
};

export default function EventsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <section className="border-b px-6 py-24" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Events
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl" style={{ color: "var(--text)" }}>
            Past Events
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-60)" }}>
            Every Fusion event is a chapter in the story — a handpicked lineup, a curated room, and a crowd that lives for the music.
            Here is where we have been.
          </p>
        </div>
      </section>

      {/* Events list */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl space-y-px" style={{ outline: "1px solid var(--border)" }}>
          {events.map((event, idx) => (
            <article
              key={event.id}
              className="group relative border-b transition-all duration-300"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
            >
              {/* Hover surface */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: "var(--surface)" }}
              />
              {/* Top border sweep */}
              <div
                className="absolute inset-x-0 top-0 h-px scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: "var(--text-20)" }}
              />

              <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-2">
                {/* Flyer */}
                <div
                  className={`relative aspect-video overflow-hidden lg:aspect-auto lg:min-h-[420px] ${
                    idx % 2 === 1 ? "lg:order-2" : ""
                  }`}
                  style={{ backgroundColor: "var(--surface-2)" }}
                >
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Dark overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%)" }}
                  />
                </div>

                {/* Info */}
                <div
                  className={`relative flex flex-col justify-between p-8 lg:p-12 ${
                    idx % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <div>
                    {/* Date + city badge */}
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <span
                        className="inline-block border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                        style={{ borderColor: "var(--border)", color: "var(--text-40)" }}
                      >
                        {event.displayDate}
                      </span>
                      <span
                        className="inline-block border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                        style={{ borderColor: "var(--border)", color: "var(--text-40)" }}
                      >
                        {event.city}, {event.country}
                      </span>
                    </div>

                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
                      {event.subtitle ?? "AAA Events"}
                    </p>
                    <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
                      {event.title}
                    </h2>
                    <p className="mb-6 text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
                      {event.description}
                    </p>

                    {/* Venue */}
                    <div className="mb-6">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
                        Venue
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-60)" }}>
                        {event.venue} — {event.address}
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-40)" }}>{event.time}</p>
                    </div>

                    {/* Lineup */}
                    <div className="mb-8">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
                        Lineup
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {event.lineup.map((name) => (
                          <span
                            key={name}
                            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: event.headliners.includes(name) ? "var(--text)" : "var(--surface-2)",
                              color: event.headliners.includes(name) ? "var(--bg)" : "var(--text-60)",
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA row */}
                  {event.soundcloudUrl && (
                    <div>
                      <a
                        href={event.soundcloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm transition-colors"
                        style={{ color: "var(--text-60)" }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M1.175 12.225c-.088 0-.175.088-.175.2l-.225 2.25.225 2.175c0 .113.087.2.175.2.1 0 .175-.087.175-.2l.25-2.175-.25-2.25c0-.113-.075-.2-.175-.2m-.899.828c-.112 0-.2.1-.2.225L0 14.65l.076 1.372c0 .125.088.225.2.225s.2-.1.2-.225l.087-1.372-.087-1.372c0-.125-.088-.225-.2-.225m1.81-.7c-.113 0-.2.088-.2.2l-.2 2.1.2 2.025c0 .112.087.2.2.2.112 0 .2-.088.2-.2l.225-2.025-.225-2.1c0-.112-.088-.2-.2-.2m.9-.125c-.125 0-.225.1-.225.225l-.175 2.225.175 2.15c0 .125.1.225.225.225s.225-.1.225-.225l.2-2.15-.2-2.225c0-.125-.1-.225-.225-.225m.9.025c-.137 0-.25.112-.25.25L3.5 14.625l.136 2.1c0 .137.113.25.25.25s.25-.113.25-.25l.15-2.1-.15-2.072c0-.138-.113-.25-.25-.25m.912-.25c-.15 0-.275.125-.275.275l-.112 2.072.112 2.075c0 .15.125.275.275.275s.275-.125.275-.275l.125-2.075-.125-2.072c0-.15-.125-.275-.275-.275m.9-.1c-.163 0-.3.137-.3.3l-.1 2.172.1 2.05c0 .162.137.3.3.3.162 0 .3-.138.3-.3l.112-2.05-.112-2.172c0-.163-.138-.3-.3-.3m.912-.075c-.175 0-.312.137-.312.312l-.088 2.247.088 2.025c0 .175.137.312.312.312.175 0 .313-.137.313-.312l.1-2.025-.1-2.247c0-.175-.138-.312-.312-.312m.9-.025c-.188 0-.337.15-.337.337l-.075 2.272.075 2c0 .188.149.337.337.337.187 0 .337-.149.337-.337l.087-2-.087-2.272c0-.188-.15-.337-.337-.337m.9-.05c-.2 0-.362.162-.362.362l-.063 2.322.063 1.975c0 .2.162.362.362.362.2 0 .362-.162.362-.362l.075-1.975-.075-2.322c0-.2-.162-.362-.362-.362m4.524-.8c-.225 0-.45.025-.662.075-.137-1.462-1.375-2.6-2.887-2.6-.387 0-.762.075-1.1.225-.125.05-.162.1-.162.162v5.137c0 .063.05.125.112.138l4.7.012c.625 0 1.125-.5 1.125-1.125 0-.625-.5-1.125-1.125-1.125z" />
                        </svg>
                        Listen to the sets on SoundCloud →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Follow CTA */}
      <section className="border-t px-6 py-20 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
          Stay in the loop
        </p>
        <h2 className="mb-6 text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Don&apos;t miss the next one
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed" style={{ color: "var(--text-40)" }}>
          Follow us on Instagram and Facebook for announcements, lineup reveals, and ticket drops before anyone else.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://www.instagram.com/aaaeventsofficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
            style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
          >
            Follow on Instagram
          </a>
          <Link
            href="/contact"
            className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
          >
            Book an Artist
          </Link>
        </div>
      </section>
    </div>
  );
}
