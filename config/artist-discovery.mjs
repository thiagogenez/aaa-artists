// Shared editorial vocabulary for roster discovery. Keep identifiers stable:
// artist YAML uses them as content values, while labels remain free to evolve.
export const BPM_DOMAIN = /** @type {const} */ ({ min: 120, max: 160 });

export const SOUND_GROUPS = /** @type {const} */ ([
  {
    id: "trance",
    label: "Trance",
    styles: [
      { id: "progressive-trance", label: "Progressive Trance" },
      { id: "uplifting-trance", label: "Uplifting Trance" },
      { id: "tech-trance", label: "Tech Trance" },
      { id: "hard-trance", label: "Hard Trance" },
      { id: "euro-trance", label: "Euro Trance" },
    ],
  },
  {
    id: "techno",
    label: "Techno",
    styles: [
      { id: "melodic-techno", label: "Melodic Techno" },
      { id: "peak-time-techno", label: "Peak-Time Techno" },
      { id: "hard-techno", label: "Hard Techno" },
    ],
  },
]);

export const NIGHT_MOMENTS = /** @type {const} */ ([
  { id: "opening", label: "Opening" },
  { id: "warm-up", label: "Warm-up" },
  { id: "peak-time", label: "Peak-time" },
  { id: "closing", label: "Closing" },
]);

// Preserved from the first roster prototype. In Spectrum these colors describe
// increasing tempo and energy, rather than claiming a fixed color per genre.
export const ENERGY_COLORS = /** @type {const} */ ([
  { bpm: 120, color: "#7768ff" },
  { bpm: 132, color: "#ff5c93" },
  { bpm: 142, color: "#ff7138" },
  { bpm: 150, color: "#d6ff46" },
]);
