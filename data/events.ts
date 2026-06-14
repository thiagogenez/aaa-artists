export interface PastEvent {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  displayDate: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  headliners: string[];
  lineup: string[];
  image: string;
  ticketUrl?: string;
  soundcloudUrl?: string;
  description: string;
}

export const events: PastEvent[] = [
  {
    id: "fusion-high-voltage-2026",
    title: "Fusion meets High Voltage",
    subtitle: "Allen Watts presents High Voltage Recordings",
    date: "2026-01-17",
    displayDate: "17 January 2026",
    time: "14:00 – 04:00",
    venue: "Basing House",
    address: "25 Kingsland Rd, London E2 8AA",
    city: "London",
    country: "United Kingdom",
    headliners: ["Allen Watts", "Artento Divini"],
    lineup: ["Allen Watts", "Artento Divini", "C-Systems", "0Gravity", "Sago", "Daniel Skyver", "FROGR", "Thiago Genez", "Jacque Evans"],
    image: "/events/fusion-high-voltage-2026.jpg",
    description:
      "AAA Events joined forces with Allen Watts' High Voltage Recordings label for a landmark night at Basing House. Nine acts across 14 hours of trance and progressive techno, headlined by Allen Watts and Artento Divini. One of the biggest lineups the Fusion series has ever assembled.",
  },
  {
    id: "fusion-london-2025",
    title: "AAA Presents Fusion",
    subtitle: "Fusion London — The Loft",
    date: "2025-01-18",
    displayDate: "18 January 2025",
    time: "14:00 – 21:00",
    venue: "Basing House, The Loft",
    address: "25 Kingsland Rd, London E2 8AA",
    city: "London",
    country: "United Kingdom",
    headliners: ["Allen Watts"],
    lineup: ["Allen Watts", "C-Systems", "Doppenberg", "Nina de Koning", "Orbyte", "Sago", "Andrew Sharpe", "MrB"],
    image: "/events/fusion-london-2025.jpg",
    soundcloudUrl: "https://soundcloud.com/aaaeventsofficial/sets/fusion-london-the-loft-jan-2025",
    description:
      "The debut Fusion event brought eight artists together for an afternoon marathon at Basing House's intimate Loft space in Shoreditch. Headlined by Allen Watts, the night showcased the full breadth of the AAA roster alongside international guests Nina de Koning and Doppenberg.",
  },
];
