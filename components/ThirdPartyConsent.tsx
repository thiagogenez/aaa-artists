"use client";

import { useEffect, useState } from "react";
import MediaConsentSettings from "@/components/MediaConsentSettings";
import { useMediaConsent } from "@/components/useMediaConsent";

/** Gate around a third-party iframe.
 *
 *  With site-wide consent granted the player is embedded straight away. Without
 *  it nothing is requested from the provider. The parent media column normally
 *  provides the visible preference control; this fallback keeps the iframe safe
 *  if the component is reused elsewhere.
 *
 *  This is also where the loading state lives, because it is the one gate every
 *  player passes through — SoundCloud via ThirdPartyEmbed and Spotify via
 *  SpotifyPlayer, which builds its own iframe. Putting the skeleton here means
 *  neither provider can be given a player without one. */
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
  const [loaded, setLoaded] = useState(false);

  // The frame is cross-origin, so `load` is the only signal available — its
  // document cannot be inspected. If that signal is ever missed the skeleton
  // would sit on top of a working player, so it gives up after a few seconds.
  useEffect(() => {
    if (consent !== "granted" || loaded) return;
    const timer = setTimeout(() => setLoaded(true), 6000);
    return () => clearTimeout(timer);
  }, [consent, loaded]);

  if (consent === "granted") {
    return (
      // `load` does not bubble, but React dispatches a capture phase for it, so one
      // handler here catches whichever iframe the child rendered.
      <div className={`relative ${className}`} onLoadCapture={() => setLoaded(true)}>
        {children}
        {!loaded && (
          <div
            // pointer-events-none matters: this sits on top of the player, and the 6s
            // fallback means it can outlive a frame that is already interactive.
            className="skeleton pointer-events-none absolute inset-0 flex items-end p-4 text-xs"
            style={{ color: "var(--text-30)" }}
            role="status"
            aria-live="polite"
          >
            Loading {provider}…
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 text-xs ${className}`}
      style={{ backgroundColor: "var(--surface)", color: "var(--text-40)" }}
    >
      <span>{provider} media disabled.</span>
      {consent === "denied" && (
        <MediaConsentSettings
          label="Change media preferences"
          className="link-quiet inline-flex min-h-[44px] cursor-pointer items-center font-semibold underline underline-offset-4"
        />
      )}
    </div>
  );
}
