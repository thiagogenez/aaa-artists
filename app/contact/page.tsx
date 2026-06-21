import type { Metadata } from "next";
import ContactView from "./ContactView";

export const metadata: Metadata = {
  title: "Book an Artist",
  description:
    "Send a booking enquiry for an AAA Artists DJ. Share the date, venue, capacity and budget and we'll get back to you within 48 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Book an Artist — AAA Artists",
    description: "Send a booking enquiry for an AAA Artists DJ.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return <ContactView />;
}
