"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-nav)" }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="AAA Artists"
            width={80}
            height={70}
            className="h-10 w-auto"
            style={{ filter: "var(--logo-filter)" }}
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map(({ href, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="group relative inline-block text-sm font-medium tracking-widest uppercase transition-all duration-300 hover:-translate-y-px"
                  style={{ color: isActive ? "var(--text)" : "var(--text-40)" }}
                >
                  {label}
                  {/* Bottom sweep line — mirrors the genre card top-border effect */}
                  <span
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ backgroundColor: "var(--text-20)" }}
                  />
                </Link>
              </li>
            );
          })}

          {/* Theme toggle */}
          <li>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center border transition-all"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-40)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-40)")}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </li>

          <li>
            <Link
              href="/contact"
              className="px-5 py-2 text-sm font-medium uppercase tracking-widest transition-all"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-40)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--text)";
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-40)";
              }}
            >
              Book Now
            </Link>
          </li>
        </ul>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{ color: "var(--text-40)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className="flex flex-col gap-1.5"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
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
          className="border-t px-6 py-6 md:hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        >
          <ul className="flex flex-col gap-6">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium tracking-widest uppercase"
                  style={{ color: pathname === href ? "var(--text)" : "var(--text-40)" }}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="inline-block px-5 py-2 text-sm uppercase tracking-widest"
                style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
              >
                Book Now
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
