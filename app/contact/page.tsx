import type { Metadata } from "next";
import { artists } from "@/data/artists";
import ContactView from "./ContactView";

export const metadata: Metadata = {
  title: "Book Artists",
  description:
    "Send a booking enquiry for one or more AAA Artists DJs. Share the date, venue, capacity and budget and we'll get back to you within 48 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Book Artists — AAA Artists",
    description: "Send a booking enquiry for one or more AAA Artists DJs.",
    url: "/contact",
  },
};

export default function ContactPage() {
  // Only names/slugs reach the client — the dropdown and back link need nothing more.
  const artistOptions = artists.map((a) => ({ name: a.name, slug: a.slug }));
  return <ContactView artistOptions={artistOptions} />;
}
