// Shared editorial vocabulary for roster discovery. Keep identifiers stable:
// artist YAML uses them as content values, while labels remain free to evolve.
// spectrumOrder moves from lower to higher typical tempo/energy within each
// group. It is a browsing aid, not a hard musical boundary.
export const BPM_DOMAIN = /** @type {const} */ ({ min: 120, max: 160 });

export const SOUND_GROUPS = /** @type {const} */ ([
  {
    id: "trance",
    label: "Trance",
    styles: [
      { id: "progressive-trance", label: "Progressive Trance", spectrumOrder: 10 },
      { id: "uplifting-trance", label: "Uplifting Trance", spectrumOrder: 20 },
      { id: "tech-trance", label: "Tech Trance", spectrumOrder: 30 },
      { id: "euro-trance", label: "Euro Trance", spectrumOrder: 40 },
      { id: "hard-trance", label: "Hard Trance", spectrumOrder: 50 },
    ],
  },
  {
    id: "techno",
    label: "Techno",
    styles: [
      { id: "melodic-techno", label: "Melodic Techno", spectrumOrder: 10 },
      { id: "peak-time-techno", label: "Peak-Time Techno", spectrumOrder: 20 },
      { id: "hard-techno", label: "Hard Techno", spectrumOrder: 30 },
    ],
  },
]);

// Grid taxonomy uses two distinct color families: a cool spectral progression
// for Trance and a warm heat progression for Techno. Spectrum energy colors
// remain separate because they encode tempo, not genre.
export const SOUND_STYLE_COLORS = /** @type {const} */ ({
  "progressive-trance": "#7177ff",
  "uplifting-trance": "#a866ff",
  "tech-trance": "#d84fda",
  "hard-trance": "#f13faf",
  "euro-trance": "#42bfff",
  "melodic-techno": "#f0b84b",
  "peak-time-techno": "#ff7938",
  "hard-techno": "#ff4354",
});

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
