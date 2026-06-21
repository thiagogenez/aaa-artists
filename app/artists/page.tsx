import type { Metadata } from "next";
import ArtistsView from "./ArtistsView";

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Browse the AAA Artists roster — DJs and producers across trance, progressive, techno and hardstyle. View a profile or book an artist for your event.",
  alternates: { canonical: "/artists" },
  openGraph: {
    title: "Artists — AAA Artists",
    description:
      "Browse the AAA Artists roster across trance, progressive, techno and hardstyle.",
    url: "/artists",
  },
};

export default function ArtistsPage() {
  return <ArtistsView />;
}
