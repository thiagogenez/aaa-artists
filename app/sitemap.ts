import type { MetadataRoute } from "next";
import { artists } from "@/data/artists";
import { PRIVACY_DETAILS_READY } from "@/config/privacy";
import { SITE_URL } from "@/lib/site";

// Static export friendly.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/artists`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/events`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.7 },
    ...(PRIVACY_DETAILS_READY
      ? [{ url: `${SITE_URL}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 }]
      : []),
  ];

  const artistPages: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${SITE_URL}/artist/${a.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pages, ...artistPages];
}
