"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./prototype.module.css";

type ClusterId = "progressive" | "uplifting" | "peak" | "hard";
type FilterId = "all" | ClusterId;
export type PrototypeVersion = "v10" | "v11";

export type PrototypeArtist = {
  slug: string;
  name: string;
  image: string;
  tagline: string;
  clusters: ClusterId[];
  bpmCenter: number;
  bpmDelta: number;
};

type Cluster = {
  id: ClusterId;
  shortLabel: string;
  selectorLabel: string;
  label: string;
  bpmFrom: number;
  bpmTo: number;
  accent: string;
  accentText: string;
};

const clusters: Cluster[] = [
  {
    id: "progressive",
    shortLabel: "Progressive",
    selectorLabel: "Progressive Trance",
    label: "Progressive Trance",
    bpmFrom: 126,
    bpmTo: 134,
    accent: "var(--sound-progressive)",
    accentText: "var(--sound-progressive-ink)",
  },
  {
    id: "uplifting",
    shortLabel: "Uplifting",
    selectorLabel: "Uplifting Trance",
    label: "Uplifting Trance",
    bpmFrom: 136,
    bpmTo: 142,
    accent: "var(--sound-uplifting)",
    accentText: "var(--sound-uplifting-ink)",
  },
  {
    id: "peak",
    shortLabel: "Peak Time",
    selectorLabel: "Peak Time / Driving",
    label: "Techno (Peak Time / Driving)",
    bpmFrom: 128,
    bpmTo: 145,
    accent: "var(--sound-peak)",
    accentText: "var(--sound-peak-ink)",
  },
  {
    id: "hard",
    shortLabel: "Hard Techno",
    selectorLabel: "Hard Techno",
    label: "Hard Techno",
    bpmFrom: 148,
    bpmTo: 160,
    accent: "var(--sound-hard)",
    accentText: "var(--sound-hard-ink)",
  },
];

const clusterById = Object.fromEntries(clusters.map((cluster) => [cluster.id, cluster])) as Record<ClusterId, Cluster>;

type ClusterStyle = CSSProperties & {
  "--cluster-accent": string;
  "--cluster-accent-text": string;
  "--cluster-index": number;
};

type ArtistStyle = CSSProperties & {
  "--artist-index": number;
};

type PrototypeStyle = CSSProperties & {
  "--active-accent": string;
};

type MixerStyle = CSSProperties & {
  "--bpm-progress": string;
};

function artistBpmRange(artist: PrototypeArtist) {
  return `${artist.bpmCenter - artist.bpmDelta}–${artist.bpmCenter + artist.bpmDelta} BPM`;
}

function formatBpm(cluster: Cluster) {
  return `${cluster.bpmFrom}–${cluster.bpmTo} BPM`;
}

function BpmRange({ cluster }: { cluster: Cluster }) {
  return (
    <span className={styles.bpm} aria-label={`${cluster.bpmFrom} to ${cluster.bpmTo} BPM`}>
      <span className={styles.bpmRange} aria-hidden="true">
        <span>{cluster.bpmFrom}</span>
        <span className={styles.bpmDash}>—</span>
        <span>{cluster.bpmTo}</span>
      </span>
      <small aria-hidden="true">BPM</small>
    </span>
  );
}

function bpmDistance(artist: PrototypeArtist, bpm: number) {
  return Math.max(0, Math.abs(bpm - artist.bpmCenter) - artist.bpmDelta);
}

