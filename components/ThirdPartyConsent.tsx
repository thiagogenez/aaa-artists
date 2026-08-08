"use client";

import MediaConsentSettings from "@/components/MediaConsentSettings";
import { useMediaConsent } from "@/components/useMediaConsent";

/** Gate around a third-party iframe.
 *
 *  With site-wide consent granted the player is embedded straight away. Without
 *  it nothing is requested from the provider. The parent media column normally
 *  provides the visible preference control; this fallback keeps the iframe safe
 *  if the component is reused elsewhere. */
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

  if (consent === "granted") return children;

  return (
    <div className={`flex items-center gap-2 px-4 text-xs ${className}`} style={{ backgroundColor: "var(--surface)", color: "var(--text-40)" }}>
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
