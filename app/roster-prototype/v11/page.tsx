import type { Metadata } from "next";
import PrototypeRoster from "../PrototypeRoster";
import { prototypeArtists } from "../prototypeData";

export const metadata: Metadata = {
  title: "Roster prototype V11 — BPM mixer",
  description: "AAA Artists roster prototype combining genre selection with an interactive BPM mixer.",
  robots: { index: false, follow: false },
};

export default function RosterPrototypeV11Page() {
  return <PrototypeRoster artists={prototypeArtists} version="v11" />;
}
