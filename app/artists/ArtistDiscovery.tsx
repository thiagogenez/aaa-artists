"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  BPM_DOMAIN,
  NIGHT_MOMENTS,
  SOUND_GROUPS,
  SOUND_STYLE_COLORS,
  compareSoundStyleSpectrumOrder,
  getSoundStyle,
  type NightMomentId,
  type SoundGroupId,
  type SoundStyleId,
} from "@/data/artist-discovery";
import type { Artist } from "@/data/artists";
import styles from "./artists.module.css";

type DiscoveryArtist = Pick<Artist, "slug" | "name" | "image" | "soundProfiles">;
type SoundProfile = DiscoveryArtist["soundProfiles"][number];
type ViewMode = "grid" | "spectrum";
type OptionalGroup = "all" | SoundGroupId;
type RosterTransitionDirection = "expand" | "collapse" | "reorder";
type SpectrumFootprint = "idle" | "active" | "muted";
type SpectrumProfile = { artist: DiscoveryArtist; profile: SoundProfile };
type DiscoveryStyle = CSSProperties & {
  viewTransitionClass?: string;
} & Record<`--${string}`, string | number>;

const DEFAULT_BPM = { min: BPM_DOMAIN.min, max: BPM_DOMAIN.max };
const BPM_RULER_TICKS = Array.from(
  { length: (BPM_DOMAIN.max - BPM_DOMAIN.min) / 2 + 1 },
  (_, index) => BPM_DOMAIN.min + index * 2
);
const MIN_SUBSTRING_SEARCH_LENGTH = 3;
const ALL_SOUND_STYLE_IDS: readonly SoundStyleId[] = SOUND_GROUPS.flatMap((group) =>
  group.styles.map((style) => style.id)
);
const NO_SOUND_STYLES: readonly SoundStyleId[] = [];
const NO_NIGHT_MOMENTS: readonly NightMomentId[] = [];
const MOMENT_OPTIONS = NIGHT_MOMENTS;
const BOOKING_PROMPT_TRANSITION_STYLE: DiscoveryStyle = {
  viewTransitionClass: "roster-followup",
  viewTransitionName: "roster-followup",
};
let rosterTransitionSequence = 0;

function normalizeArtistSearch(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
}

function contextualStyleLabel(styleLabel: string, groupLabel: string) {
  const groupSuffix = ` ${groupLabel}`;
  return styleLabel.endsWith(groupSuffix) ? styleLabel.slice(0, -groupSuffix.length) : styleLabel;
}

function artistNameMatchRank(name: string, rawQuery: string) {
  const query = normalizeArtistSearch(rawQuery);
  if (query.length === 0) return 0;

  const normalizedName = normalizeArtistSearch(name);
  if (normalizedName === query) return 0;
  if (normalizedName.startsWith(query)) return 1;

  const words = normalizedName.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.some((word) => word.startsWith(query))) return 2;
  if (query.length >= MIN_SUBSTRING_SEARCH_LENGTH && normalizedName.includes(query)) return 3;

  return null;
}

function artistMatchesGridFilters(
  artist: DiscoveryArtist,
  selectedArtistSlugs: readonly string[],
  family: OptionalGroup,
  selectedStyles: readonly SoundStyleId[]
) {
  const nameMatches = selectedArtistSlugs.length === 0 || selectedArtistSlugs.includes(artist.slug);
  const soundMatches = artist.soundProfiles.some((profile) => {
    const style = getSoundStyle(profile.style);
    return (
      (family === "all" || style.groupId === family) &&
      (selectedStyles.length === 0 || selectedStyles.includes(profile.style))
    );
  });
  return nameMatches && soundMatches;
}

function getRosterTransitionDirection(currentCount: number, nextCount: number) {
  if (nextCount > currentCount) return "expand";
  if (nextCount < currentCount) return "collapse";
  return "reorder";
}

function transitionRoster(
  event: ReactMouseEvent<HTMLButtonElement>,
  direction: RosterTransitionDirection,
  update: () => void
) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimate =
    event.detail !== 0 &&
    !prefersReducedMotion &&
    typeof document.startViewTransition === "function";

  if (!canAnimate) {
    update();
    return;
  }

  const transitionSequence = ++rosterTransitionSequence;
  const root = document.documentElement;
  root.dataset.rosterTransition = direction;
  const transition = document.startViewTransition(() => {
    flushSync(update);
  });
  const clearTransitionDirection = () => {
    if (transitionSequence === rosterTransitionSequence) {
      delete root.dataset.rosterTransition;
    }
  };
  void transition.finished.then(clearTransitionDirection, clearTransitionDirection);
}

function distanceFromRange(profile: SoundProfile, selectedMin: number, selectedMax: number) {
  if (profile.bpm.max >= selectedMin && profile.bpm.min <= selectedMax) return 0;
  return profile.bpm.max < selectedMin
    ? selectedMin - profile.bpm.max
    : profile.bpm.min - selectedMax;
}

function bpmAffinity(distance: number) {
  if (distance === 0) return 1;
  if (distance <= 3) return 0.68;
  if (distance <= 6) return 0.4;
  return 0.14;
}

function profileAffinity(
  profile: SoundProfile,
  family: OptionalGroup,
  selectedStyles: readonly SoundStyleId[],
  selectedMoments: readonly NightMomentId[],
  bpmMin: number,
  bpmMax: number
) {
  const style = getSoundStyle(profile.style);
  if (family !== "all" && style.groupId !== family) return 0.06;
  if (selectedStyles.length > 0 && !selectedStyles.includes(profile.style)) return 0.06;
  if (
    selectedMoments.length > 0 &&
    !selectedMoments.some((momentId) => profile.moments.includes(momentId))
  ) {
    return 0.1;
  }
  return bpmAffinity(distanceFromRange(profile, bpmMin, bpmMax));
}

function selectedStyleMatchOrder(artist: DiscoveryArtist, selectedStyles: readonly SoundStyleId[]) {
  const artistStyles = new Set(artist.soundProfiles.map((profile) => profile.style));
  return selectedStyles
    .filter((style) => artistStyles.has(style))
    .map((style) => getSoundStyle(style).spectrumOrder)
    .sort((left, right) => left - right);
}

