"use client";

import Link from "next/link";
import { useMediaConsent } from "@/components/useMediaConsent";
import { setMediaConsent } from "@/lib/media-consent";

/** Asks once, before any third-party player is embedded.
 *
 *  Accept and Decline are given equal weight: consent is only valid if refusing
 *  is as easy as agreeing. Declining still leaves each player individually
 *  loadable on click, so nobody is locked out of the music. */
export default function MediaConsentBanner() {
  const consent = useMediaConsent();
  if (consent !== "unset") return null;

  return (
    <div
      role="region"
      aria-label="Media cookie choice"
      className="fixed inset-x-0 bottom-0 z-[90] border-t px-6 py-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-nav)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-60)" }}>
          We&apos;d like to load music and video players from SoundCloud, Spotify and YouTube. They
          receive your IP address and set cookies under their own terms. Nothing loads until you
          choose.{" "}
          <Link href="/privacy" className="link-quiet underline underline-offset-4">
            Privacy notice
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setMediaConsent("denied")}
            className="btn-outline inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setMediaConsent("granted")}
            className="btn-cta inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
