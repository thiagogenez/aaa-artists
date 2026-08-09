import type { Metadata } from "next";
import PrototypeRoster from "./PrototypeRoster";
import { prototypeArtists } from "./prototypeData";

export const metadata: Metadata = {
  title: "Interactive roster prototype",
  description: "A private interaction prototype for exploring the AAA Artists roster by sound.",
  robots: { index: false, follow: false },
};

export default function RosterPrototypePage() {
  return <PrototypeRoster artists={prototypeArtists} version="v11" />;
}
