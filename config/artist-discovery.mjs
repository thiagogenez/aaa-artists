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

// Discovery uses two distinct color families: a cool spectral progression for
// Trance and a warm heat progression for Techno. BPM is encoded by position in
// the Spectrum, so color consistently identifies style in both views.
export const SOUND_STYLE_COLORS = /** @type {const} */ ({
  "progressive-trance": "#65a2ff",
  "uplifting-trance": "#31d6e7",
  "tech-trance": "#63e694",
  "euro-trance": "#b27aff",
  "hard-trance": "#ff62b4",
  "melodic-techno": "#ffe44f",
  "peak-time-techno": "#ff9147",
  "hard-techno": "#ff4d68",
});

export const NIGHT_MOMENTS = /** @type {const} */ ([
  { id: "opening", label: "Opening" },
  { id: "warm-up", label: "Warm-up" },
  { id: "peak-time", label: "Peak-time" },
  { id: "closing", label: "Closing" },
]);
