"use client";

import { useId, useState } from "react";
import { COUNTRIES } from "@/data/formOptions";

const COUNTRY_ALIASES: Record<string, string[]> = {
  "United Kingdom": ["uk", "gb", "great britain", "england", "scotland", "wales"],
  "United States": ["us", "usa", "america"],
  "United Arab Emirates": ["uae"],
  Netherlands: ["holland"],
  "South Korea": ["korea"],
  "Czech Republic": ["czechia"],
};

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
  const matches = COUNTRIES.filter((country) => {
    if (!normalized) return true;
    return country.toLowerCase().includes(normalized)
      || COUNTRY_ALIASES[country]?.some((alias) => alias.includes(normalized));
  }).slice(0, 30);

  const choose = (country: string) => {
    onChange(country);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div className="relative">
      <input
        {...rest}
        type="text"
        role="combobox"
        autoComplete="country-name"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
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
        className="w-full border px-4 py-3 text-base outline-none transition-all"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border py-1 shadow-xl"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          {matches.length ? matches.map((country, index) => (
            <li
              id={`${listId}-${index}`}
              key={country}
              role="option"
              aria-selected={country === value}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(country);
              }}
              className="cursor-pointer px-4 py-3 text-sm"
              style={{
                backgroundColor: index === activeIndex ? "var(--surface-2)" : "transparent",
                color: "var(--text)",
              }}
            >
              {country}
            </li>
          )) : (
            <li className="px-4 py-3 text-sm" style={{ color: "var(--text-40)" }}>
              No matching country
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
