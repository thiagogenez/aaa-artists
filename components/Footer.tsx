import Image from "next/image";
import Link from "next/link";
import SocialIcon from "@/components/SocialIcons";
import { FOOTER_NAV_LINKS } from "@/config/navigation";
import { SITE_NAME, SOCIAL_LINKS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.35fr_1fr_1fr] md:gap-12">
          <div className="max-w-md">
            <Image
              src="/logo.png"
              alt="AAA Artists"
              width={80}
              height={70}
              className="mb-3 h-10 w-auto"
              style={{ filter: "var(--logo-filter)" }}
            />
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
              The artist agency from the team behind AAA Events. Bookings, promotion, and management — trance first.
            </p>
          </div>

          <nav aria-labelledby="footer-navigation">
            <h2 id="footer-navigation" className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>
              Navigation
            </h2>
            <ul className="grid grid-cols-2 gap-x-5">
              {FOOTER_NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="link-quiet inline-flex min-h-[44px] items-center text-sm">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-30)" }}>Bookings</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
              Tell us who, where and when. We aim to respond within 48 hours.
            </p>
            <Link href="/contact" className="btn-outline mt-4 inline-flex min-h-[44px] items-center px-4 text-xs font-semibold uppercase tracking-widest">
              Send an enquiry
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-40)" }}>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="-ml-3 flex items-center gap-1 sm:-mr-3 sm:ml-0">
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
