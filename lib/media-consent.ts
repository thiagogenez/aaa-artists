// Consent state for third-party media embeds (SoundCloud, Spotify, YouTube).
//
// Embedding any of those players connects the visitor's browser to that
// provider, which processes their IP address and sets storage on their device.
// Under UK GDPR/PECR that needs consent BEFORE the request is made, so nothing
// is embedded while the state is "unset" — the banner asks first, and only a
// recorded "granted" lets players load on sight from then on.
//
// localStorage (not sessionStorage) so the answer survives across visits, and
// the choice is never sent to a server.

export type MediaConsent = "granted" | "denied" | "unset";

export const MEDIA_CONSENT_KEY = "aaa-media-consent-v1";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeMediaConsent(onChange: () => void) {
  listeners.add(onChange);
  // Keep tabs in step: a choice made in one tab applies to the others.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getMediaConsent(): MediaConsent {
  try {
    const stored = window.localStorage.getItem(MEDIA_CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : "unset";
  } catch {
    // Private-mode or blocked storage: treat as undecided, never as consent.
    return "unset";
  }
}

// The static export is rendered without a browser, and the first client render
// must match it, so both start from "unset" and correct after hydration.
export function getServerMediaConsent(): MediaConsent {
  return "unset";
}

export function setMediaConsent(value: Exclude<MediaConsent, "unset">) {
  try {
    window.localStorage.setItem(MEDIA_CONSENT_KEY, value);
  } catch {
    // Still notify: the choice applies for this page view even if it can't persist.
  }
  notify();
}

export function clearMediaConsent() {
  try {
    window.localStorage.removeItem(MEDIA_CONSENT_KEY);
  } catch {
    // Ignore — the reset below still re-renders the asking state.
  }
  notify();
}
