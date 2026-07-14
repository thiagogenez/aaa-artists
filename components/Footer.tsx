import Image from "next/image";
import Link from "next/link";
import SocialIcon from "@/components/SocialIcons";
import { SITE_NAME, SOCIAL_LINKS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="/logo.png"
              alt="AAA Artists"
              width={120}
              height={105}
              className="mb-4 h-14 w-auto"
              style={{ filter: "var(--logo-filter)" }}
            />
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
              The artist agency from the team behind AAA Events. Bookings, promotion, and management — trance first.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              Navigation
            </h3>
            <ul className="space-y-1">
              {[
                { href: "/", label: "Home" },
                { href: "/artists", label: "Artists" },
                { href: "/events", label: "Events" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Book Artists" },
                { href: "/privacy", label: "Privacy" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="link-quiet inline-block py-1.5 text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              Bookings
            </h3>
            <p className="text-sm" style={{ color: "var(--text-60)" }}>
              For booking enquiries, please contact us directly.
            </p>
            <Link href="/contact" className="link-quiet group mt-4 inline-flex items-center gap-1.5 py-1.5 text-sm">
              Send a booking enquiry
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Socials */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              Follow Us
            </h3>
            <ul className="space-y-1">
              {SOCIAL_LINKS.map(({ href, label, platform }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-quiet flex items-center gap-3 py-1.5 text-sm"
                  >
                    <SocialIcon platform={platform} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social icon bar */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-40)" }}>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          {/* 44px touch targets; negative margins keep the visual footprint compact */}
          <div className="-my-3 -mr-3 flex items-center gap-1">
            {SOCIAL_LINKS.map(({ href, label, platform }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="link-quiet flex h-11 w-11 items-center justify-center"
              >
                <SocialIcon platform={platform} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
