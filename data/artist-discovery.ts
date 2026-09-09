import {
  BPM_DOMAIN,
  ENERGY_COLORS,
  NIGHT_MOMENTS,
  SOUND_GROUPS,
  SOUND_STYLE_COLORS,
} from "@/config/artist-discovery.mjs";

export { BPM_DOMAIN, ENERGY_COLORS, NIGHT_MOMENTS, SOUND_GROUPS, SOUND_STYLE_COLORS };

export type SoundGroupId = (typeof SOUND_GROUPS)[number]["id"];
export type SoundStyleId = (typeof SOUND_GROUPS)[number]["styles"][number]["id"];
export type NightMomentId = (typeof NIGHT_MOMENTS)[number]["id"];

export function compareSoundStyleSpectrumOrder(
  left: { spectrumOrder: number },
  right: { spectrumOrder: number }
) {
  return left.spectrumOrder - right.spectrumOrder;
}

export const SOUND_STYLES = SOUND_GROUPS.flatMap((group) =>
  [...group.styles]
    .sort(compareSoundStyleSpectrumOrder)
    .map((style) => ({ ...style, groupId: group.id, groupLabel: group.label }))
);

export const SOUND_STYLE_BY_ID = new Map(SOUND_STYLES.map((style) => [style.id, style]));

export function getSoundStyle(styleId: SoundStyleId) {
  const style = SOUND_STYLE_BY_ID.get(styleId);
  if (!style) throw new Error(`Unknown sound style: ${styleId}`);
  return style;
}
