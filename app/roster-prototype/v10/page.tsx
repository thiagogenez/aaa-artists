import type { Metadata } from "next";
import PrototypeRoster from "../PrototypeRoster";
import { prototypeArtists } from "../prototypeData";

export const metadata: Metadata = {
  title: "Roster prototype V10 — genre ranges",
  description: "Archived AAA Artists roster prototype using fixed genre and BPM ranges.",
  robots: { index: false, follow: false },
};

export default function RosterPrototypeV10Page() {
  return <PrototypeRoster artists={prototypeArtists} version="v10" />;
}
