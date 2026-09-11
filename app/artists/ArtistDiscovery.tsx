"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  BPM_DOMAIN,
  ENERGY_COLORS,
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
type PaletteMode = "mono" | "color";
type OptionalGroup = "all" | SoundGroupId;
type OptionalMoment = "all" | NightMomentId;
type RosterTransitionDirection = "expand" | "collapse" | "reorder";
type DiscoveryStyle = CSSProperties & {
  viewTransitionClass?: string;
} & Record<`--${string}`, string | number>;

const DEFAULT_BPM = { min: BPM_DOMAIN.min, max: BPM_DOMAIN.max };
const MIN_SUBSTRING_SEARCH_LENGTH = 3;
const BOOKING_PROMPT_TRANSITION_STYLE: DiscoveryStyle = {
  viewTransitionClass: "roster-followup",
  viewTransitionName: "roster-followup",
};
let rosterTransitionSequence = 0;

function normalizeArtistSearch(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
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
  moment: OptionalMoment,
  bpmMin: number,
  bpmMax: number
) {
  const style = getSoundStyle(profile.style);
  if (family !== "all" && style.groupId !== family) return 0.06;
  if (selectedStyles.length > 0 && !selectedStyles.includes(profile.style)) return 0.06;
  if (moment !== "all" && !profile.moments.includes(moment)) return 0.1;
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

function getEnergyColor(bpm: number) {
  let match: (typeof ENERGY_COLORS)[number] = ENERGY_COLORS[0];
  for (const stop of ENERGY_COLORS) {
    if (bpm >= stop.bpm) match = stop;
  }
  return match.color;
}

function profileColor(profile: SoundProfile) {
  return getEnergyColor((profile.bpm.min + profile.bpm.max) / 2);
}

function profilePosition(profile: SoundProfile): DiscoveryStyle {
  const span = BPM_DOMAIN.max - BPM_DOMAIN.min;
  return {
    "--profile-left": `${((profile.bpm.min - BPM_DOMAIN.min) / span) * 100}%`,
    "--profile-width": `${((profile.bpm.max - profile.bpm.min) / span) * 100}%`,
    "--profile-color": profileColor(profile),
  };
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
}: {
  artist: DiscoveryArtist;
  profile: SoundProfile;
  affinity: number;
}) {
  const entryStyle: DiscoveryStyle = {
    ...profilePosition(profile),
    "--match-opacity": affinity,
  };

  return (
    <div className={styles.spectrumLane}>
      <Link
        href={`/artist/${artist.slug}`}
        className={styles.spectrumEntry}
        style={entryStyle}
        aria-label={`${artist.name}, ${profile.bpm.min} to ${profile.bpm.max} BPM`}
      >
        <span className={styles.spectrumEntryLabel}>
          <span>{artist.name}</span>
          <small>
            {profile.bpm.min}–{profile.bpm.max}
          </small>
        </span>
        <span className={styles.spectrumRange} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function ArtistDiscovery({ artists }: { artists: DiscoveryArtist[] }) {
  const [view, setView] = useState<ViewMode>("grid");
  const [palette, setPalette] = useState<PaletteMode>("mono");
  const [family, setFamily] = useState<OptionalGroup>("all");
  const [selectedStyles, setSelectedStyles] = useState<SoundStyleId[]>([]);
  const [moment, setMoment] = useState<OptionalMoment>("all");
  const [bpmMin, setBpmMin] = useState<number>(DEFAULT_BPM.min);
  const [bpmMax, setBpmMax] = useState<number>(DEFAULT_BPM.max);
  const [query, setQuery] = useState("");
  const [selectedArtistSlugs, setSelectedArtistSlugs] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const effectiveMoment: OptionalMoment = view === "spectrum" ? moment : "all";
  const effectiveBpmMin = view === "spectrum" ? bpmMin : DEFAULT_BPM.min;
  const effectiveBpmMax = view === "spectrum" ? bpmMax : DEFAULT_BPM.max;

  const familyStyles =
    family === "all"
      ? []
      : [...(SOUND_GROUPS.find((group) => group.id === family)?.styles ?? [])].sort(
          compareSoundStyleSpectrumOrder
        );
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
  const activeFilterCount =
    Number(family !== "all") +
    Number(selectedStyles.length > 0) +
    Number(view === "spectrum" && moment !== "all") +
    Number(bpmIsFiltered) +
    Number(selectedArtistSlugs.length > 0);

  const rankedArtists = useMemo(() => {
    return artists
      .map((artist, editorialIndex) => {
        const matchedStyleOrder = selectedStyleMatchOrder(artist, selectedStyles);
        const rankedProfiles = artist.soundProfiles
          .map((profile, profileIndex) => ({
            profile,
            profileIndex,
            affinity: profileAffinity(
              profile,
              family,
              selectedStyles,
              effectiveMoment,
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
    effectiveMoment,
    family,
    selectedArtistSlugs,
    selectedStyles,
  ]);

  const bestMatches = activeFilterCount
    ? rankedArtists.filter(({ affinity }) => affinity >= 0.99).length
    : artists.length;

  const gridArtists = useMemo(() => {
    return rankedArtists.filter(({ artist }) =>
      artistMatchesGridFilters(artist, selectedArtistSlugs, family, selectedStyles)
    );
  }, [family, rankedArtists, selectedArtistSlugs, selectedStyles]);

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

  const visibleGroups = SOUND_GROUPS.map((group) => ({
    ...group,
    styles: group.styles
      .filter(
        (style) =>
          (family === "all" || group.id === family) &&
          (selectedStyles.length === 0 || selectedStyles.includes(style.id)) &&
          artists.some((artist) =>
            artist.soundProfiles.some((profile) => profile.style === style.id)
          )
      )
      .sort(compareSoundStyleSpectrumOrder),
  })).filter((group) => group.styles.length > 0);

  const resetFilters = () => {
    setFamily("all");
    setSelectedStyles([]);
    setMoment("all");
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
    <section className={styles.discovery} aria-label="Artist discovery" data-palette={palette}>
      <div className={styles.discoveryBar}>
        <fieldset className={styles.viewSwitch}>
          <legend className="sr-only">Roster view</legend>
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
            Grid
          </button>
          <button
            type="button"
            aria-pressed={view === "spectrum"}
            onClick={() => setView("spectrum")}
          >
            Spectrum
          </button>
        </fieldset>

        <fieldset className={styles.paletteSwitch}>
          <legend className="sr-only">Color treatment</legend>
          <button
            type="button"
            aria-pressed={palette === "mono"}
            onClick={() => setPalette("mono")}
          >
            Without colors
          </button>
          <button
            type="button"
            aria-pressed={palette === "color"}
            onClick={() => setPalette("color")}
          >
            With colors
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
          <small>{view === "grid" ? gridArtists.length : artists.length} artists</small>
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
                  <div>
                    <button
                      type="button"
                      className={styles.allStylesChoice}
                      aria-pressed={selectedStyles.length === 0}
                      onClick={(event) => transitionGridFilters(event, family, [])}
                    >
                      All styles
                    </button>
                    {familyStyles.map((sound) => (
                      <button
                        key={sound.id}
                        type="button"
                        className={styles.styleChoice}
                        style={{ "--style-color": SOUND_STYLE_COLORS[sound.id] } as DiscoveryStyle}
                        aria-pressed={selectedStyles.includes(sound.id)}
                        onClick={(event) => {
                          const nextStyles = selectedStyles.includes(sound.id)
                            ? selectedStyles.filter((styleId) => styleId !== sound.id)
                            : [...selectedStyles, sound.id];
                          transitionGridFilters(event, family, nextStyles);
                        }}
                      >
                        {sound.label}
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>
          </>
        ) : (
          <>
            <div className={styles.filterField}>
              <label htmlFor="artist-genre">Genre</label>
              <select
                id="artist-genre"
                value={family}
                onChange={(event) => {
                  setFamily(event.target.value as OptionalGroup);
                  setSelectedStyles([]);
                }}
              >
                <option value="all">All genres</option>
                {SOUND_GROUPS.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="artist-style">Style</label>
              <select
                id="artist-style"
                value={selectedStyles.length === 1 ? selectedStyles[0] : "all"}
                disabled={family === "all"}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedStyles(value === "all" ? [] : [value as SoundStyleId]);
                }}
              >
                <option value="all">{family === "all" ? "Choose genre" : "All styles"}</option>
                {familyStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {view === "spectrum" && (
          <div className={`${styles.filterField} ${styles.momentFilter}`}>
            <label htmlFor="artist-moment">Moment</label>
            <select
              id="artist-moment"
              value={moment}
              onChange={(event) => setMoment(event.target.value as OptionalMoment)}
            >
              <option value="all">Any moment</option>
              {NIGHT_MOMENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {view === "spectrum" && (
          <fieldset className={styles.bpmField}>
            <legend>BPM range</legend>
            <div className={styles.bpmReadout} aria-live="polite">
              <span>{bpmMin}</span>
              <span aria-hidden="true">—</span>
              <span>{bpmMax}</span>
            </div>
            <div className={styles.rangeControl} style={rangeStyle}>
              <span className={styles.rangeTrack} aria-hidden="true" />
              <input
                type="range"
                min={BPM_DOMAIN.min}
                max={BPM_DOMAIN.max - 1}
                value={bpmMin}
                aria-label="Minimum BPM"
                onChange={(event) => setBpmMin(Math.min(Number(event.target.value), bpmMax - 1))}
              />
              <input
                type="range"
                min={BPM_DOMAIN.min + 1}
                max={BPM_DOMAIN.max}
                value={bpmMax}
                aria-label="Maximum BPM"
                onChange={(event) => setBpmMax(Math.max(Number(event.target.value), bpmMin + 1))}
              />
            </div>
          </fieldset>
        )}
      </div>

      <div className={styles.resultBar} aria-live="polite">
        <p>
          {view === "grid" ? (
            <>
              <strong>{gridArtists.length}</strong>{" "}
              {gridArtists.length === 1 ? "artist" : "artists"}
            </>
          ) : (
            <>
              <strong>{artists.length}</strong> artists
              {activeFilterCount > 0 && (
                <span>
                  · <strong>{bestMatches}</strong> best {bestMatches === 1 ? "match" : "matches"}
                </span>
              )}
            </>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button type="button" onClick={resetFilters}>
            Clear filters
          </button>
        )}
      </div>

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
        <div className={styles.spectrum} data-testid="artist-spectrum">
          <div className={styles.spectrumDesktop}>
            <div className={styles.spectrumRuler}>
              <span>BPM</span>
              <div>
                {[120, 130, 140, 150, 160].map((bpm) => (
                  <span
                    key={bpm}
                    style={
                      {
                        "--tick-position": `${
                          ((bpm - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100
                        }%`,
                      } as DiscoveryStyle
                    }
                  >
                    {bpm}
                  </span>
                ))}
              </div>
            </div>

            {visibleGroups.map((group) => (
              <section key={group.id} className={styles.spectrumGroup}>
                <h2>{group.label}</h2>
                {group.styles.map((sound) => {
                  const profiles = artists.flatMap((artist) =>
                    artist.soundProfiles
                      .filter((profile) => profile.style === sound.id)
                      .map((profile) => ({ artist, profile }))
                  );
                  return (
                    <div key={sound.id} className={styles.spectrumRow}>
                      <h3>{sound.label}</h3>
                      <div className={styles.spectrumLanes}>
                        {profiles.map(({ artist, profile }) => {
                          const nameMatches =
                            selectedArtistSlugs.length === 0 ||
                            selectedArtistSlugs.includes(artist.slug);
                          const affinity =
                            profileAffinity(
                              profile,
                              family,
                              selectedStyles,
                              moment,
                              bpmMin,
                              bpmMax
                            ) * (nameMatches ? 1 : 0.08);
                          return (
                            <SpectrumEntry
                              key={artist.slug}
                              artist={artist}
                              profile={profile}
                              affinity={affinity}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          <div className={styles.spectrumMobile}>
            {visibleGroups.map((group) => (
              <section key={group.id}>
                <h2>{group.label}</h2>
                {group.styles.map((sound) => {
                  const profiles = artists.flatMap((artist) =>
                    artist.soundProfiles
                      .filter((profile) => profile.style === sound.id)
                      .map((profile) => ({ artist, profile }))
                  );
                  return (
                    <div key={sound.id} className={styles.mobileStyle}>
                      <h3>{sound.label}</h3>
                      {profiles.map(({ artist, profile }) => {
                        const nameMatches =
                          selectedArtistSlugs.length === 0 ||
                          selectedArtistSlugs.includes(artist.slug);
                        const affinity =
                          profileAffinity(profile, family, selectedStyles, moment, bpmMin, bpmMax) *
                          (nameMatches ? 1 : 0.08);
                        const itemStyle: DiscoveryStyle = {
                          "--profile-color": profileColor(profile),
                          "--match-opacity": affinity,
                        };
                        return (
                          <Link
                            key={artist.slug}
                            href={`/artist/${artist.slug}`}
                            className={styles.mobileProfile}
                            style={itemStyle}
                            aria-label={`${artist.name}, ${profile.bpm.min} to ${profile.bpm.max} BPM`}
                          >
                            <span aria-hidden="true" />
                            <strong>{artist.name}</strong>
                            <small>
                              {profile.bpm.min}–{profile.bpm.max} BPM
                            </small>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            ))}
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
