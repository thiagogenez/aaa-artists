"use client";

import { useId, useState } from "react";
import { COUNTRIES } from "@/data/formOptions";
import "intl-tel-input/styles";

const COUNTRY_ALIASES: Record<string, string[]> = {
  "United Kingdom": ["uk", "gb", "great britain", "england", "scotland", "wales"],
  "United States": ["us", "usa", "america"],
  "United Arab Emirates": ["uae"],
  Netherlands: ["holland"],
  "South Korea": ["korea"],
  "Czech Republic": ["czechia"],
};

const COUNTRY_ISO_OVERRIDES: Record<string, string> = {
  "Antigua and Barbuda": "ag",
  "Bosnia and Herzegovina": "ba",
  Congo: "cg",
  "Czech Republic": "cz",
  "Democratic Republic of the Congo": "cd",
  "Ivory Coast": "ci",
  Myanmar: "mm",
  Palestine: "ps",
  "Saint Kitts and Nevis": "kn",
  "Saint Lucia": "lc",
  "Saint Vincent and the Grenadines": "vc",
  "Sao Tome and Principe": "st",
  "Trinidad and Tobago": "tt",
  Turkey: "tr",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
let countryIsoByName: Map<string, string> | undefined;

function getCountryIsoByName(): Map<string, string> {
  if (countryIsoByName) return countryIsoByName;

  const namesToFind = new Set(COUNTRIES.filter((country) => !COUNTRY_ISO_OVERRIDES[country]));
  countryIsoByName = new Map();
  for (let first = 65; first <= 90 && namesToFind.size > 0; first += 1) {
    for (let second = 65; second <= 90 && namesToFind.size > 0; second += 1) {
      const iso = String.fromCharCode(first, second);
      const name = regionNames.of(iso);
      if (!name || !namesToFind.has(name)) continue;
      countryIsoByName.set(name, iso.toLowerCase());
      namesToFind.delete(name);
    }
  }
  return countryIsoByName;
}

function countryIso(country: string): string {
  if (!country) return "";
  return COUNTRY_ISO_OVERRIDES[country] ?? getCountryIsoByName().get(country) ?? "";
}

function CountryFlag({ country }: { country: string }) {
  const iso = countryIso(country);
  return iso ? (
    <span className={`iti__flag iti__${iso} inline-block shrink-0`} aria-hidden="true" />
  ) : null;
}

type CountryComboboxProps = {
  value: string;
  onChange: (country: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

/** Searchable country picker. Only values from COUNTRIES can reach form state;
 * free-form text is treated as a search query, not trusted submission data. */
export default function CountryCombobox({ value, onChange, error, ...rest }: CountryComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const normalized = query.trim().toLowerCase();
  const selectedIso = countryIso(value);
  const matches = COUNTRIES.filter((country) => {
    if (!normalized) return true;
    return (
      country.toLowerCase().includes(normalized) ||
      COUNTRY_ALIASES[country]?.some((alias) => alias.includes(normalized))
    );
  }).slice(0, 30);

  const choose = (country: string) => {
    onChange(country);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div className="relative">
      {!open && selectedIso && (
        <span
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2"
          aria-hidden="true"
        >
          <CountryFlag country={value} />
        </span>
      )}
      <input
        {...rest}
        type="text"
        role="combobox"
        autoComplete="country-name"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
        }
        placeholder="Start typing a country…"
        value={open ? query : value}
        onFocus={() => {
          setQuery("");
          setOpen(true);
          setActiveIndex(0);
        }}
        onChange={(event) => {
          setQuery(event.target.value.slice(0, 80));
          setOpen(true);
          setActiveIndex(0);
        }}
        onBlur={() => {
          // Allow pointer selection to run before the popup closes.
          window.setTimeout(() => {
            setOpen(false);
            setQuery("");
          }, 120);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && matches[activeIndex]) {
            event.preventDefault();
            choose(matches[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
        className={`w-full border py-3 pr-4 text-base outline-none transition-all ${!open && selectedIso ? "pl-12" : "pl-4"}`}
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border py-1 shadow-xl"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {matches.length ? (
            matches.map((country, index) => (
              <div
                id={`${listId}-${index}`}
                key={country}
                role="option"
                tabIndex={-1}
                aria-selected={country === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(country);
                }}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm"
                style={{
                  backgroundColor: index === activeIndex ? "var(--surface-2)" : "transparent",
                  color: "var(--text)",
                }}
              >
                <CountryFlag country={country} />
                <span>{country}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-40)" }}>
              No matching country
            </div>
          )}
        </div>
      )}
    </div>
  );
}
