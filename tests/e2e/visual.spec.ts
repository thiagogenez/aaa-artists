import { expect, test } from "playwright/test";
import { seedMediaConsent } from "./helpers";

/**
 * Visual regression baseline — "does the site still look like itself?"
 *
 * The rest of the suite asserts behaviour: a button exists, a dialog closes, a
 * form submits. None of that notices a layout quietly breaking, a colour token
 * resolving to the wrong value, or a section collapsing on one viewport. This
 * spec is the characterisation test that does.
 *
 * The baseline is captured from a **clean build of the deployed `main`**, not from
 * whatever is in the working tree, so it describes the site as it is in production
 * rather than as it happens to be mid-change:
 *
 *   npm run test:visual                                compare the working tree
 *   npm run test:visual -- --update-snapshots          accept the current look
 *
 * Re-capturing from `main` rather than accepting the working tree is a worktree
 * recipe, written out in docs/local-testing.md.
 *
 * Accepting a diff is a decision. The PR should say which screenshots changed and
 * why they are supposed to look different.
 *
 * Third-party frames are never loaded (consent stays denied), and every animation
 * is disabled, so the images are deterministic rather than a race.
 */
const ROUTES = [
  { name: "home", path: "/" },
  { name: "artists", path: "/artists" },
  { name: "artist-detail", path: "/artist/xijaro-pitch" },
  { name: "contact", path: "/contact" },
  { name: "about", path: "/about" },
  { name: "privacy", path: "/privacy" },
  { name: "not-found", path: "/this-route-does-not-exist" },
];

for (const theme of ["light", "dark"] as const) {
  for (const route of ROUTES) {
    test(`${route.name} looks unchanged in ${theme}`, async ({ page }) => {
      // Consent denied keeps every third-party frame out of the screenshot; a
      // SoundCloud player would make the image depend on someone else's server.
      await seedMediaConsent(page, "denied");
      await page.addInitScript((value) => {
        window.localStorage.setItem("aaa-theme", value);
      }, theme);

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // Freeze everything that moves. Without this the screenshot races the
      // scroll reveal, the image fade and the skeleton sweep.
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        html { scroll-behavior: auto !important; }`,
      });
      await page.evaluate(() => document.fonts.ready);

      await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
        fullPage: true,
        // Sub-pixel text rendering differs slightly between runs on the same
        // machine; this tolerates that without hiding a real layout change.
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
        scale: "css",
      });
    });
  }
}
