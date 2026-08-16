// Public, non-secret facts shared by the Next.js build and Cloudflare Worker.
// Keep production identity and contact changes here so metadata, structured data,
// the form, footer, and delivery errors cannot drift apart.
export const SITE_NAME = "AAA Artists";
export const SITE_ORIGIN = "https://aaaartists.co";
export const SITE_HOSTNAME = "aaaartists.co";
export const SITE_DESCRIPTION =
  "AAA Artists is the booking and artist management agency from the team behind AAA Events. A trance-first roster reaching into techno, melodic techno, progressive and hard techno. Book our artists for your event.";
export const SOCIAL_IMAGE = "/og.png";

// Public booking identity. Incoming mail must be routed to the authorised AAA inbox,
// and staff must configure this address as their outbound alias so replies stay in
// the same customer-facing thread. Replace PRIVACY_EMAIL after Paul confirms the
// official privacy contact.
export const BOOKING_EMAIL = "bookings@aaaartists.co";
export const PRIVACY_EMAIL = BOOKING_EMAIL;

export const SOCIAL_LINKS = Object.freeze([
  {
    href: "https://www.instagram.com/aaaeventsofficial/",
    label: "Instagram",
    platform: "instagram",
  },
  {
    href: "https://www.soundcloud.com/aaaeventsofficial",
    label: "SoundCloud",
    platform: "soundcloud",
  },
  { href: "https://www.facebook.com/aaaeventsofficial", label: "Facebook", platform: "facebook" },
  {
    href: "https://www.youtube.com/channel/UCZFxKt8xkwG7_yPFKz3GyMw",
    label: "YouTube",
    platform: "youtube",
  },
]);
