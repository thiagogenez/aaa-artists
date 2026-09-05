"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  BPM_DOMAIN,
  ENERGY_COLORS,
  NIGHT_MOMENTS,
  SOUND_GROUPS,
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
type OptionalStyle = "all" | SoundStyleId;
type OptionalMoment = "all" | NightMomentId;
type DiscoveryStyle = CSSProperties & Record<`--${string}`, string | number>;

const DEFAULT_BPM = { min: BPM_DOMAIN.min, max: BPM_DOMAIN.max };

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
  soundStyle: OptionalStyle,
  moment: OptionalMoment,
  bpmMin: number,
  bpmMax: number
) {
  const style = getSoundStyle(profile.style);
  if (family !== "all" && style.groupId !== family) return 0.06;
  if (soundStyle !== "all" && profile.style !== soundStyle) return 0.06;
  if (moment !== "all" && !profile.moments.includes(moment)) return 0.1;
  return bpmAffinity(distanceFromRange(profile, bpmMin, bpmMax));
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

function ArtistCard({
  artist,
  profile,
  highlighted,
  priority,
}: {
  artist: DiscoveryArtist;
  profile: SoundProfile;
  highlighted: boolean;
  priority: boolean;
}) {
  const soundStyle = getSoundStyle(profile.style);
  const otherStyles = artist.soundProfiles.length - 1;
  const cardStyle: DiscoveryStyle = { "--profile-color": profileColor(profile) };

  return (
    <Link
      href={`/artist/${artist.slug}`}
      className={styles.artistCard}
      style={cardStyle}
      data-highlighted={highlighted ? "true" : "false"}
      aria-label={`View ${artist.name} profile`}
    >
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
      <span className={styles.artistCopy}>
        <strong>{artist.name}</strong>
        <span>
          {soundStyle.label} · {profile.bpm.min}–{profile.bpm.max} BPM
        </span>
        {otherStyles > 0 && (
          <small>
            + {otherStyles} other {otherStyles === 1 ? "style" : "styles"}
          </small>
        )}
      </span>
    </Link>
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
  const [family, setFamily] = useState<OptionalGroup>("all");
  const [soundStyle, setSoundStyle] = useState<OptionalStyle>("all");
  const [moment, setMoment] = useState<OptionalMoment>("all");
  const [bpmMin, setBpmMin] = useState<number>(DEFAULT_BPM.min);
  const [bpmMax, setBpmMax] = useState<number>(DEFAULT_BPM.max);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const familyStyles =
    family === "all" ? [] : (SOUND_GROUPS.find((group) => group.id === family)?.styles ?? []);
  const bpmIsFiltered = bpmMin !== DEFAULT_BPM.min || bpmMax !== DEFAULT_BPM.max;
  const activeFilterCount =
    Number(family !== "all") +
    Number(soundStyle !== "all") +
    Number(moment !== "all") +
    Number(bpmIsFiltered) +
    Number(query.trim().length > 0);

  const rankedArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return artists
      .map((artist, editorialIndex) => {
        const rankedProfiles = artist.soundProfiles
          .map((profile, profileIndex) => ({
            profile,
            profileIndex,
            affinity: profileAffinity(profile, family, soundStyle, moment, bpmMin, bpmMax),
          }))
          .sort(
            (left, right) =>
              right.affinity - left.affinity || left.profileIndex - right.profileIndex
          );
        const nameMatches =
          normalizedQuery.length === 0 || artist.name.toLocaleLowerCase().includes(normalizedQuery);
        const affinity = (rankedProfiles[0]?.affinity ?? 0) * (nameMatches ? 1 : 0.04);
        return {
          artist,
          editorialIndex,
          profile: rankedProfiles[0]?.profile ?? artist.soundProfiles[0],
          affinity,
        };
      })
      .sort(
        (left, right) =>
          right.affinity - left.affinity || left.editorialIndex - right.editorialIndex
      );
  }, [artists, bpmMax, bpmMin, family, moment, query, soundStyle]);

  const bestMatches = activeFilterCount
    ? rankedArtists.filter(({ affinity }) => affinity >= 0.99).length
    : artists.length;

  const visibleGroups = SOUND_GROUPS.map((group) => ({
    ...group,
    styles: group.styles.filter(
      (style) =>
        (family === "all" || group.id === family) &&
        (soundStyle === "all" || style.id === soundStyle) &&
        artists.some((artist) => artist.soundProfiles.some((profile) => profile.style === style.id))
    ),
  })).filter((group) => group.styles.length > 0);

  const resetFilters = () => {
    setFamily("all");
    setSoundStyle("all");
    setMoment("all");
    setBpmMin(DEFAULT_BPM.min);
    setBpmMax(DEFAULT_BPM.max);
    setQuery("");
  };

  const rangeStyle: DiscoveryStyle = {
    "--range-start": `${((bpmMin - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100}%`,
    "--range-end": `${((bpmMax - BPM_DOMAIN.min) / (BPM_DOMAIN.max - BPM_DOMAIN.min)) * 100}%`,
  };

  return (
    <section className={styles.discovery} aria-label="Artist discovery">
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
          <small>{artists.length} artists</small>
        </button>
      </div>

      <div
        id="artist-filters"
        className={styles.filters}
        data-open={filtersOpen ? "true" : "false"}
      >
        <div className={`${styles.filterField} ${styles.searchField}`}>
          <label htmlFor="artist-search">Artist</label>
          <input
            id="artist-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="artist-genre">Genre</label>
          <select
            id="artist-genre"
            value={family}
            onChange={(event) => {
              setFamily(event.target.value as OptionalGroup);
              setSoundStyle("all");
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
            value={soundStyle}
            disabled={family === "all"}
            onChange={(event) => setSoundStyle(event.target.value as OptionalStyle)}
          >
            <option value="all">{family === "all" ? "Choose genre" : "All styles"}</option>
            {familyStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
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
      </div>

      <div className={styles.resultBar} aria-live="polite">
        <p>
          <strong>{artists.length}</strong> artists
          {activeFilterCount > 0 && (
            <span>
              · <strong>{bestMatches}</strong> best {bestMatches === 1 ? "match" : "matches"}
            </span>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button type="button" onClick={resetFilters}>
            Clear filters
          </button>
        )}
      </div>

      {view === "grid" ? (
        <div className={styles.artistGrid} data-testid="artist-grid">
          {rankedArtists.map(({ artist, profile, affinity }, index) => (
            <ArtistCard
              key={artist.slug}
              artist={artist}
              profile={profile}
              highlighted={activeFilterCount > 0 && affinity >= 0.99}
              priority={index < 3}
            />
          ))}
        </div>
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
                          const nameMatches = artist.name
                            .toLocaleLowerCase()
                            .includes(query.trim().toLocaleLowerCase());
                          const affinity =
                            profileAffinity(profile, family, soundStyle, moment, bpmMin, bpmMax) *
                            (nameMatches ? 1 : 0.08);
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
                        const nameMatches = artist.name
                          .toLocaleLowerCase()
                          .includes(query.trim().toLocaleLowerCase());
                        const affinity =
                          profileAffinity(profile, family, soundStyle, moment, bpmMin, bpmMax) *
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

      <aside className={styles.bookingPrompt}>
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
