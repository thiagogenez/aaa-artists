// ⚠️ Do not edit artist content here. The data lives in friendly YAML files:
//
//     data/artists/01-xijaro-pitch.yml, 02-c-systems.yml, …
//
// Editing one of those and running `npm run dev` / `npm run build` (or
// `npm run gen:artists`) regenerates data/artists.data.json, which is imported
// below. Run `npm run check` to validate the YAML before publishing.
import data from "./artists.data.json";
import type { NightMomentId, SoundStyleId } from "./artist-discovery";

export interface Gig {
  date: string;
  eventId?: string;
  venue: string;
  city: string;
  country: string;
  ticketLink?: string;
  ticketStatus?: "available" | "sold-out" | "unavailable";
  /** No ticket needed — the card says "Free entry" instead of "Tickets soon".
   *  Mutually exclusive with ticketStatus: a free event has no ticket
   *  availability to report. A ticketLink may still be set for an RSVP page. */
  freeEntry?: boolean;
  /** Optional flyer artwork for the event — e.g. "/flyers/xijaro-utrecht.jpg".
   *  When omitted, a generated poster card is shown from the gig details. */
  flyer?: string;
}

export interface Artist {
  artistType: "solo" | "group";
  name: string;
  slug: string;
  genre: string;
  tagline: string;
  bio: string;
  image: string;
  soundProfiles: {
    style: SoundStyleId;
    bpm: {
      min: number;
      max: number;
    };
    moments: NightMomentId[];
  }[];
  socials: {
    instagram?: string;
    soundcloud?: string;
    facebook?: string;
    spotify?: string;
    youtube?: string;
    beatport?: string;
    website?: string;
  };
  /** Optional live-player embed shown as a media box on the artist page:
   *  a Spotify artist/album/track/playlist URL. The "Listen" section is
   *  audio-only, so there is no YouTube equivalent. */
  spotifyEmbed?: string;
  /** All gigs, oldest to newest. The date decides past vs upcoming at render
   *  time; future-dated entries carry a stable eventId, reused across artists
   *  sharing an event. */
  gigs: Gig[];
}

export const artists: Artist[] = data as Artist[];

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug);
}
