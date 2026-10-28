import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  for (const theme of ["light", "dark"]) {
    for (const path of ["choose", "discuss", "date-tbc"]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: theme,
      });
      await page.addInitScript(
        ({ selectedTheme }) => {
          window.localStorage.setItem("aaa-theme", selectedTheme);
          window.localStorage.setItem("aaa-media-consent", "denied");
        },
        { selectedTheme: theme }
      );
      await page.goto("http://127.0.0.1:3100/contact");
      if (path === "date-tbc") {
        await page.locator('button[aria-controls="section-event"]').click();
        await page.getByText("Date not confirmed yet", { exact: true }).click();
      } else {
        await page.locator('button[aria-controls="section-artist"]').click();
        if (path === "discuss") {
          await page.getByText("Contact me to discuss", { exact: true }).click();
        } else {
          await page.locator('select[name="booking-0-artist"]').selectOption({ index: 1 });
        }
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }`,
      });
      await page.screenshot({
        path: `.impeccable/review/${viewport.name}-${theme}-${path}.png`,
        fullPage: true,
      });
      await page.close();
    }
  }
}

await browser.close();
