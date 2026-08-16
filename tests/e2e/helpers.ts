import type { Page } from "playwright/test";

/** Pre-answer the media-consent banner so unrelated specs get a stable page.
 *
 *  "denied" is the default here on purpose: it keeps the banner out of the way
 *  AND keeps third-party players gated, so no test reaches out to SoundCloud,
 *  Spotify or YouTube. */
export async function seedMediaConsent(page: Page, value: "granted" | "denied" = "denied") {
  await page.addInitScript((stored) => {
    window.localStorage.setItem("aaa-media-consent-v1", stored);
  }, value);
}

/** Stop embedded players from making real requests to third-party hosts. */
export async function blockMediaProviders(page: Page) {
  await page.route(/soundcloud\.com|spotify\.com|youtube(-nocookie)?\.com/, (route) =>
    route.abort()
  );
}
