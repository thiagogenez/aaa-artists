import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Static export friendly.
export const dynamic = "force-static";

// `host` is deliberately omitted: it is not part of RFC 9309, Google has never
// supported it, and Yandex dropped it in 2018 — it only gave robots.txt
// validators another line to flag.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
