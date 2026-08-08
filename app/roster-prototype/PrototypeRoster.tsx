"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./prototype.module.css";

type ClusterId = "progressive" | "uplifting" | "peak" | "hard";
type FilterId = "all" | ClusterId;

export type PrototypeArtist = {
  slug: string;
  name: string;
  image: string;
  tagline: string;
  clusters: ClusterId[];
};

type Cluster = {
  id: ClusterId;
  shortLabel: string;
  label: string;
  bpm: string;
  accent: string;
  accentText: string;
};

const clusters: Cluster[] = [
  {
    id: "progressive",
    shortLabel: "Progressive",
    label: "Progressive Trance",
    bpm: "126–134",
    accent: "#7768ff",
    accentText: "#ffffff",
  },
  {
    id: "uplifting",
    shortLabel: "Uplifting",
    label: "Uplifting Trance",
    bpm: "136–142",
    accent: "#ff5c93",
    accentText: "#16060c",
  },
  {
    id: "peak",
    shortLabel: "Peak Time",
    label: "Peak Time / Driving",
    bpm: "128–145",
    accent: "#ff7138",
    accentText: "#1b0902",
  },
  {
    id: "hard",
    shortLabel: "Hard Techno",
    label: "Hard Techno",
    bpm: "148–160",
    accent: "#d6ff46",
    accentText: "#0b1000",
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

export default function PrototypeRoster({ artists }: { artists: PrototypeArtist[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousPositions = useRef(new Map<string, DOMRect>());

  const activeCluster = activeFilter === "all" ? null : clusterById[activeFilter];
  const prototypeStyle: PrototypeStyle = {
    "--active-accent": activeCluster?.accent ?? "var(--text)",
  };
  const matchingCount = activeFilter === "all"
    ? artists.length
    : artists.filter((artist) => artist.clusters.includes(activeFilter)).length;

  const orderedArtists = useMemo(() => {
    if (activeFilter === "all") return artists;

    return [...artists].sort((left, right) => {
      const leftMatches = left.clusters.includes(activeFilter) ? 0 : 1;
      const rightMatches = right.clusters.includes(activeFilter) ? 0 : 1;
      return leftMatches - rightMatches;
    });
  }, [activeFilter, artists]);

  const selectedArtist = selectedSlug
    ? artists.find((artist) => artist.slug === selectedSlug) ?? null
    : null;
  const matchingArtists = activeFilter === "all" ? orderedArtists : orderedArtists.slice(0, matchingCount);
  const otherArtists = activeFilter === "all" ? [] : orderedArtists.slice(matchingCount);

  const capturePositions = () => {
    previousPositions.current = new Map(
      [...cardRefs.current].map(([slug, element]) => [slug, element.getBoundingClientRect()]),
    );
  };

  const chooseFilter = (filter: FilterId) => {
    if (filter === activeFilter) return;

    capturePositions();
    setActiveFilter(filter);
    setSelectedSlug((current) => {
      if (!current || filter === "all") return current;
      const artist = artists.find((item) => item.slug === current);
      return artist?.clusters.includes(filter) ? current : null;
    });
  };

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousPositions.current.clear();
      return;
    }

    for (const [slug, element] of cardRefs.current) {
      const previous = previousPositions.current.get(slug);
      if (!previous) continue;

      const next = element.getBoundingClientRect();
      const x = previous.left - next.left;
      const y = previous.top - next.top;

      if (x || y) {
        element.animate(
          [
            { transform: `translate(${x}px, ${y}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    }

    previousPositions.current.clear();
  }, [activeFilter]);

  const renderArtist = (artist: PrototypeArtist, index: number) => {
    const matches = activeFilter === "all" || artist.clusters.includes(activeFilter);
    const isSelected = selectedSlug === artist.slug;
    const artistStyle: ArtistStyle = { "--artist-index": index };

    return (
      <button
        key={artist.slug}
        type="button"
        ref={(element) => {
          if (element) cardRefs.current.set(artist.slug, element);
          else cardRefs.current.delete(artist.slug);
        }}
        data-testid={`artist-${artist.slug}`}
        className={styles.artistCard}
        style={artistStyle}
        data-match={matches ? "true" : "false"}
        data-filtered={activeFilter === "all" ? "false" : "true"}
        data-selected={isSelected ? "true" : "false"}
        aria-pressed={isSelected}
        onClick={() => setSelectedSlug((current) => current === artist.slug ? null : artist.slug)}
      >
        <Image
          src={artist.image}
          alt=""
          fill
          className={styles.artistImage}
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 25vw"
        />
        <span className={styles.imageWash} aria-hidden="true" />
        <span className={styles.artistNumber}>{(index + 1).toString().padStart(2, "0")}</span>
        <span className={styles.artistCopy}>
          <span className={styles.artistClusters}>
            {artist.clusters.map((cluster) => clusterById[cluster].shortLabel).join(" · ")}
          </span>
          <strong>{artist.name}</strong>
          <span className={styles.artistPrompt}>{isSelected ? "Close details" : "Open artist"}<span aria-hidden="true">→</span></span>
        </span>
      </button>
    );
  };

  return (
    <section className={styles.prototype} style={prototypeStyle} aria-labelledby="prototype-heading">
      <div className={styles.ambient} aria-hidden="true" />

      <div className={`site-shell ${styles.shell}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Interactive roster · concept</p>
            <h1 id="prototype-heading" className={styles.heading}>
              Find the right sound
              <span>for your room.</span>
            </h1>
          </div>
          <p className={styles.intro}>
            Start with the energy you want. The roster responds with artists who naturally fit that part of the night.
          </p>
        </header>

        <div className={styles.soundPicker} aria-label="Filter artists by sound">
          {clusters.map((cluster, index) => {
            const count = artists.filter((artist) => artist.clusters.includes(cluster.id)).length;
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
                  <span>{cluster.label}</span>
                  <span>{count.toString().padStart(2, "0")}</span>
                </span>
                <span className={styles.bpm}>
                  {cluster.bpm}<small>BPM</small>
                </span>
                <span className={styles.soundAction}>{isActive ? "Selected" : "Explore sound"}<span aria-hidden="true">↗</span></span>
              </button>
            );
          })}
        </div>

        <div className={styles.rosterBar}>
          <p className={styles.result} aria-live="polite">
            <strong>{matchingCount}</strong> {matchingCount === 1 ? "artist" : "artists"}
            {activeCluster ? ` match ${activeCluster.shortLabel}` : " across the full roster"}
          </p>
          {activeFilter !== "all" && (
            <button type="button" className={styles.reset} onClick={() => chooseFilter("all")}>
              Show all sounds
            </button>
          )}
        </div>

        <div className={styles.discoveryLayout}>
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
                    <strong>{matchingCount.toString().padStart(2, "0")}</strong>
                  </div>
                  <div className={styles.rosterGroupGrid}>
                    {matchingArtists.map((artist, index) => renderArtist(artist, index))}
                  </div>
                </section>
                <section className={styles.rosterGroup} aria-labelledby="other-sounds-heading">
                  <div id="other-sounds-heading" className={`${styles.groupLabel} ${styles.otherLabel}`} data-testid="other-sounds-label">
                    <span>Other sounds</span>
                    <strong>{otherArtists.length.toString().padStart(2, "0")}</strong>
                  </div>
                  <div className={styles.rosterGroupGrid}>
                    {otherArtists.map((artist, index) => renderArtist(artist, index + matchingCount))}
                  </div>
                </section>
              </>
            )}
          </div>

          <aside className={styles.artistDetail} aria-live="polite" data-testid="artist-detail">
            {selectedArtist ? (
              <div key={selectedArtist.slug} className={styles.detailContent}>
                <p className={styles.detailEyebrow}>Booking fit</p>
                <h2>{selectedArtist.name}</h2>
                <p className={styles.detailTagline}>{selectedArtist.tagline}</p>
                <p className={styles.profileLabel}>Sound profile</p>
                <div className={styles.detailSounds}>
                  {selectedArtist.clusters.map((clusterId) => {
                    const cluster = clusterById[clusterId];
                    return (
                      <div key={cluster.id}>
                        <span>{cluster.label}</span>
                        <strong>{cluster.bpm} BPM</strong>
                      </div>
                    );
                  })}
                </div>
                <p className={styles.bookingNote}>For fees, availability and routing, send us the event details.</p>
                <div className={styles.detailActions}>
                  <Link href={`/artist/${selectedArtist.slug}`} className="btn-cta">Full profile</Link>
                  <Link href={`/contact?artist=${encodeURIComponent(selectedArtist.name)}`} className="btn-outline">Enquire</Link>
                </div>
              </div>
            ) : (
              <div className={styles.detailEmpty}>
                <span aria-hidden="true">↳</span>
                <div>
                  <p className={styles.detailEyebrow}>{activeCluster ? activeCluster.shortLabel : "Artist discovery"}</p>
                  <p><strong>Choose {activeCluster ? "a matching artist" : "an artist"}</strong> to see their sound profile and booking options.</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
