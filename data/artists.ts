export interface Gig {
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketLink?: string;
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
  pastGigs: Gig[];
  upcomingGigs: Gig[];
}

export const artists: Artist[] = [
  {
    name: "Xijaro & Pitch",
    slug: "xijaro-pitch",
    genre: "Trance / Progressive",
    tagline: "Masters of melodic trance architecture",
    bio: "Xijaro & Pitch are one of the most exciting duos in the trance scene, known for their emotionally charged productions and high-energy live performances. Their unique sound bridges melodic storytelling with driving progressive builds, earning them slots at the world's biggest festivals and residencies across Europe and beyond.",
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
    tagline: "Driving progressive sounds from the heart of Russia",
    bio: "C-Systems has carved a powerful reputation in the progressive trance world with a signature sound that is at once cinematic and relentless. His productions have graced the catalogues of the scene's most respected labels, and his DJ sets take crowds on a journey from atmospheric depths to explosive peaks.",
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
    tagline: "Raw energy meets dark industrial soundscapes",
    bio: "Krevix stands apart in the electronic music landscape with a sound that merges the raw intensity of techno with the emotional weight of dark trance. His sets are not for the faint-hearted — they are immersive, relentless experiences that leave audiences breathless and wanting more.",
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
    bio: "FROGR blends organic percussion, hypnotic basslines and lush atmospheric pads into a sound that is wholly his own. Rooted in the melodic techno and house tradition but always pushing boundaries, his performances are known for their meditative depth and powerful, emotive climaxes.",
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
    tagline: "Building bridges between genres and dancefloors",
    bio: "SAGO is a versatile artist who seamlessly navigates the space between progressive house and uplifting trance. With a deep understanding of crowd dynamics and an impeccable ear for music, SAGO crafts DJ sets that feel like a cohesive journey — building tension, releasing energy, and always leaving the crowd wanting the next chapter.",
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
    tagline: "Brazil-born, London-forged — where trance meets techno",
    bio: "Thiago Genez is a Brazil-born, London-based DJ and London Sound Academy alumni who began his journey in electronic music in 2018. What started as a passion project quickly evolved into a recognised presence across London's premier venues. His sound moves fluidly between the euphoria of progressive and uplifting trance and the raw intensity of melodic and hard techno — sets that take crowds on a journey through emotion, tension and release. He has performed at Ministry of Sound, EGG LDN and Peckham Audio, and submitted a contest mix for Tomorrowland 2025.",
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
    bio: "Mr B is a powerhouse of hard trance and hardstyle, with a reputation built on explosive festival performances and an uncompromising commitment to the harder end of the electronic spectrum. His sound is loud, his kicks are punishing, and his crowds are some of the most devoted in the scene.",
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
