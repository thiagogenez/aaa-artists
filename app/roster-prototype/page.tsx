import type { Metadata } from "next";
import { artists } from "@/data/artists";
import PrototypeRoster, { type PrototypeArtist } from "./PrototypeRoster";

export const metadata: Metadata = {
  title: "Interactive roster prototype",
  description: "A private interaction prototype for exploring the AAA Artists roster by sound.",
  robots: { index: false, follow: false },
};

const memberships: Record<string, PrototypeArtist["clusters"]> = {
  "mr-b": ["progressive"],
  krevix: ["progressive", "uplifting"],
  "xijaro-pitch": ["uplifting"],
  "c-systems": ["uplifting"],
  sago: ["uplifting"],
  frogr: ["uplifting", "peak"],
  thiago: ["uplifting", "peak", "hard"],
};

export default function RosterPrototypePage() {
  const prototypeArtists: PrototypeArtist[] = artists
    .filter((artist) => artist.slug in memberships)
    .map((artist) => ({
      slug: artist.slug,
      name: artist.name,
      image: artist.image,
      tagline: artist.tagline,
      clusters: memberships[artist.slug],
    }));

  return <PrototypeRoster artists={prototypeArtists} />;
}
