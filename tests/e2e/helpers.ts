import type { Page } from "playwright/test";
import { MEDIA_CONSENT_KEY } from "@/lib/media-consent";

/** Pre-answer the media-consent banner so unrelated specs get a stable page.
 *
 *  "denied" is the default here on purpose: it keeps the banner out of the way
 *  AND keeps third-party players gated, so no test reaches out to SoundCloud,
 *  Spotify or YouTube.
 *
 *  The storage key is imported rather than retyped: a rename in lib/media-consent.ts
 *  would otherwise leave these specs silently seeding a key nothing reads. */
export async function seedMediaConsent(page: Page, value: "granted" | "denied" = "denied") {
  await page.addInitScript(
    ([key, stored]) => {
      window.localStorage.setItem(key, stored);
    },
    [MEDIA_CONSENT_KEY, value] as const
  );
}

/** Stop embedded players from making real requests to third-party hosts. */
export async function blockMediaProviders(page: Page) {
  await page.route(/soundcloud\.com|spotify\.com|youtube(-nocookie)?\.com/, (route) =>
    route.abort()
  );
}
