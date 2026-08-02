"use client";

import { useState } from "react";
import { useMediaConsent } from "@/components/useMediaConsent";

/** Gate around a third-party iframe.
 *
 *  With site-wide consent granted the player is embedded straight away. Without
 *  it nothing is requested from the provider, and this per-player button acts as
 *  a one-off consent for anyone who declined the banner or never answered it. */
export default function ThirdPartyConsent({
  provider,
  className,
  children,
}: {
  provider: string;
  className: string;
  children: React.ReactNode;
}) {
  const consent = useMediaConsent();
  const [loadedOnce, setLoadedOnce] = useState(false);

  if (consent === "granted" || loadedOnce) return children;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 text-center ${className}`} style={{ backgroundColor: "var(--surface)" }}>
      <button type="button" onClick={() => setLoadedOnce(true)} className="btn-cta min-h-[44px] px-6 py-3 text-xs font-semibold uppercase tracking-widest">
        Load {provider} player
      </button>
      <p className="max-w-sm text-xs" style={{ color: "var(--text-40)" }}>
        Loads media from {provider} and shares your IP address with {provider}.
      </p>
    </div>
  );
}