function compareStyleMatchOrder(left: readonly number[], right: readonly number[]) {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function profileColor(profile: SoundProfile) {
  return SOUND_STYLE_COLORS[profile.style];
}

function compareSpectrumProfiles(left: SpectrumProfile, right: SpectrumProfile) {
  return (
    left.profile.bpm.min - right.profile.bpm.min ||
    left.profile.bpm.max - right.profile.bpm.max ||
    left.artist.name.localeCompare(right.artist.name, "en", { sensitivity: "base" })
  );
}

function profilePosition(profile: SoundProfile): DiscoveryStyle {
  const span = BPM_DOMAIN.max - BPM_DOMAIN.min;
  return {
    "--profile-left": `${((profile.bpm.min - BPM_DOMAIN.min) / span) * 100}%`,
    "--profile-width": `${((profile.bpm.max - profile.bpm.min) / span) * 100}%`,
    "--profile-color": profileColor(profile),
  };
}

function getStyleCoverage(profiles: readonly SoundProfile[]) {
  if (profiles.length === 0) return null;

  const min = Math.min(...profiles.map((profile) => profile.bpm.min));
  const max = Math.max(...profiles.map((profile) => profile.bpm.max));
  const span = BPM_DOMAIN.max - BPM_DOMAIN.min;
  return {
    min,
    max,
    style: {
      "--coverage-left": `${((min - BPM_DOMAIN.min) / span) * 100}%`,
      "--coverage-width": `${((max - min) / span) * 100}%`,
    } as DiscoveryStyle,
  };
}

function getProfileBpmMatch(
  profile: SoundProfile,
  selectedMin: number,
  selectedMax: number,
  isFiltered: boolean
) {
  const profileSpan = Math.max(profile.bpm.max - profile.bpm.min, 1);
  const overlapMin = Math.max(profile.bpm.min, selectedMin);
  const overlapMax = Math.min(profile.bpm.max, selectedMax);
  const overlap = Math.max(overlapMax - overlapMin, 0);
  const state = !isFiltered
    ? "full"
    : overlap === 0
      ? "none"
      : overlap === profileSpan
        ? "full"
        : "partial";

  return {
    state,
    style: {
      "--bpm-match-left": `${((overlapMin - profile.bpm.min) / profileSpan) * 100}%`,
      "--bpm-match-width": `${(overlap / profileSpan) * 100}%`,
    } as DiscoveryStyle,
  };
}

function BpmRangeControl({
  bpmMin,
  bpmMax,
  rangeStyle,
  onMinimumChange,
  onMaximumChange,
}: {
  bpmMin: number;
  bpmMax: number;
  rangeStyle: DiscoveryStyle;
  onMinimumChange: (value: number) => void;
  onMaximumChange: (value: number) => void;
}) {
  return (
    <div className={styles.spectrumRangeControl} style={rangeStyle}>
      <span className={styles.rangeTrack} aria-hidden="true">
        <span className={styles.rangeSelection} data-bpm-slider-selection="true" />
      </span>
      <input
        type="range"
        min={BPM_DOMAIN.min}
        max={BPM_DOMAIN.max - 1}
        value={bpmMin}
        data-edge={bpmMin === BPM_DOMAIN.min ? "start" : undefined}
        aria-label="Minimum BPM"
        onChange={(event) => onMinimumChange(Number(event.target.value))}
      />
      <input
        type="range"
        min={BPM_DOMAIN.min + 1}
        max={BPM_DOMAIN.max}
        value={bpmMax}
        data-edge={bpmMax === BPM_DOMAIN.max ? "end" : undefined}
        aria-label="Maximum BPM"
        onChange={(event) => onMaximumChange(Number(event.target.value))}
      />
    </div>
  );
}

function cardBadgeLabel(label: string, family: OptionalGroup) {
  if (family === "trance") return label.replace(/ Trance$/, "");
  if (family === "techno") return label.replace(/ Techno$/, "");
  return label;
}

function ArtistCard({
  artist,
  profile,
  family,
  selectedStyles,
  highlighted,
  priority,
}: {
  artist: DiscoveryArtist;
  profile: SoundProfile;
  family: OptionalGroup;
  selectedStyles: readonly SoundStyleId[];
  highlighted: boolean;
  priority: boolean;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const badges =
    family === "all"
      ? SOUND_GROUPS.filter((group) =>
          artist.soundProfiles.some(
            (artistProfile) => getSoundStyle(artistProfile.style).groupId === group.id
          )
        ).map((group) => ({ id: group.id, label: group.label, color: undefined }))
      : artist.soundProfiles
          .filter((artistProfile) => getSoundStyle(artistProfile.style).groupId === family)
          .map((artistProfile) => {
            const style = getSoundStyle(artistProfile.style);
            return { id: style.id, label: style.label, color: SOUND_STYLE_COLORS[style.id] };
          });
  const cardStyle: DiscoveryStyle = {
    "--style-color": SOUND_STYLE_COLORS[profile.style],
    viewTransitionClass: "roster-card",
    viewTransitionName: `artist-${artist.slug}`,
  };
  const profileHref = `/artist/${artist.slug}`;
  const actionsId = `artist-card-${artist.slug}-actions`;

  return (
    <article
      className={styles.artistCard}
      style={cardStyle}
      data-highlighted={highlighted ? "true" : "false"}
      data-open={actionsOpen ? "true" : "false"}
    >
      <span className={styles.artistVisual}>
        <span className={styles.artistImage}>
          <Image
            src={artist.image}
            alt={artist.name}
            fill
            priority={priority}
            className={styles.artistPhoto}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
        </span>

        <span className={styles.artistWash} aria-hidden="true" />

        <span className={styles.artistResting}>
          <strong>{artist.name}</strong>
          <span className={styles.artistBadges}>
            {badges.map((badge) => (
              <span
                key={badge.id}
                className={`${styles.styleBadge} ${family === "all" ? styles.genreBadge : ""}`}
                style={
                  badge.color ? ({ "--badge-color": badge.color } as DiscoveryStyle) : undefined
                }
                data-colored={badge.color ? "true" : "false"}
                data-selected={
                  badge.color && selectedStyles.includes(badge.id as SoundStyleId)
                    ? "true"
                    : "false"
                }
              >
                <span className={styles.styleBadgeText}>{cardBadgeLabel(badge.label, family)}</span>
              </span>
            ))}
          </span>
        </span>

        <button
          type="button"
          className={styles.cardRevealButton}
          aria-expanded={actionsOpen}
          aria-controls={actionsId}
          aria-label={`${actionsOpen ? "Hide" : "Show"} actions for ${artist.name}`}
          onClick={() => setActionsOpen((current) => !current)}
        >
          <span className={styles.tapHint}>Tap</span>
        </button>

        <span id={actionsId} className={styles.artistActions}>
          <Link href={profileHref} aria-label={`View ${artist.name} profile`}>
            View Profile
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </Link>
          <Link
            href={`/contact?artist=${encodeURIComponent(artist.name)}`}
            aria-label={`Book ${artist.name}`}
          >
            Book {artist.name}
          </Link>
        </span>
      </span>
    </article>
  );
}

function SpectrumEntry({
  artist,
  profile,
  affinity,
  bpmMin,
  bpmMax,
  bpmIsFiltered,
  styleLabel,
  footprint,
  selected,
  onArtistHover,
  onArtistFocus,
  onArtistToggle,
}: {
  artist: DiscoveryArtist;
  profile: SoundProfile;
  affinity: number;
  bpmMin: number;
  bpmMax: number;
  bpmIsFiltered: boolean;
  styleLabel: string;
  footprint: SpectrumFootprint;
  selected: boolean;
  onArtistHover: (slug: string | null) => void;
  onArtistFocus: (slug: string | null) => void;
  onArtistToggle: (slug: string) => void;
}) {
  const bpmMatch = getProfileBpmMatch(profile, bpmMin, bpmMax, bpmIsFiltered);
  const entryStyle: DiscoveryStyle = {
    ...profilePosition(profile),
    ...bpmMatch.style,
    "--match-opacity": affinity,
  };

  return (
    <div className={styles.spectrumLane}>
      <button
        type="button"
        className={styles.spectrumEntry}
        style={entryStyle}
        aria-label={`${artist.name}, ${styleLabel}, ${profile.bpm.min} to ${profile.bpm.max} BPM`}
        aria-pressed={selected}
        data-artist={artist.slug}
        data-style-label={styleLabel}
        data-footprint={footprint}
        data-bpm-match={bpmMatch.state}
        onPointerMove={(event) => {
          if (event.pointerType !== "touch") onArtistHover(artist.slug);
        }}
        onMouseLeave={() => onArtistHover(null)}
        onFocus={() => onArtistFocus(artist.slug)}
        onBlur={() => onArtistFocus(null)}
        onClick={(event) => {
          onArtistToggle(artist.slug);
          if (selected) event.currentTarget.blur();
        }}
      >
        <span
          className={styles.spectrumEntryLabel}
          data-align={profile.bpm.max >= 149 ? "end" : "start"}
        >
          <span className={styles.spectrumAvatar} aria-hidden="true">
            <Image src={artist.image} alt="" fill sizes="24px" />
          </span>
          <span>{artist.name}</span>
        </span>
        <span className={styles.spectrumRange} data-bpm-profile-range="true" aria-hidden="true">
          {bpmMatch.state !== "none" && (
            <span className={styles.spectrumRangeMatch} data-bpm-overlap="true" />
          )}
        </span>
        <span
          className={styles.spectrumRangeValues}
          data-bpm-range-values="true"
          aria-hidden="true"
        >
          <span>{profile.bpm.min}</span>
          <span>{profile.bpm.max}</span>
        </span>
      </button>
    </div>
  );
}

export default function ArtistDiscovery({ artists }: { artists: DiscoveryArtist[] }) {
  const [view, setView] = useState<ViewMode>("grid");
  const [family, setFamily] = useState<OptionalGroup>("all");
  const [selectedStyles, setSelectedStyles] = useState<SoundStyleId[]>([]);
  const [visibleSpectrumStyles, setVisibleSpectrumStyles] = useState<SoundStyleId[]>([
    ...ALL_SOUND_STYLE_IDS,
  ]);
  const [selectedMoments, setSelectedMoments] = useState<NightMomentId[]>([]);
  const [bpmMin, setBpmMin] = useState<number>(DEFAULT_BPM.min);
  const [bpmMax, setBpmMax] = useState<number>(DEFAULT_BPM.max);
  const [query, setQuery] = useState("");
  const [selectedArtistSlugs, setSelectedArtistSlugs] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredSpectrumArtistSlug, setHoveredSpectrumArtistSlug] = useState<string | null>(null);
  const [focusedSpectrumArtistSlug, setFocusedSpectrumArtistSlug] = useState<string | null>(null);
  const [spectrumScrolled, setSpectrumScrolled] = useState(false);
  const [spectrumStylesPickerOpen, setSpectrumStylesPickerOpen] = useState(false);
  const [spectrumMomentPickerOpen, setSpectrumMomentPickerOpen] = useState(false);
  const spectrumStylesPickerRef = useRef<HTMLFieldSetElement>(null);
  const spectrumMomentPickerRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        spectrumStylesPickerRef.current &&
        !spectrumStylesPickerRef.current.contains(event.target)
      ) {
        setSpectrumStylesPickerOpen(false);
      }
      if (
        spectrumMomentPickerRef.current &&
        !spectrumMomentPickerRef.current.contains(event.target)
      ) {
        setSpectrumMomentPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const closeSpectrumStylesPicker = () => {
    setSpectrumStylesPickerOpen(false);
    spectrumStylesPickerRef.current
      ?.querySelector<HTMLButtonElement>("[data-picker-trigger]")
      ?.focus();
  };
  const closeSpectrumMomentPicker = () => {
    setSpectrumMomentPickerOpen(false);
    spectrumMomentPickerRef.current
      ?.querySelector<HTMLButtonElement>("[data-picker-trigger]")
      ?.focus();
  };
  const effectiveMoments = view === "spectrum" ? selectedMoments : NO_NIGHT_MOMENTS;
  const effectiveBpmMin = view === "spectrum" ? bpmMin : DEFAULT_BPM.min;
  const effectiveBpmMax = view === "spectrum" ? bpmMax : DEFAULT_BPM.max;

  const familyStyles =
    family === "all"
      ? []
      : [...(SOUND_GROUPS.find((group) => group.id === family)?.styles ?? [])].sort(
          compareSoundStyleSpectrumOrder
        );
  const familyLabel =
    family === "all" ? null : (SOUND_GROUPS.find((group) => group.id === family)?.label ?? family);
  const artistSuggestions = useMemo(() => {
    const normalizedQuery = normalizeArtistSearch(query);
    if (normalizedQuery.length === 0) return [];

    return artists
      .flatMap((artist, editorialIndex) => {
        const rank = artistNameMatchRank(artist.name, normalizedQuery);
        if (rank === null || selectedArtistSlugs.includes(artist.slug)) return [];
        return [{ artist, editorialIndex, rank }];
      })
      .sort((left, right) => left.rank - right.rank || left.editorialIndex - right.editorialIndex)
      .slice(0, 6)
      .map(({ artist }) => artist);
  }, [artists, query, selectedArtistSlugs]);
  const selectedArtists = selectedArtistSlugs.flatMap((slug) => {
    const artist = artists.find((candidate) => candidate.slug === slug);
    return artist ? [artist] : [];
  });
  const suggestionsVisible = suggestionsOpen && artistSuggestions.length > 0;
  const bpmIsFiltered =
    view === "spectrum" && (bpmMin !== DEFAULT_BPM.min || bpmMax !== DEFAULT_BPM.max);
  const effectiveFamily: OptionalGroup = view === "grid" ? family : "all";
  const effectiveStyles = view === "grid" ? selectedStyles : NO_SOUND_STYLES;

  const rankedArtists = useMemo(() => {
    return artists
      .map((artist, editorialIndex) => {
        const matchedStyleOrder = selectedStyleMatchOrder(artist, effectiveStyles);
        const rankedProfiles = artist.soundProfiles
          .map((profile, profileIndex) => ({
            profile,
            profileIndex,
            affinity: profileAffinity(
              profile,
              effectiveFamily,
              effectiveStyles,
              effectiveMoments,
              effectiveBpmMin,
              effectiveBpmMax
            ),
          }))
          .sort(
            (left, right) =>
              right.affinity - left.affinity || left.profileIndex - right.profileIndex
          );
        const nameMatches =
          selectedArtistSlugs.length === 0 || selectedArtistSlugs.includes(artist.slug);
        const affinity = (rankedProfiles[0]?.affinity ?? 0) * (nameMatches ? 1 : 0.04);
        return {
          artist,
          editorialIndex,
          profile: rankedProfiles[0]?.profile ?? artist.soundProfiles[0],
          affinity,
          matchedStyleOrder,
        };
      })
      .sort(
        (left, right) =>
          right.matchedStyleOrder.length - left.matchedStyleOrder.length ||
          compareStyleMatchOrder(left.matchedStyleOrder, right.matchedStyleOrder) ||
          right.affinity - left.affinity ||
          left.editorialIndex - right.editorialIndex
      );
  }, [
    artists,
    effectiveBpmMax,
    effectiveBpmMin,
    effectiveMoments,
    effectiveFamily,
    effectiveStyles,
    selectedArtistSlugs,
  ]);

  const gridArtists = useMemo(() => {
    return rankedArtists.filter(({ artist }) =>
      artistMatchesGridFilters(artist, selectedArtistSlugs, family, selectedStyles)
    );
  }, [family, rankedArtists, selectedArtistSlugs, selectedStyles]);
  const gridStyleCount = new Set(
    gridArtists.flatMap(({ artist }) =>
      artist.soundProfiles
        .filter((profile) => family === "all" || getSoundStyle(profile.style).groupId === family)
        .map((profile) => profile.style)
    )
  ).size;

  const transitionGridFilters = (
    event: ReactMouseEvent<HTMLButtonElement>,
    nextFamily: OptionalGroup,
    nextStyles: readonly SoundStyleId[]
  ) => {
    const nextCount = artists.filter((artist) =>
      artistMatchesGridFilters(artist, selectedArtistSlugs, nextFamily, nextStyles)
    ).length;
    transitionRoster(event, getRosterTransitionDirection(gridArtists.length, nextCount), () => {
      setFamily(nextFamily);
      setSelectedStyles([...nextStyles]);
    });
  };

  const commitArtistSelection = (nextArtistSlugs: readonly string[]) => {
    setSelectedArtistSlugs([...nextArtistSlugs]);
    setQuery("");
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const transitionArtistSelection = (
    event: ReactMouseEvent<HTMLButtonElement>,
    nextArtistSlugs: readonly string[]
  ) => {
    const nextCount = artists.filter((artist) =>
      artistMatchesGridFilters(artist, nextArtistSlugs, family, selectedStyles)
    ).length;
    transitionRoster(event, getRosterTransitionDirection(gridArtists.length, nextCount), () => {
      commitArtistSelection(nextArtistSlugs);
    });
  };

  const selectArtistSuggestion = (
    artist: DiscoveryArtist,
    event?: ReactMouseEvent<HTMLButtonElement>
  ) => {
    const nextArtistSlugs = [...selectedArtistSlugs, artist.slug];
    if (event) {
      transitionArtistSelection(event, nextArtistSlugs);
      return;
    }
    commitArtistSelection(nextArtistSlugs);
  };

  const toggleSpectrumArtist = (slug: string) => {
    commitArtistSelection(
      selectedArtistSlugs.includes(slug)
        ? selectedArtistSlugs.filter((selectedSlug) => selectedSlug !== slug)
        : [...selectedArtistSlugs, slug]
    );
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && query.length === 0 && selectedArtistSlugs.length > 0) {
      setSelectedArtistSlugs((current) => current.slice(0, -1));
      return;
    }

    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (artistSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestionIndex((current) => (current + 1) % artistSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestionIndex((current) =>
        current <= 0 ? artistSuggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter" && suggestionsVisible && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectArtistSuggestion(artistSuggestions[activeSuggestionIndex]);
    }
  };

  const allSpectrumGroups = useMemo(
    () =>
      SOUND_GROUPS.map((group) => ({
        ...group,
        styles: group.styles
          .flatMap((sound) => {
            const profiles = artists
              .flatMap((artist) =>
                artist.soundProfiles
                  .filter((profile) => profile.style === sound.id)
                  .map((profile) => ({ artist, profile }))
              )
              .sort(compareSpectrumProfiles);
            return profiles.length > 0 ? [{ ...sound, profiles }] : [];
          })
          .sort(compareSoundStyleSpectrumOrder),
      })).filter((group) => group.styles.length > 0),
    [artists]
  );
  const spectrumGroups = useMemo(
    () =>
      allSpectrumGroups
        .map((group) => ({
          ...group,
          styles: group.styles.filter((sound) => visibleSpectrumStyles.includes(sound.id)),
        }))
        .filter((group) => group.styles.length > 0),
    [allSpectrumGroups, visibleSpectrumStyles]
  );
  const availableSpectrumStyleIds = allSpectrumGroups.flatMap((group) =>
    group.styles.map((sound) => sound.id)
  );
  const visibleSpectrumStyleIds = availableSpectrumStyleIds.filter((styleId) =>
    visibleSpectrumStyles.includes(styleId)
  );
  const spectrumStylesCustomized =
    visibleSpectrumStyleIds.length !== availableSpectrumStyleIds.length;
  const gridFilterCount =
    Number(family !== "all") +
    Number(selectedStyles.length > 0) +
    Number(selectedArtistSlugs.length > 0);
  const spectrumMatchFilterCount =
    Number(selectedMoments.length > 0) +
    Number(bpmIsFiltered) +
    Number(selectedArtistSlugs.length > 0);
  const activeFilterCount =
    view === "grid" ? gridFilterCount : Number(spectrumStylesCustomized) + spectrumMatchFilterCount;
  const showClearFilters = activeFilterCount > 0;
  const matchFiltersActive = view === "grid" ? gridFilterCount > 0 : spectrumMatchFilterCount > 0;
  const allSpectrumProfiles = spectrumGroups.flatMap((group) =>
    group.styles.flatMap((sound) => sound.profiles.map(({ profile }) => profile))
  );
  const spectrumArtistCount = new Set(
    spectrumGroups.flatMap((group) =>
      group.styles.flatMap((sound) => sound.profiles.map(({ artist }) => artist.slug))
    )
  ).size;
  const bestMatches = matchFiltersActive
    ? view === "grid"
      ? rankedArtists.filter(({ affinity }) => affinity >= 0.99).length
      : artists.filter((artist) => {
          const nameMatches =
            selectedArtistSlugs.length === 0 || selectedArtistSlugs.includes(artist.slug);
          return (
            nameMatches &&
            artist.soundProfiles.some(
              (profile) =>
                visibleSpectrumStyles.includes(profile.style) &&
                profileAffinity(profile, "all", NO_SOUND_STYLES, selectedMoments, bpmMin, bpmMax) >=
                  0.99
            )
          );
        }).length
    : spectrumArtistCount;
  const rosterCoverage = getStyleCoverage(allSpectrumProfiles);
  const spectrumStyleCount = spectrumGroups.reduce(
    (count, group) => count + group.styles.length,
    0
  );
  const activeSpectrumArtistSlug = hoveredSpectrumArtistSlug ?? focusedSpectrumArtistSlug;
  const activeSpectrumArtist = activeSpectrumArtistSlug
    ? artists.find((artist) => artist.slug === activeSpectrumArtistSlug)
    : undefined;
  const selectedSpectrumGuideArtist = selectedArtists.length === 1 ? selectedArtists[0] : undefined;
  const spectrumGuideArtist = activeSpectrumArtist ?? selectedSpectrumGuideArtist;
  const spectrumGuideArtistSelected = spectrumGuideArtist
    ? selectedArtistSlugs.includes(spectrumGuideArtist.slug)
    : false;
  const spectrumGuideSelectedArtist = spectrumGuideArtistSelected ? spectrumGuideArtist : undefined;
  const activeArtistProfiles = spectrumGuideArtist?.soundProfiles.filter((profile) =>
    visibleSpectrumStyles.includes(profile.style)
  );
  const activeArtistCoverage = getStyleCoverage(activeArtistProfiles ?? []);

  const toggleSpectrumStyle = (styleId: SoundStyleId) => {
    setVisibleSpectrumStyles((current) =>
      current.includes(styleId)
        ? current.filter((candidate) => candidate !== styleId)
        : ALL_SOUND_STYLE_IDS.filter(
            (candidate) => current.includes(candidate) || candidate === styleId
          )
    );
  };

  const toggleSpectrumGroup = (groupId: SoundGroupId) => {
    const groupStyleIds = allSpectrumGroups
      .find((group) => group.id === groupId)
      ?.styles.map((sound) => sound.id);
    if (!groupStyleIds?.length) return;

    const allGroupStylesVisible = groupStyleIds.every((styleId) =>
      visibleSpectrumStyles.includes(styleId)
    );
    setVisibleSpectrumStyles((current) =>
      ALL_SOUND_STYLE_IDS.filter((styleId) =>
        allGroupStylesVisible
          ? current.includes(styleId) && !groupStyleIds.includes(styleId)
          : current.includes(styleId) || groupStyleIds.includes(styleId)
      )
    );
  };

  const toggleMoment = (momentId: NightMomentId) => {
    setSelectedMoments((current) =>
      current.includes(momentId)
        ? current.filter((candidate) => candidate !== momentId)
        : [...current, momentId]
    );
  };

  const resetFilters = () => {
    setFamily("all");
    setSelectedStyles([]);
    setVisibleSpectrumStyles([...ALL_SOUND_STYLE_IDS]);
    setSelectedMoments([]);
    setBpmMin(DEFAULT_BPM.min);
    setBpmMax(DEFAULT_BPM.max);
    setQuery("");
    setSelectedArtistSlugs([]);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const rangeStyle: DiscoveryStyle = {
    "--range-start": `${((bpmMin - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100}%`,
    "--range-end": `${((bpmMax - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100}%`,
  };
  return (
    <section className={styles.discovery} aria-label="Artist discovery">
      <div className={styles.discoveryBar} data-testid="discovery-toolbar">
        <fieldset className={styles.viewSwitch}>
          <legend className="sr-only">Roster view</legend>
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
            Grid
          </button>
          <button
            type="button"
            aria-pressed={view === "spectrum"}
            onClick={() => {
              if (view !== "spectrum") setSpectrumScrolled(false);
              setView("spectrum");
            }}
          >
            Spectrum
          </button>
        </fieldset>

        <button
          type="button"
          className={styles.mobileFilterToggle}
          aria-expanded={filtersOpen}
          aria-controls="artist-filters"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
            </svg>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </span>
        </button>
      </div>

      <div
        id="artist-filters"
        className={styles.filters}
        data-open={filtersOpen ? "true" : "false"}
        data-view={view}
      >
        <div className={`${styles.filterField} ${styles.searchField}`}>
          <label htmlFor="artist-search">Artists</label>
          <div className={styles.searchControl}>
            <div className={styles.searchInputShell}>
              {selectedArtists.length > 0 && (
                <ul className={styles.selectedArtists} aria-label="Selected artists">
                  {selectedArtists.map((artist) => (
                    <li key={artist.slug} className={styles.selectedArtist}>
                      <span>{artist.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${artist.name}`}
                        onClick={(event) =>
                          transitionArtistSelection(
                            event,
                            selectedArtistSlugs.filter((slug) => slug !== artist.slug)
                          )
                        }
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m4 4 8 8m0-8-8 8" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <input
                id="artist-search"
                type="search"
                role="combobox"
                value={query}
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="artist-search-suggestions"
                aria-expanded={suggestionsVisible}
                aria-activedescendant={
                  suggestionsVisible && activeSuggestionIndex >= 0
                    ? `artist-search-option-${artistSuggestions[activeSuggestionIndex]?.slug}`
                    : undefined
                }
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSuggestionsOpen(event.target.value.trim().length > 0);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setSuggestionsOpen(query.trim().length > 0)}
                onBlur={() => {
                  setSuggestionsOpen(false);
                  setActiveSuggestionIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={selectedArtists.length > 0 ? "Add another artist" : "Search by name"}
              />
            </div>
            <span className="sr-only" aria-live="polite">
              {selectedArtists.length === 0
                ? "No artists selected"
                : `${selectedArtists.length} ${
                    selectedArtists.length === 1 ? "artist" : "artists"
                  } selected`}
            </span>

            {suggestionsVisible && (
              <div
                id="artist-search-suggestions"
                className={styles.searchSuggestions}
                role="listbox"
                aria-label="Artist suggestions"
                aria-multiselectable="true"
              >
                {artistSuggestions.map((artist, index) => (
                  <button
                    key={artist.slug}
                    id={`artist-search-option-${artist.slug}`}
                    type="button"
                    role="option"
                    className={styles.searchSuggestion}
                    aria-selected="false"
                    data-active={activeSuggestionIndex === index ? "true" : "false"}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={(event) => selectArtistSuggestion(artist, event)}
                  >
                    <span>{artist.name}</span>
                    <small>Artist</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {view === "grid" ? (
          <>
            <div className={`${styles.choiceField} ${styles.genreChoices}`}>
              <fieldset>
                <legend>Genre</legend>
                <div>
                  <button
                    type="button"
                    aria-pressed={family === "all"}
                    onClick={(event) => transitionGridFilters(event, "all", [])}
                  >
                    All
                  </button>
                  {SOUND_GROUPS.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      aria-pressed={family === group.id}
                      onClick={(event) => transitionGridFilters(event, group.id, [])}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className={`${styles.choiceField} ${styles.styleChoices}`}>
              <fieldset>
                <legend>Style</legend>
                {family === "all" ? (
                  <p>Choose a genre to see its styles.</p>
                ) : (
                  <>
                    <div className={styles.styleSelectionSummary}>
                      <span role="status" aria-live="polite">
                        {selectedStyles.length === 0
                          ? `Showing all ${familyLabel} styles`
                          : `${selectedStyles.length} of ${familyStyles.length} styles selected`}
                      </span>
                      {selectedStyles.length > 0 && (
                        <button
                          type="button"
                          className={styles.clearStylesAction}
                          onClick={(event) => transitionGridFilters(event, family, [])}
                        >
                          Clear styles
                        </button>
                      )}
                    </div>
                    <div className={styles.styleOptions}>
                      {familyStyles.map((sound) => (
                        <button
                          key={sound.id}
                          type="button"
                          className={styles.styleChoice}
                          style={
                            { "--style-color": SOUND_STYLE_COLORS[sound.id] } as DiscoveryStyle
                          }
                          aria-label={sound.label}
                          aria-pressed={selectedStyles.includes(sound.id)}
                          onClick={(event) => {
                            const nextStyles = selectedStyles.includes(sound.id)
                              ? selectedStyles.filter((styleId) => styleId !== sound.id)
                              : [...selectedStyles, sound.id];
                            transitionGridFilters(event, family, nextStyles);
                          }}
                        >
                          {contextualStyleLabel(sound.label, familyLabel)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </fieldset>
            </div>
          </>
        ) : (
          <div className={`${styles.filterField} ${styles.spectrumStylesField}`}>
            <fieldset
              ref={spectrumStylesPickerRef}
              className={styles.spectrumStylesPicker}
              data-testid="spectrum-styles-picker"
              data-open={spectrumStylesPickerOpen ? "true" : "false"}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeSpectrumStylesPicker();
                }
              }}
            >
              <legend className={styles.filterLabel}>Styles shown</legend>
              <button
                type="button"
                className={styles.spectrumPickerTrigger}
                data-picker-trigger
                aria-expanded={spectrumStylesPickerOpen}
                aria-controls="spectrum-styles-panel"
                onClick={() => {
                  setSpectrumStylesPickerOpen((current) => {
                    if (!current) setSpectrumMomentPickerOpen(false);
                    return !current;
                  });
                }}
              >
                <span>
                  {visibleSpectrumStyleIds.length === availableSpectrumStyleIds.length
                    ? `All ${availableSpectrumStyleIds.length} styles`
                    : `${visibleSpectrumStyleIds.length} of ${availableSpectrumStyleIds.length} styles`}
                </span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
              {spectrumStylesPickerOpen && (
                <div id="spectrum-styles-panel" className={styles.spectrumStylesPanel}>
                  {allSpectrumGroups.map((group) => {
                    const visibleCount = group.styles.filter((sound) =>
                      visibleSpectrumStyles.includes(sound.id)
                    ).length;
                    const allGroupStylesVisible = visibleCount === group.styles.length;
                    return (
                      <section
                        key={group.id}
                        className={styles.spectrumStylesGroup}
                        aria-label={`${group.label} styles`}
                      >
                        <header className={styles.spectrumStylesGroupHeader}>
                          <strong>{group.label}</strong>
                          <button
                            type="button"
                            aria-label={`${allGroupStylesVisible ? "Hide" : "Show"} all ${group.label} styles`}
                            onClick={() => toggleSpectrumGroup(group.id)}
                          >
                            {allGroupStylesVisible ? "Hide all" : "Show all"}
                          </button>
                        </header>
                        <div className={styles.spectrumStyleOptions}>
                          {group.styles.map((sound) => (
                            <div
                              key={sound.id}
                              className={styles.spectrumStyleOptionRow}
                              data-spectrum-style-option={sound.id}
                              style={
                                {
                                  "--style-color": SOUND_STYLE_COLORS[sound.id],
                                } as DiscoveryStyle
                              }
                            >
                              <label className={styles.spectrumStyleOption}>
                                <input
                                  type="checkbox"
                                  checked={visibleSpectrumStyles.includes(sound.id)}
                                  onChange={() => toggleSpectrumStyle(sound.id)}
                                />
                                <span>{sound.label}</span>
                              </label>
                              <button
                                type="button"
                                className={styles.spectrumStyleOnly}
                                aria-label={`Show only ${sound.label}`}
                                onClick={() => setVisibleSpectrumStyles([sound.id])}
                              >
                                Show only
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  <footer className={styles.spectrumPickerFooter}>
                    <button
                      type="button"
                      disabled={!spectrumStylesCustomized}
                      onClick={() => setVisibleSpectrumStyles([...ALL_SOUND_STYLE_IDS])}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className={styles.spectrumPickerDone}
                      onClick={closeSpectrumStylesPicker}
                    >
                      Done
                    </button>
                  </footer>
                </div>
              )}
            </fieldset>
          </div>
        )}

        {view === "spectrum" && (
          <div className={`${styles.filterField} ${styles.momentFilter}`}>
            <fieldset
              ref={spectrumMomentPickerRef}
              className={styles.spectrumStylesPicker}
              data-testid="spectrum-moment-picker"
              data-open={spectrumMomentPickerOpen ? "true" : "false"}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeSpectrumMomentPicker();
                }
              }}
            >
              <legend id="artist-moment-label" className={styles.filterLabel}>
                Moment
              </legend>
              <button
                type="button"
                className={styles.spectrumPickerTrigger}
                data-picker-trigger
                aria-labelledby="artist-moment-label artist-moment-value"
                aria-expanded={spectrumMomentPickerOpen}
                aria-controls="spectrum-moment-options"
                onClick={() => {
                  setSpectrumMomentPickerOpen((current) => {
                    if (!current) setSpectrumStylesPickerOpen(false);
                    return !current;
                  });
                }}
              >
                <span id="artist-moment-value">
                  {selectedMoments.length === 0
                    ? "Any moment"
                    : selectedMoments.length === 1
                      ? MOMENT_OPTIONS.find((item) => item.id === selectedMoments[0])?.label
                      : `${selectedMoments.length} moments`}
                </span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
              {spectrumMomentPickerOpen && (
                <div
                  id="spectrum-moment-options"
                  className={`${styles.spectrumStylesPanel} ${styles.spectrumMomentPanel}`}
                >
                  {MOMENT_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.spectrumMomentOption}
                      aria-pressed={selectedMoments.includes(item.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleMoment(item.id);
                      }}
                    >
                      <span className={styles.spectrumMomentIndicator} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <footer className={styles.spectrumPickerFooter}>
                    <button
                      type="button"
                      disabled={selectedMoments.length === 0}
                      onClick={() => setSelectedMoments([])}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className={styles.spectrumPickerDone}
                      onClick={closeSpectrumMomentPicker}
                    >
                      Done
                    </button>
                  </footer>
                </div>
              )}
            </fieldset>
          </div>
        )}

        {(view === "grid" || showClearFilters) && (
          <footer className={styles.filtersReset}>
            {view === "grid" && (
              <p className={styles.gridResultSummary} data-testid="grid-summary" aria-live="polite">
                <strong>{gridArtists.length}</strong>{" "}
                {gridArtists.length === 1 ? "artist" : "artists"} ·{" "}
                <strong>{gridStyleCount}</strong> {gridStyleCount === 1 ? "style" : "styles"}
              </p>
            )}
            {showClearFilters && (
              <button type="button" className={styles.clearFiltersButton} onClick={resetFilters}>
                Clear all filters
              </button>
            )}
          </footer>
        )}
      </div>

      {view === "spectrum" && (
        <div className={styles.resultBar} aria-live="polite">
          <p>
            <span data-testid="spectrum-summary">
              <strong>{spectrumArtistCount}</strong>{" "}
              {spectrumArtistCount === 1 ? "artist" : "artists"} ·{" "}
              <strong>{spectrumStyleCount}</strong> {spectrumStyleCount === 1 ? "style" : "styles"}
              {rosterCoverage && (
                <span>
                  {" "}
                  ·{" "}
                  <strong>
                    {rosterCoverage.min}–{rosterCoverage.max}
                  </strong>{" "}
                  BPM
                </span>
              )}
              {activeFilterCount > 0 && (
                <span>
                  · <strong>{bestMatches}</strong> best {bestMatches === 1 ? "match" : "matches"}
                </span>
              )}
            </span>
          </p>
        </div>
      )}

      {view === "grid" ? (
        gridArtists.length > 0 ? (
          <div className={styles.artistGrid} data-testid="artist-grid">
            {gridArtists.map(({ artist, profile, affinity }, index) => (
              <ArtistCard
                key={artist.slug}
                artist={artist}
                profile={profile}
                family={family}
                selectedStyles={selectedStyles}
                highlighted={activeFilterCount > 0 && affinity >= 0.99}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyGrid} data-testid="artist-grid">
            <strong>No artists match these filters.</strong>
            <p>Try another genre, style or artist name.</p>
          </div>
        )
      ) : (
        <div
          className={styles.spectrum}
          data-testid="artist-spectrum"
          data-bpm-filtered={bpmIsFiltered ? "true" : "false"}
          style={rangeStyle}
        >
          <div className={styles.spectrumGuide} aria-live="polite">
            <div className={styles.spectrumGuideCopy}>
              {spectrumGuideArtist && activeArtistCoverage ? (
                <strong>
                  {spectrumGuideArtistSelected ? "Selected: " : ""}
                  {spectrumGuideArtist.name} · {activeArtistProfiles?.length ?? 0} visible{" "}
                  {activeArtistProfiles?.length === 1 ? "style" : "styles"} ·{" "}
                  {activeArtistCoverage.min}–{activeArtistCoverage.max} BPM
                </strong>
              ) : selectedArtists.length > 1 ? (
                <strong>{selectedArtists.length} artists selected for comparison.</strong>
              ) : (
                <>
                  <strong className={styles.spectrumPointerGuide}>
                    Point to trace every style. Select to compare.
                  </strong>
                  <strong className={styles.spectrumTouchGuide}>
                    Tap an artist to trace every style and compare.
                  </strong>
                </>
              )}
              <span>
                {selectedArtists.length > 1 && !activeSpectrumArtist
                  ? "Point to an artist to inspect its range."
                  : "Each artist appears in every style they play."}
              </span>
            </div>

            {selectedArtists.length === 1 && spectrumGuideSelectedArtist && (
              <nav
                className={styles.spectrumGuideActions}
                aria-label={`Actions for ${spectrumGuideSelectedArtist.name}`}
              >
                <Link href={`/artist/${spectrumGuideSelectedArtist.slug}`}>View profile</Link>
                <Link
                  href={`/contact?artist=${encodeURIComponent(spectrumGuideSelectedArtist.name)}`}
                >
                  Book artist
                </Link>
                <button
                  type="button"
                  onClick={() => toggleSpectrumArtist(spectrumGuideSelectedArtist.slug)}
                >
                  Remove
                </button>
              </nav>
            )}

            {selectedArtists.length > 1 && (
              <button
                type="button"
                className={styles.spectrumClearSelection}
                onClick={() => commitArtistSelection([])}
              >
                Clear selected
              </button>
            )}
          </div>

          <div
            className={styles.spectrumViewportShell}
            data-scroll-hint={spectrumScrolled ? "false" : "true"}
          >
            <div className={styles.spectrumScrollHint} aria-hidden="true">
              <span>Swipe for higher BPM</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </div>
            <section
              className={styles.spectrumViewport}
              aria-label="Artist BPM spectrum"
              onScroll={(event) => {
                if (event.currentTarget.scrollLeft > 12) setSpectrumScrolled(true);
              }}
            >
              <div className={styles.spectrumDesktop}>
                <div className={styles.spectrumMobileRange} data-testid="spectrum-mobile-range">
                  <div className={styles.spectrumMobileRangeHeader}>
                    <span>BPM range</span>
                    <output aria-live="polite">
                      <strong>
                        {bpmMin}–{bpmMax}
                      </strong>
                      <small>{bpmIsFiltered ? "Selected" : "Full range"}</small>
                    </output>
                  </div>
                  <BpmRangeControl
                    bpmMin={bpmMin}
                    bpmMax={bpmMax}
                    rangeStyle={rangeStyle}
                    onMinimumChange={(value) => setBpmMin(Math.min(value, bpmMax - 1))}
                    onMaximumChange={(value) => setBpmMax(Math.max(value, bpmMin + 1))}
                  />
                  <div className={styles.spectrumMobileRangeLimits} aria-hidden="true">
                    <span>{BPM_DOMAIN.min}</span>
                    <span>{BPM_DOMAIN.max}</span>
                  </div>
                </div>
                <div className={styles.spectrumRuler} data-spectrum-ruler="true">
                  <span data-spectrum-axis-label="true">
                    <span>BPM</span>
                    <output aria-live="polite">
                      <strong>
                        {bpmMin}–{bpmMax}
                      </strong>
                      <small>{bpmIsFiltered ? "Selected range" : "Full range selected"}</small>
                    </output>
                  </span>
                  <div data-bpm-ruler-scale="true">
                    {BPM_RULER_TICKS.map((bpm) => {
                      const isMajor = bpm % 10 === 0;
                      return (
                        <span
                          key={bpm}
                          data-bpm-tick={bpm}
                          data-major={isMajor ? "true" : "false"}
                          data-in-range={bpm >= bpmMin && bpm <= bpmMax ? "true" : "false"}
                          aria-hidden="true"
                          style={
                            {
                              "--tick-position": `${
                                ((bpm - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100
                              }%`,
                            } as DiscoveryStyle
                          }
                        >
                          {isMajor ? bpm : null}
                        </span>
                      );
                    })}
                    <BpmRangeControl
                      bpmMin={bpmMin}
                      bpmMax={bpmMax}
                      rangeStyle={rangeStyle}
                      onMinimumChange={(value) => setBpmMin(Math.min(value, bpmMax - 1))}
                      onMaximumChange={(value) => setBpmMax(Math.max(value, bpmMin + 1))}
                    />
                  </div>
                </div>

                {spectrumGroups.length > 0 ? (
                  spectrumGroups.map((group) => (
                    <section
                      key={group.id}
                      className={styles.spectrumGroup}
                      data-spectrum-group={group.id}
                    >
                      <h2>{group.label}</h2>
                      {group.styles.map((sound) => {
                        const profiles = sound.profiles;
                        const coverage = getStyleCoverage(profiles.map(({ profile }) => profile));
                        const rowStyle = {
                          "--style-color": SOUND_STYLE_COLORS[sound.id],
                        } as DiscoveryStyle;
                        return (
                          <div
                            key={sound.id}
                            className={styles.spectrumRow}
                            style={rowStyle}
                            data-spectrum-style={sound.id}
                          >
                            <h3>
                              <span>{sound.label}</span>
                              {coverage && (
                                <small aria-hidden="true">
                                  <span data-spectrum-style-count>
                                    {profiles.length} {profiles.length === 1 ? "artist" : "artists"}
                                  </span>
                                  <span data-spectrum-style-bpm>
                                    {coverage.min}–{coverage.max} BPM
                                  </span>
                                </small>
                              )}
                            </h3>
                            <div className={styles.spectrumLanes}>
                              {coverage && (
                                <span
                                  className={styles.spectrumCoverage}
                                  style={coverage.style}
                                  data-spectrum-coverage="true"
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={styles.spectrumBpmWindow}
                                data-bpm-window="true"
                                aria-hidden="true"
                              />
                              {profiles.map(({ artist, profile }) => {
                                const nameMatches =
                                  selectedArtistSlugs.length === 0 ||
                                  selectedArtistSlugs.includes(artist.slug);
                                const affinity =
                                  profileAffinity(
                                    profile,
                                    "all",
                                    NO_SOUND_STYLES,
                                    selectedMoments,
                                    bpmMin,
                                    bpmMax
                                  ) * (nameMatches ? 1 : 0.08);
                                return (
                                  <SpectrumEntry
                                    key={artist.slug}
                                    artist={artist}
                                    profile={profile}
                                    affinity={affinity}
                                    bpmMin={bpmMin}
                                    bpmMax={bpmMax}
                                    bpmIsFiltered={bpmIsFiltered}
                                    styleLabel={sound.label}
                                    footprint={
                                      activeSpectrumArtistSlug === null
                                        ? "idle"
                                        : activeSpectrumArtistSlug === artist.slug ||
                                            selectedArtistSlugs.includes(artist.slug)
                                          ? "active"
                                          : "muted"
                                    }
                                    selected={selectedArtistSlugs.includes(artist.slug)}
                                    onArtistHover={setHoveredSpectrumArtistSlug}
                                    onArtistFocus={setFocusedSpectrumArtistSlug}
                                    onArtistToggle={toggleSpectrumArtist}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  ))
                ) : (
                  <div className={styles.spectrumEmpty}>
                    <strong>No styles are shown.</strong>
                    <p>Choose styles above or restore the complete roster map.</p>
                    <button
                      type="button"
                      onClick={() => setVisibleSpectrumStyles([...ALL_SOUND_STYLE_IDS])}
                    >
                      Show all styles
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <aside className={styles.bookingPrompt} style={BOOKING_PROMPT_TRANSITION_STYLE}>
        <div>
          <h2>Not sure which sound fits?</h2>
          <p>
            Tell us about the room, audience and energy you want. We will help narrow the choice.
          </p>
        </div>
        <Link href="/contact" className="btn-cta">
          Talk to us
        </Link>
      </aside>
    </section>
  );
}
