import { artists } from "@/data/artists";
import ContactView from "./ContactView";
import { createPageMetadata } from "@/lib/site";

const description =
  "Send a booking enquiry for one or more AAA Artists DJs. Share the date, venue, capacity and budget and we'll get back to you within 48 hours.";

export const metadata = createPageMetadata({
  title: "Book Electronic Music DJs",
  description,
  path: "/contact",
  socialTitle: "Book Artists — AAA Artists",
  imageAlt: "Book AAA Artists",
});

export default function ContactPage() {
  // Only names/slugs reach the client — the dropdown and back link need nothing more.
  const artistOptions = artists.map((a) => ({ name: a.name, slug: a.slug }));
  return <ContactView artistOptions={artistOptions} />;
}
