import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
        404
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
        Page not found
      </h1>
      <p className="mb-10 max-w-md text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
          style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
        >
          Back home
        </Link>
        <Link
          href="/artists"
          className="px-8 py-3.5 text-sm font-semibold uppercase tracking-widest transition-all"
          style={{ border: "1px solid var(--border)", color: "var(--text-40)" }}
        >
          View artists
        </Link>
      </div>
    </div>
  );
}
