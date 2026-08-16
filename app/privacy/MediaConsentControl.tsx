"use client";

import { useMediaConsent } from "@/components/useMediaConsent";
import { clearMediaConsent, setMediaConsent } from "@/lib/media-consent";

const STATE_LABEL = {
  granted: "Players load automatically.",
  denied: "External media stays disabled.",
  unset: "You have not answered yet, so nothing is loaded automatically.",
} as const;

/** Lets a visitor see and change their media-embed choice at any time.
 *  Withdrawing consent has to be as easy as giving it. */
export default function MediaConsentControl() {
  const consent = useMediaConsent();

  return (
    <div
      className="mt-4 border p-5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        Your current choice
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--text-60)" }}>
        {STATE_LABEL[consent]}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {consent !== "granted" && (
          <button
            type="button"
            onClick={() => setMediaConsent("granted")}
            className="btn-cta inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Allow media players
          </button>
        )}
        {consent !== "denied" && (
          <button
            type="button"
            onClick={() => setMediaConsent("denied")}
            className="btn-outline inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Block media players
          </button>
        )}
        {consent !== "unset" && (
          <button
            type="button"
            onClick={clearMediaConsent}
            className="btn-outline inline-flex min-h-[44px] items-center px-5 text-xs font-semibold uppercase tracking-widest"
          >
            Ask me again
          </button>
        )}
      </div>
    </div>
  );
}
