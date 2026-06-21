// Canonical site URL, used for metadata, sitemap and robots.
// Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. in Vercel project settings).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://aaa-artists.vercel.app";

export const SITE_NAME = "AAA Artists";
export const SITE_DESCRIPTION =
  "AAA Artists represents world-class electronic music artists across trance, techno, progressive and beyond. Book our artists for your event.";
