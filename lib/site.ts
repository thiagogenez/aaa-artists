import type { Metadata } from "next";
import {
  BOOKING_EMAIL,
  PRIVACY_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  SOCIAL_IMAGE,
  SOCIAL_LINKS,
} from "@/config/site";

export {
  BOOKING_EMAIL,
  PRIVACY_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SOCIAL_IMAGE,
  SOCIAL_LINKS,
};

// Canonical URLs always identify the real public site, including on previews.
export const SITE_URL = SITE_ORIGIN;

export function absoluteUrl(pathname = "/"): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  socialTitle?: string;
  image?: string;
  imageAlt?: string;
  absoluteTitle?: boolean;
  openGraphType?: "website" | "profile";
  robots?: Metadata["robots"];
};

export function createPageMetadata({
  title,
  description,
  path,
  socialTitle = `${title} — ${SITE_NAME}`,
  image = SOCIAL_IMAGE,
  imageAlt = socialTitle,
  absoluteTitle = false,
  openGraphType = "website",
  robots,
}: PageMetadataOptions): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
      type: openGraphType,
      images: [{ url: image, width: image === SOCIAL_IMAGE ? 1200 : undefined, height: image === SOCIAL_IMAGE ? 630 : undefined, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
    ...(robots && { robots }),
  };
}

export function sentenceDescription(value: string, maxLength = 160): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const candidate = clean.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
  if (sentenceEnd >= Math.floor(maxLength * 0.55)) return candidate.slice(0, sentenceEnd + 1);
  const wordEnd = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, wordEnd > 0 ? wordEnd : maxLength).trimEnd()}…`;
}

/** Escape characters that can prematurely close an inline JSON-LD script. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
