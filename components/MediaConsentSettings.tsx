"use client";

import { useMediaConsent } from "@/components/useMediaConsent";
import { clearMediaConsent } from "@/lib/media-consent";

/** Keeps a saved media choice reversible without showing the consent banner on
 * every visit. Clearing the choice immediately restores the original banner. */
export default function MediaConsentSettings({
  label = "Media preferences",
  className = "link-quiet inline-flex min-h-[44px] cursor-pointer items-center text-xs underline underline-offset-4",
}: {
  label?: string;
  className?: string;
}) {
  const consent = useMediaConsent();

  if (consent === "unset") return null;

  return (
    <button type="button" onClick={clearMediaConsent} className={className}>
      {label}
    </button>
  );
}