function SignalIcon() {
  return (
    <span className={styles.signalIcon} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function FamilyMark() {
  return (
    <div className={styles.familyMark} data-testid="family-mark" role="img" aria-label="Trance and Techno">
      <span className={styles.editorialMark} aria-hidden="true">
        <span>Trance</span><span>Techno</span>
      </span>
    </div>
  );
}

export default function PrototypeRoster({
  artists,
  version = "v11",
}: {
  artists: PrototypeArtist[];
  version?: PrototypeVersion;
}) {
  const usesMixer = version === "v11";
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [selectedBpm, setSelectedBpm] = useState<number | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const previousPositions = useRef(new Map<string, DOMRect>());
  const mixerRef = useRef<HTMLElement>(null);
  const rosterBarRef = useRef<HTMLDivElement>(null);
  const shouldRevealRoster = useRef(false);

  const activeCluster = activeFilter === "all" ? null : clusterById[activeFilter];
  const prototypeStyle: PrototypeStyle = {
    "--active-accent": activeCluster?.accent ?? "var(--text)",
  };
  const isArtistMatch = (artist: PrototypeArtist) => activeFilter === "all"
    || (artist.clusters.includes(activeFilter)
      && (!usesMixer || (selectedBpm !== null && bpmDistance(artist, selectedBpm) === 0)));

  const matchingCount = activeFilter === "all" ? artists.length : artists.filter(isArtistMatch).length;

  const orderedArtists = useMemo(() => {
    if (activeFilter === "all") return artists;

    if (!usesMixer) {
      return [...artists].sort((left, right) => {
        const leftMatches = left.clusters.includes(activeFilter) ? 0 : 1;
        const rightMatches = right.clusters.includes(activeFilter) ? 0 : 1;
        return leftMatches - rightMatches;
      });
    }

    if (selectedBpm === null) return artists;

    return [...artists].sort((left, right) => {
      const leftGenre = left.clusters.includes(activeFilter) ? 0 : 1;
      const rightGenre = right.clusters.includes(activeFilter) ? 0 : 1;
      const leftDistance = bpmDistance(left, selectedBpm);
      const rightDistance = bpmDistance(right, selectedBpm);
      const leftMatches = leftGenre === 0 && leftDistance === 0 ? 0 : 1;
      const rightMatches = rightGenre === 0 && rightDistance === 0 ? 0 : 1;

      return leftMatches - rightMatches
        || leftGenre - rightGenre
        || leftDistance - rightDistance
        || Math.abs(selectedBpm - left.bpmCenter) - Math.abs(selectedBpm - right.bpmCenter)
        || artists.indexOf(left) - artists.indexOf(right);
    });
  }, [activeFilter, artists, selectedBpm, usesMixer]);

  const matchingArtists = activeFilter === "all" ? orderedArtists : orderedArtists.slice(0, matchingCount);
  const otherArtists = activeFilter === "all" ? [] : orderedArtists.slice(matchingCount);

  const capturePositions = () => {
    previousPositions.current = new Map(
      [...cardRefs.current].map(([slug, element]) => [slug, element.getBoundingClientRect()]),
    );
  };

  const chooseFilter = (filter: FilterId) => {
    const nextFilter = filter === activeFilter ? "all" : filter;
    if (nextFilter === activeFilter) return;

    capturePositions();
    shouldRevealRoster.current = nextFilter !== "all" && window.matchMedia("(max-width: 760px)").matches;
    setActiveFilter(nextFilter);
    setSelectedBpm(!usesMixer || nextFilter === "all"
      ? null
      : Math.round((clusterById[nextFilter].bpmFrom + clusterById[nextFilter].bpmTo) / 2));
    setOpenSlug(null);
  };

  const chooseBpm = (bpm: number) => {
    if (activeFilter === "all" || bpm === selectedBpm) return;
    capturePositions();
    setSelectedBpm(bpm);
    setOpenSlug(null);
  };

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reducedMotion) {
      for (const [slug, element] of cardRefs.current) {
        const previous = previousPositions.current.get(slug);
        if (!previous) continue;

        const next = element.getBoundingClientRect();
        const x = previous.left - next.left;
        const y = previous.top - next.top;
        const scaleX = previous.width / next.width;
        const scaleY = previous.height / next.height;
        const resized = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;

        if (x || y || resized) {
          element.animate(
            [
              { transform: `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`, transformOrigin: "top left" },
              { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "top left" },
            ],
            { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          );
        }
      }
    }

    previousPositions.current.clear();

    if (shouldRevealRoster.current) {
      shouldRevealRoster.current = false;
      requestAnimationFrame(() => {
        (usesMixer ? mixerRef.current : rosterBarRef.current)?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  }, [activeFilter, selectedBpm, usesMixer]);

  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const renderArtist = (artist: PrototypeArtist, index: number) => {
    const genreMatches = activeFilter === "all" || artist.clusters.includes(activeFilter);
    const tempoMatches = selectedBpm === null || bpmDistance(artist, selectedBpm) === 0;
    const matches = activeFilter === "all" || (genreMatches && tempoMatches);
    const isOpen = openSlug === artist.slug;
    const artistStyle: ArtistStyle = { "--artist-index": index };
    const actionsId = `artist-${artist.slug}-actions`;
    const genreSummary = artist.clusters.map((cluster) => clusterById[cluster].shortLabel).join(" · ");
    const bpmSummary = usesMixer
      ? artistBpmRange(artist)
      : artist.clusters.map((cluster) => formatBpm(clusterById[cluster])).join(" · ");

    return (
      <article
        key={artist.slug}
        ref={(element) => {
          if (element) cardRefs.current.set(artist.slug, element);
          else cardRefs.current.delete(artist.slug);
        }}
        data-testid={`artist-${artist.slug}`}
        className={styles.artistCard}
        style={artistStyle}
        data-match={matches ? "true" : "false"}
        data-genre-match={genreMatches ? "true" : "false"}
        data-tempo-match={tempoMatches ? "true" : "false"}
        data-filtered={activeFilter === "all" ? "false" : "true"}
        data-open={isOpen ? "true" : "false"}
        tabIndex={0}
        aria-label={`${artist.name} artist card`}
        onMouseEnter={() => { if (canHover()) setOpenSlug(artist.slug); }}
        onMouseLeave={() => { if (canHover()) setOpenSlug((current) => current === artist.slug ? null : current); }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setOpenSlug(artist.slug);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setOpenSlug((current) => current === artist.slug ? null : current);
          }
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Escape") setOpenSlug(null);
        }}
        onClick={() => {
          if (!canHover()) setOpenSlug((current) => current === artist.slug ? null : artist.slug);
        }}
      >
        <Image
          src={artist.image}
          alt={artist.name}
          fill
          className={styles.artistImage}
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 25vw"
        />
        <span className={styles.imageWash} aria-hidden="true" />
        <span className={styles.artistCopy}>
          <span className={styles.artistClusters}>{genreSummary}</span>
          <strong>{artist.name}</strong>
        </span>
        {!isOpen && <span className={styles.tapHint}>Tap</span>}

        <div id={actionsId} className={styles.revealPanel} data-testid={`artist-actions-${artist.slug}`} aria-hidden={!isOpen}>
          <div className={styles.revealProfile}>
            <span>{genreSummary}</span>
            <strong>{bpmSummary}</strong>
          </div>
          <Link
            href={`/artist/${artist.slug}`}
            aria-label={`View ${artist.name} profile`}
            onClick={(event) => event.stopPropagation()}
            className={styles.profileAction}
            tabIndex={isOpen ? 0 : -1}
          >
            View profile
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href={`/contact?artist=${encodeURIComponent(artist.name)}`}
            aria-label={`Book ${artist.name}`}
            onClick={(event) => event.stopPropagation()}
            className={styles.bookingAction}
            tabIndex={isOpen ? 0 : -1}
          >
            Book {artist.name}
          </Link>
        </div>
      </article>
    );
  };

  return (
    <section
      className={styles.prototype}
      style={prototypeStyle}
      data-prototype-version={version}
      aria-labelledby="prototype-heading"
    >
      <div className={styles.ambient} aria-hidden="true" />

      <div className={`site-shell ${styles.shell}`}>
        <header className={styles.header}>
          <div>
            <p className={`eyebrow-label ${styles.eyebrow}`}>Interactive roster · concept</p>
            <h1 id="prototype-heading" className={`display-heading ${styles.heading}`}>
              Find the right sound
              <span>for your room.</span>
            </h1>
          </div>
          <p className={styles.intro}>
            Start with the energy you want. The roster responds with artists who naturally fit that part of the night.
          </p>
        </header>

        <div className={styles.typographyStudy}>
          <FamilyMark />
        </div>

        <div className={styles.soundPicker} aria-label="Filter artists by sound">
          {clusters.map((cluster, index) => {
            const isActive = activeFilter === cluster.id;
            const clusterStyle: ClusterStyle = {
              "--cluster-accent": cluster.accent,
              "--cluster-accent-text": cluster.accentText,
              "--cluster-index": index,
            };

            return (
              <button
                key={cluster.id}
                type="button"
                data-testid={`cluster-${cluster.id}`}
                className={styles.soundButton}
                style={clusterStyle}
                aria-pressed={isActive}
                onClick={() => chooseFilter(cluster.id)}
              >
                <span className={styles.soundTopline}>
                  <span>{cluster.selectorLabel}</span>
                </span>
                {!usesMixer && <BpmRange cluster={cluster} />}
                <span className={styles.soundAction}>
                  {isActive ? (usesMixer ? "Clear genre" : "Show all artists") : "Reveal artists"}
                  <SignalIcon />
                </span>
              </button>
            );
          })}
        </div>

        {usesMixer && (
          <section
            ref={mixerRef}
            className={styles.mixer}
            data-active={activeCluster ? "true" : "false"}
            aria-labelledby="tempo-heading"
            style={{
              "--cluster-accent": activeCluster?.accent ?? "var(--text-30)",
              "--bpm-progress": `${(((selectedBpm ?? 140) - 120) / 40) * 100}%`,
            } as MixerStyle}
          >
            <div className={styles.mixerCopy}>
              <p className={styles.mixerEyebrow}>Then tune the energy</p>
              <h2 id="tempo-heading">Target tempo</h2>
              <p>
                {activeCluster
                  ? <>Drag the fader to refine <strong>{activeCluster.shortLabel}</strong>.</>
                  : "Choose a genre to unlock the BPM fader."}
              </p>
            </div>
            <div className={styles.faderPanel}>
              <output className={styles.bpmReadout} htmlFor="bpm-fader" aria-live="polite">
                <strong>{selectedBpm ?? "—"}</strong>
                <span>BPM</span>
              </output>
              <div className={styles.faderWrap}>
                <input
                  id="bpm-fader"
                  data-testid="bpm-fader"
                  className={styles.fader}
                  type="range"
                  min="120"
                  max="160"
                  step="1"
                  value={selectedBpm ?? 140}
                  disabled={!activeCluster}
                  aria-label="Target tempo"
                  aria-valuetext={selectedBpm === null ? "Choose a genre first" : `${selectedBpm} BPM`}
                  onChange={(event) => chooseBpm(Number(event.currentTarget.value))}
                />
                <div className={styles.faderScale} aria-hidden="true">
                  <span>120</span><span>140</span><span>160</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <div ref={rosterBarRef} className={styles.rosterBar}>
          <p className={styles.result} aria-live="polite" data-testid="roster-result">
            {usesMixer
              ? activeCluster && selectedBpm !== null
                ? matchingCount > 0
                  ? <>Best matches for <strong>{activeCluster.label}</strong> at <strong>{selectedBpm} BPM</strong></>
                  : <>No exact match for <strong>{activeCluster.label}</strong> at <strong>{selectedBpm} BPM</strong> — nearest artists appear below</>
                : "Choose a genre, then tune the BPM"
              : activeCluster
                ? <>Best matches for <strong>{activeCluster.label}</strong></>
                : "Choose a sound, or explore every artist"}
          </p>
          {activeFilter !== "all" && (
            <button type="button" className={styles.reset} onClick={() => chooseFilter("all")}>
              Show all sounds
            </button>
          )}
        </div>

        <div className={styles.rosterGrid} data-testid="artist-grid">
          {activeFilter === "all" ? (
            <div className={styles.rosterGroupGrid}>
              {matchingArtists.map((artist, index) => renderArtist(artist, index))}
            </div>
          ) : (
            <>
              <section className={styles.rosterGroup} aria-labelledby="best-matches-heading">
                <div id="best-matches-heading" className={styles.groupLabel} data-testid="best-matches-label">
                  <span>Best matches</span>
                </div>
                <div className={styles.rosterGroupGrid}>
                  {matchingArtists.length > 0
                    ? matchingArtists.map((artist, index) => renderArtist(artist, index))
                    : <p className={styles.emptyMatches}>Try moving the fader a little — the closest artists are already lined up below.</p>}
                </div>
              </section>
              <section className={styles.rosterGroup} aria-labelledby="other-sounds-heading">
                <div id="other-sounds-heading" className={`${styles.groupLabel} ${styles.otherLabel}`} data-testid="other-sounds-label">
                  <span>Other sounds</span>
                </div>
                <div className={styles.rosterGroupGrid}>
                  {otherArtists.map((artist, index) => renderArtist(artist, index + matchingCount))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
