"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const COUNTRY_DATA_KEYS: Record<string, string> = {
  Eswatini: "Swaziland",
  Jordan: "Hashemite Kingdom of Jordan",
  Lithuania: "Republic of Lithuania",
  "North Macedonia": "Macedonia",
  Moldova: "Republic of Moldova",
  Myanmar: "Myanmar [Burma]",
  "South Korea": "Republic of Korea",
};

type CityEntry = { city: string; search: string };

const cityDataCache = new Map<string, Promise<CityEntry[]>>();

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function prefixStart(cities: CityEntry[], query: string): number {
  let low = 0;
  let high = cities.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (cities[middle].search < query) low = middle + 1;
    else high = middle;
  }
  return low;
}

function rankCityMatches(cities: CityEntry[], query: string): string[] {
  const cityPrefixes: string[] = [];
  const wordPrefixes: string[] = [];
  const substrings: string[] = [];
  const selected = new Set<string>();

  // City-name prefixes are by far the common case. The entries are sorted by
  // their normalized form, so a binary search avoids scanning large files such
  // as Brazil and the United States on every keystroke.
  for (let index = prefixStart(cities, query); index < cities.length; index += 1) {
    const entry = cities[index];
    if (!entry.search.startsWith(query) || cityPrefixes.length >= 30) break;
    cityPrefixes.push(entry.city);
    selected.add(entry.city);
  }
  if (cityPrefixes.length >= 30) return cityPrefixes;

  for (const entry of cities) {
    if (selected.has(entry.city)) continue;
    if (entry.search.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(query))) {
      wordPrefixes.push(entry.city);
    } else if (entry.search.includes(query)) {
      substrings.push(entry.city);
    }
  }

  return [...cityPrefixes, ...wordPrefixes, ...substrings].slice(0, 30);
}

function countrySlug(country: string): string {
  return country
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadCityData(country: string): Promise<CityEntry[]> {
  const dataCountry = COUNTRY_DATA_KEYS[country] ?? country;
  const slug = countrySlug(dataCountry);
  const cached = cityDataCache.get(slug);
  if (cached) return cached;

  const request = fetch(`/cities/${slug}.json`, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("City suggestions unavailable");
      return response.json() as Promise<string[]>;
    })
    .then((countryCities) => Array.from(new Set(
      countryCities.map((city) => city.trim()).filter(Boolean),
    ))
      .map((city) => ({ city, search: normalizeSearchValue(city) }))
      .sort((first, second) => (
        first.search < second.search ? -1
          : first.search > second.search ? 1
            : first.city.localeCompare(second.city)
      )))
    .catch((error) => {
      cityDataCache.delete(slug);
      throw error;
    });
  cityDataCache.set(slug, request);
  return request;
}

type CityComboboxProps = {
  country: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

/** Country-aware city suggestions. The local dataset loads lazily after focus
 * and the input always accepts free text, so a missing city never blocks an
 * enquiry. Typed city text never leaves the browser. */
export default function CityCombobox({
  country,
  value,
  onChange,
  error,
  disabled,
  ...rest
}: CityComboboxProps) {
  const listId = useId();
  const statusId = useId();
  const requestId = useRef(0);
  const mounted = useRef(true);
  const loadingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cities, setCities] = useState<CityEntry[]>([]);
  const [loadedCountry, setLoadedCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (country) void loadCityData(country).catch(() => undefined);
  }, [country]);

  const normalized = normalizeSearchValue(value);
  const matches = useMemo(
    () => normalized ? rankCityMatches(cities, normalized) : [],
    [cities, normalized],
  );

  async function loadCities() {
    if (!country || loadingRef.current || loadedCountry === country) return;
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    loadingRef.current = true;
    setLoading(true);
    setLoadFailed(false);

    try {
      const countryCities = await loadCityData(country);
      if (!countryCities.length) throw new Error("City suggestions unavailable");
      if (!mounted.current || requestId.current !== currentRequest) return;
      setCities(countryCities);
      setLoadedCountry(country);
    } catch {
      if (mounted.current && requestId.current === currentRequest) setLoadFailed(true);
    } finally {
      if (requestId.current === currentRequest) loadingRef.current = false;
      if (mounted.current && requestId.current === currentRequest) setLoading(false);
    }
  }

  function choose(city: string) {
    onChange(city);
    setOpen(false);
    setActiveIndex(0);
  }

  const cityDisabled = disabled || !country;

  return (
    <div className="relative">
      <input
        {...rest}
        type="text"
        role="combobox"
        autoComplete="address-level2"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(normalized)}
        aria-controls={listId}
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-busy={loading || undefined}
        aria-describedby={[rest["aria-describedby"], loading || loadFailed ? statusId : ""].filter(Boolean).join(" ") || undefined}
        disabled={cityDisabled}
        placeholder={country ? `Start typing a city in ${country}…` : "Choose a country first"}
        value={value}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(0);
          void loadCities();
        }}
        onChange={(event) => {
          onChange(event.target.value.slice(0, 80));
          setOpen(true);
          setActiveIndex(0);
          void loadCities();
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && matches.length) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
          } else if (event.key === "ArrowUp" && matches.length) {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && matches[activeIndex]) {
            event.preventDefault();
            choose(matches[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full border px-4 py-3 text-base outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {open && normalized && !loading && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border py-1 shadow-xl"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {matches.map((city, index) => (
            <li
              id={`${listId}-${index}`}
              key={city}
              role="option"
              aria-selected={city === value}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(city);
              }}
              className="cursor-pointer px-4 py-3 text-sm"
              style={{
                backgroundColor: index === activeIndex ? "var(--surface-2)" : "transparent",
                color: "var(--text)",
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}

      {(loading || loadFailed) && (
        <p id={statusId} className="mt-1.5 text-xs" role="status" style={{ color: "var(--text-40)" }}>
          {loading ? `Loading city suggestions for ${country}…` : "Suggestions unavailable — type the city manually."}
        </p>
      )}
      {country && !loading && !loadFailed && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-30)" }}>
          Local suggestions only — you can type any city or town.
        </p>
      )}
    </div>
  );
}
