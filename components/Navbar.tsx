"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { PRIMARY_NAV_LINKS } from "@/config/navigation";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  // Same rule for desktop and mobile: section links stay highlighted on
  // sub-pages too (e.g. /artist/<slug> keeps "Artists" active).
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-nav)" }}
    >
      <nav className="site-shell flex items-center justify-between px-6 py-4">
        {/* Logo = home link; same underline-sweep affordance as the nav links */}
        <Link
          href="/"
          className="group relative flex items-center transition-transform duration-300 hover:-translate-y-px"
        >
          <Image
            src="/logo.png"
            alt="AAA Artists"
            width={80}
            height={70}
            className="h-10 w-auto"
            style={{ filter: "var(--logo-filter)" }}
          />
          <span
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
            style={{ backgroundColor: "var(--text-20)" }}
          />
        </Link>

        {/* Desktop nav */}
        {/* lg, not md: the rest of the site switches layout at 1024, so switching
            the nav at 768 put a desktop header on top of a tablet-width page.
            iPad portrait now gets the hamburger. */}
        <ul className="hidden items-center gap-8 lg:flex">
          {PRIMARY_NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group relative inline-block text-sm font-medium tracking-widest uppercase transition-all duration-300 hover:-translate-y-px"
                  style={{ color: active ? "var(--text)" : "var(--text-60)" }}
                >
                  {label}
                  {/* Bottom sweep — persistent for the active page, hover-reveal otherwise */}
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full origin-left transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                    style={{ backgroundColor: active ? "var(--text)" : "var(--text-20)" }}
                  />
                </Link>
              </li>
            );
          })}

          {/* Theme toggle */}
          <li>
            {/* Square bordered icon button — same .btn-outline hover standard as the
                artist-page social boxes: border and icon brighten together */}
            <button
              onClick={toggle}
              aria-label={themeLabel}
              className="btn-outline flex h-10 w-10 items-center justify-center"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </li>

          <li>
            <Link
              href="/contact"
              className="btn-outline px-5 py-2 text-sm font-medium uppercase tracking-widest"
            >
              Book Artists
            </Link>
          </li>
        </ul>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggle}
            aria-label={themeLabel}
            className="link-quiet -mr-2 flex h-11 w-11 items-center justify-center"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span
              className="h-px w-6 transition-all"
              style={{ backgroundColor: "var(--text)", transform: open ? "translateY(8px) rotate(45deg)" : "none" }}
            />
            <span
              className="h-px w-6 transition-all"
              style={{ backgroundColor: "var(--text)", opacity: open ? 0 : 1 }}
            />
            <span
              className="h-px w-6 transition-all"
              style={{ backgroundColor: "var(--text)", transform: open ? "translateY(-8px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t px-6 py-6 lg:hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        >
          <ul className="flex flex-col gap-2">
            {PRIMARY_NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="group flex min-h-[44px] items-center text-base font-medium tracking-widest uppercase transition-all duration-300 hover:-translate-y-px"
                    style={{ color: active ? "var(--text)" : "var(--text-60)" }}
                  >
                    <span className="relative inline-block">
                      {label}
                      <span
                        className={`absolute -bottom-1 left-0 h-px w-full origin-left transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                        style={{ backgroundColor: active ? "var(--text)" : "var(--text-20)" }}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn-outline mt-2 inline-flex min-h-[44px] items-center px-5 text-sm uppercase tracking-widest"
              >
                Book Artists
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
