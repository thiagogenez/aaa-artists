export interface Gig {
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketLink?: string;
  /** Optional flyer artwork for the event — e.g. "/flyers/xijaro-utrecht.jpg".
   *  When omitted, a generated poster card is shown from the gig details. */
  flyer?: string;
}

export interface Artist {
  name: string;
  slug: string;
  genre: string;
  tagline: string;
  bio: string;
  image: string;
  socials: {
    instagram?: string;
    soundcloud?: string;
    facebook?: string;
    spotify?: string;
    youtube?: string;
    beatport?: string;
  };
  /** Optional live-player embeds shown as media boxes on the artist page.
   *  spotifyEmbed: a Spotify artist/album/track/playlist URL.
   *  youtubeEmbed: a single YouTube video or playlist URL. */
  spotifyEmbed?: string;
  youtubeEmbed?: string;
  pastGigs: Gig[];
  upcomingGigs: Gig[];
}

export const artists: Artist[] = [
  {
    name: "Xijaro & Pitch",
    slug: "xijaro-pitch",
    genre: "Trance / Progressive",
    tagline: "Melodic trance, built for big rooms",
    bio: "Xijaro & Pitch are a trance duo known for big, melodic productions and high-energy sets. Their tracks pair emotional melodies with driving progressive builds, and they've played major festivals and club residencies across Europe.",
    image: "/artists/xijaro-pitch.jpg",
    socials: {
      instagram: "https://instagram.com/xijaroandpitch",
      soundcloud: "https://soundcloud.com/xijaroandpitch",
      facebook: "https://facebook.com/xijaroandpitch",
      spotify: "https://open.spotify.com/artist/xijaroandpitch",
      beatport: "https://www.beatport.com/artist/xijaro-pitch/",
    },
    pastGigs: [
      { date: "2025-10-18", venue: "Privilege", city: "Ibiza", country: "Spain" },
      { date: "2025-08-02", venue: "Awakenings", city: "Amsterdam", country: "Netherlands" },
      { date: "2025-06-14", venue: "Fabric", city: "London", country: "UK" },
      { date: "2025-03-22", venue: "Exchange", city: "Los Angeles", country: "USA" },
    ],
    upcomingGigs: [
      { date: "2026-07-04", venue: "A State of Trance Festival", city: "Utrecht", country: "Netherlands", ticketLink: "#" },
      { date: "2026-08-15", venue: "Creamfields", city: "Daresbury", country: "UK", ticketLink: "#" },
    ],
  },
  {
    name: "C-Systems",
    slug: "c-systems",
    genre: "Progressive Trance",
    tagline: "Cinematic, driving progressive trance",
    bio: "C-Systems is a progressive trance producer with a cinematic, driving sound. His music has come out on several of the genre's respected labels, and his sets build from atmospheric openings into big peak-time moments.",
    image: "/artists/c-systems.jpg",
    socials: {
      instagram: "https://instagram.com/csystemsofficial",
      soundcloud: "https://soundcloud.com/c-systems",
      facebook: "https://facebook.com/csystems",
      beatport: "https://www.beatport.com/artist/c-systems/",
    },
    pastGigs: [
      { date: "2025-11-01", venue: "Trance Around The World", city: "Moscow", country: "Russia" },
      { date: "2025-09-20", venue: "Club Voltage", city: "Tokyo", country: "Japan" },
      { date: "2025-07-05", venue: "Untold Festival", city: "Cluj-Napoca", country: "Romania" },
    ],
    upcomingGigs: [
      { date: "2026-06-27", venue: "Luminosity Beach Festival", city: "Bloemendaal", country: "Netherlands", ticketLink: "#" },
    ],
  },
  {
    name: "Krevix",
    slug: "krevix",
    genre: "Techno / Dark Trance",
    tagline: "Techno intensity with a dark trance edge",
    bio: "Krevix blends the intensity of techno with the darker, emotional side of trance. His sets are loud and relentless, made for late nights and big rooms rather than easy listening.",
    image: "/artists/krevix.jpg",
    socials: {
      instagram: "https://instagram.com/krevix",
      soundcloud: "https://soundcloud.com/krevix",
      beatport: "https://www.beatport.com/artist/krevix/",
    },
    pastGigs: [
      { date: "2025-10-31", venue: "Berghain", city: "Berlin", country: "Germany" },
      { date: "2025-08-23", venue: "Time Warp", city: "Mannheim", country: "Germany" },
      { date: "2025-05-17", venue: "De School", city: "Amsterdam", country: "Netherlands" },
    ],
    upcomingGigs: [
      { date: "2026-09-12", venue: "Elrow", city: "Barcelona", country: "Spain", ticketLink: "#" },
    ],
  },
  {
    name: "FROGR",
    slug: "frogr",
    genre: "Melodic Techno / House",
    tagline: "Organic textures, hypnotic grooves",
    bio: "FROGR works in melodic techno and house, building tracks around organic percussion, hypnotic basslines and warm, atmospheric pads. His sets tend to start deep and patient before opening up into bigger, emotional moments.",
    image: "/artists/frogr.jpg",
    socials: {
      instagram: "https://instagram.com/frogr_music",
      soundcloud: "https://soundcloud.com/frogr",
      spotify: "https://open.spotify.com/artist/frogr",
    },
    pastGigs: [
      { date: "2025-09-06", venue: "Melt Festival", city: "Gräfenhainichen", country: "Germany" },
      { date: "2025-07-19", venue: "Sonar", city: "Barcelona", country: "Spain" },
      { date: "2025-04-11", venue: "fabric", city: "London", country: "UK" },
    ],
    upcomingGigs: [
      { date: "2026-07-18", venue: "Melt Festival", city: "Gräfenhainichen", country: "Germany", ticketLink: "#" },
      { date: "2026-08-30", venue: "Dekmantel", city: "Amsterdam", country: "Netherlands", ticketLink: "#" },
    ],
  },
  {
    name: "SAGO",
    slug: "sago",
    genre: "Progressive House / Trance",
    tagline: "Progressive house meets uplifting trance",
    bio: "SAGO moves between progressive house and uplifting trance, often inside the same set. He reads a room well and knows when to build tension and when to let it go, which keeps a dancefloor moving.",
    image: "/artists/sago.jpg",
    socials: {
      instagram: "https://instagram.com/sagomusic",
      soundcloud: "https://soundcloud.com/sago",
      facebook: "https://facebook.com/sagoofficial",
    },
    pastGigs: [
      { date: "2025-11-08", venue: "Ministry of Sound", city: "London", country: "UK" },
      { date: "2025-08-14", venue: "Pacha", city: "Ibiza", country: "Spain" },
      { date: "2025-06-21", venue: "Zouk Club", city: "Singapore", country: "Singapore" },
    ],
    upcomingGigs: [
      { date: "2026-06-20", venue: "Sensation", city: "Amsterdam", country: "Netherlands", ticketLink: "#" },
    ],
  },
  {
    name: "Thiago Genez",
    slug: "thiago",
    genre: "Progressive Trance / Melodic Techno / Hard Techno",
    tagline: "Brazil-born, London-based: trance meets techno",
    bio: "Thiago Genez is a Brazil-born, London-based DJ and London Sound Academy graduate who started in electronic music in 2018. What began as a side project turned into regular slots across London venues. His sets move between progressive and uplifting trance and the harder edge of melodic and hard techno. He has played Ministry of Sound, EGG LDN and Peckham Audio, and submitted a contest mix for Tomorrowland 2025.",
    image: "/artists/thiago.jpg",
    socials: {
      soundcloud: "https://soundcloud.com/thiagogenez",
      youtube: "https://youtube.com/thiagogenez",
      instagram: "https://instagram.com/thiagogenez",
    },
    pastGigs: [
      { date: "2025-03-01", venue: "Ministry of Sound", city: "London", country: "UK" },
      { date: "2024-11-15", venue: "EGG LDN", city: "London", country: "UK" },
      { date: "2024-08-20", venue: "Peckham Audio", city: "London", country: "UK" },
    ],
    upcomingGigs: [],
  },
  {
    name: "Mr B",
    slug: "mr-b",
    genre: "Hard Trance / Hardstyle",
    tagline: "The hardest sounds, the biggest rooms",
    bio: "Mr B plays hard trance and hardstyle, with a reputation for big festival sets and a no-compromise approach to the heavier stuff. The sound is loud, the kicks hit hard, and the crowd usually shows up ready for it.",
    image: "/artists/mr-b.jpg",
    socials: {
      instagram: "https://instagram.com/mrbofficial",
      soundcloud: "https://soundcloud.com/mrbdj",
      facebook: "https://facebook.com/mrbhardstyle",
      youtube: "https://youtube.com/@mrbdj",
    },
    pastGigs: [
      { date: "2025-12-06", venue: "Defqon.1", city: "Almere", country: "Netherlands" },
      { date: "2025-09-13", venue: "Qlimax", city: "Arnhem", country: "Netherlands" },
      { date: "2025-06-07", venue: "Hard Bass", city: "Arnhem", country: "Netherlands" },
    ],
    upcomingGigs: [
      { date: "2026-06-13", venue: "Defqon.1", city: "Almere", country: "Netherlands", ticketLink: "#" },
      { date: "2026-09-05", venue: "Qlimax", city: "Arnhem", country: "Netherlands", ticketLink: "#" },
    ],
  },
];

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug);
}
