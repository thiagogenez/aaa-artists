import { artists } from "@/data/artists";
import type { PrototypeArtist } from "./PrototypeRoster";

// Working discovery data for the interaction prototypes only. These values
// intentionally stay out of the canonical artist YAML until the model and the
// actual booking ranges have been reviewed.
const discoveryProfiles: Record<string, Pick<PrototypeArtist, "clusters" | "bpmCenter" | "bpmDelta">> = {
  "mr-b": { clusters: ["progressive"], bpmCenter: 130, bpmDelta: 4 },
  krevix: { clusters: ["progressive", "uplifting"], bpmCenter: 136, bpmDelta: 6 },
  "xijaro-pitch": { clusters: ["uplifting"], bpmCenter: 140, bpmDelta: 3 },
  "c-systems": { clusters: ["uplifting"], bpmCenter: 138, bpmDelta: 4 },
  sago: { clusters: ["uplifting"], bpmCenter: 140, bpmDelta: 3 },
  frogr: { clusters: ["uplifting", "peak"], bpmCenter: 142, bpmDelta: 6 },
  thiago: { clusters: ["uplifting", "peak", "hard"], bpmCenter: 145, bpmDelta: 15 },
};

export const prototypeArtists: PrototypeArtist[] = artists
  .filter((artist) => artist.slug in discoveryProfiles)
  .map((artist) => {
    const profile = discoveryProfiles[artist.slug];
    return {
      slug: artist.slug,
      name: artist.name,
      image: artist.image,
      tagline: artist.tagline,
      ...profile,
    };
  });
