"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useMediaConsent } from "@/components/useMediaConsent";
import { setMediaConsent } from "@/lib/media-consent";

const subscribeToHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

/** Asks before any third-party player is embedded.
 *
 *  It is mounted only by artist pages with an embeddable player. Accept and
 *  Decline are given equal weight, and the footer/player controls can restore
 *  this question if the visitor changes their mind. */
export default function MediaConsentBanner() {
  const consent = useMediaConsent();
  // localStorage is unavailable while the static HTML is generated. Do not
  // render an "unset" banner there: returning visitors would briefly see it
  // before hydration restores their saved choice.
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydration,
    getServerHydration
  );

  if (!hydrated || consent !== "unset") return null;

  return (
    <section
      aria-label="Media cookie choice"
      className="media-consent-banner fixed inset-x-0 bottom-0 z-[90] border-t px-6 py-4"
    >
      <div className="site-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--media-banner-muted)" }}
        >
          We&apos;d like to load music and video players from SoundCloud, Spotify and YouTube. They
          receive your IP address and set cookies under their own terms. Nothing loads until you
          choose.{" "}
          <Link href="/privacy" className="media-consent-link underline underline-offset-4">
            Privacy notice
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setMediaConsent("denied")}
            className="media-consent-decline inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setMediaConsent("granted")}
            className="media-consent-accept inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Accept
          </button>
        </div>
      </div>
    </section>
  );
}
