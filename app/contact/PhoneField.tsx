"use client";

import IntlTelInput, { intlTelInput, type IntlTelInputRef } from "@intl-tel-input/react";
import type { Country, Iso2 } from "intl-tel-input";
import "intl-tel-input/styles";
import { useRef, useState } from "react";

export type PhoneFieldProps = {
  value: string;
  error?: string;
  initialCountry?: Iso2 | "";
  onChange: (number: string) => void;
  onCountryChange?: (country: Iso2 | "") => void;
  onValidityChange: (isValid: boolean) => void;
  onBlur: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">;

type CountrySuggestion = Pick<Country, "iso2" | "name">;

function normalizeDomesticPrefix(number: string, countryIso: Iso2 | ""): string | null {
  if (!countryIso) return null;
  const country = intlTelInput.getAllCountries().find(({ iso2 }) => iso2 === countryIso);
  if (!country?.nationalPrefix) return null;

  const digits = number.replace(/\D/g, "");
  const domesticPrefix = `${country.dialCode}${country.nationalPrefix}`;
  if (!digits.startsWith(domesticPrefix) || digits.length <= domesticPrefix.length) return null;

  return `+${country.dialCode}${digits.slice(domesticPrefix.length)}`;
}

function matchesCountryAreaCode(number: string, countryIso: Iso2 | ""): boolean {
  if (!countryIso) return false;
  const country = intlTelInput.getAllCountries().find(({ iso2 }) => iso2 === countryIso);
  const digits = number.replace(/\D/g, "");
  return Boolean(country?.areaCodes?.some((areaCode) => digits.startsWith(areaCode)));
}

/** International phone input with searchable countries and E.164 output.
 * Utilities are split into a lazy chunk so the large numbering-plan dataset is
 * downloaded only when this client component is used. No IP lookup is made. */
export default function PhoneField({
  value,
  error,
  initialCountry = "",
  onChange,
  onCountryChange,
  onValidityChange,
  onBlur,
  ...inputProps
}: PhoneFieldProps) {
  const intlInputRef = useRef<IntlTelInputRef>(null);
  const lockedCountryRef = useRef<Iso2 | "">(initialCountry);
  const normalizationVersionRef = useRef(0);
  const normalizedDomesticNumberRef = useRef<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Iso2 | "">(initialCountry);
  const [selectorVersion, setSelectorVersion] = useState(0);
  const [suggestedCountry, setSuggestedCountry] = useState<CountrySuggestion | null>(null);
  const [showCountrySuggestion, setShowCountrySuggestion] = useState(false);
  const canClearCountry = Boolean(selectedCountry && !value);

  function handleNumberChange(number: string) {
    const normalizationVersion = normalizationVersionRef.current + 1;
    normalizationVersionRef.current = normalizationVersion;
    if (normalizedDomesticNumberRef.current !== number) normalizedDomesticNumberRef.current = null;
    setSuggestedCountry(null);
    setShowCountrySuggestion(false);
    onChange(number);

    const normalizedNumber = normalizeDomesticPrefix(number, lockedCountryRef.current);
    if (!normalizedNumber || normalizedNumber === number) return;
    normalizedDomesticNumberRef.current = normalizedNumber;
    queueMicrotask(() => {
      if (normalizationVersionRef.current !== normalizationVersion) return;
      intlInputRef.current?.getInstance()?.setNumber(normalizedNumber);
      setSuggestedCountry(null);
      setShowCountrySuggestion(false);
    });
  }

  function handleDetectedCountry(country: string) {
    const nextCountry = country as Iso2 | "";
    const lockedCountry = lockedCountryRef.current;
    const instance = intlInputRef.current?.getInstance();
    if (lockedCountry && nextCountry && nextCountry !== lockedCountry) {
      const detectedCountry = instance?.getSelectedCountry();
      if (detectedCountry && !normalizedDomesticNumberRef.current) {
        setSuggestedCountry({ iso2: detectedCountry.iso2, name: detectedCountry.name });
      }
      instance?.setSelectedCountry(lockedCountry);
      return;
    }

    setSelectedCountry(nextCountry);
    onCountryChange?.(nextCountry);
  }

  function handleCountrySelectorClose() {
    const country = intlInputRef.current?.getInstance()?.getSelectedCountry();
    if (!country) return;
    lockedCountryRef.current = country.iso2;
    setSelectedCountry(country.iso2);
    setSuggestedCountry(null);
    setShowCountrySuggestion(false);
  }

  function useSuggestedCountry() {
    if (!suggestedCountry) return;
    lockedCountryRef.current = suggestedCountry.iso2;
    setSelectedCountry(suggestedCountry.iso2);
    setSuggestedCountry(null);
    setShowCountrySuggestion(false);
    intlInputRef.current?.getInstance()?.setSelectedCountry(suggestedCountry.iso2);
  }

  return (
    <div className={`aaa-phone-field${canClearCountry ? " aaa-phone-field--clearable" : ""}`}>
      <IntlTelInput
        ref={intlInputRef}
        key={selectorVersion}
        initialCountry={selectedCountry}
        loadUtils={() => import("intl-tel-input/utils")}
        value={value}
        onChangeNumber={handleNumberChange}
        onChangeCountry={handleDetectedCountry}
        onCloseCountrySelector={handleCountrySelectorClose}
        onChangeValidity={onValidityChange}
        countrySearch
        formatAsYouType
        placeholderNumberPolicy="AGGRESSIVE"
        separateDialCode
        strictMode
        strictRejectAnimation
        inputProps={{
          ...inputProps,
          name: inputProps.name ?? "phone",
          autoComplete: "tel",
          inputMode: "tel",
          onBlur: () => {
            const displayedNumber = intlInputRef.current?.getInput()?.value ?? "";
            setShowCountrySuggestion(
              Boolean(suggestedCountry) &&
                !matchesCountryAreaCode(displayedNumber, lockedCountryRef.current)
            );
            onBlur();
          },
          className:
            "aaa-phone-input w-full border px-4 py-3 text-base outline-none transition-all",
          style: {
            borderColor: error ? "var(--error)" : "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
          },
        }}
      />
      {canClearCountry && (
        <button
          type="button"
          className="aaa-phone-country-clear"
          aria-label="Clear country selection"
          onClick={() => {
            lockedCountryRef.current = "";
            normalizationVersionRef.current += 1;
            normalizedDomesticNumberRef.current = null;
            setSelectedCountry("");
            setSuggestedCountry(null);
            setShowCountrySuggestion(false);
            onCountryChange?.("");
            // intl-tel-input supports an empty country only during initialisation,
            // so remount this one selector to restore that supported state.
            setSelectorVersion((version) => version + 1);
          }}
        >
          Clear
        </button>
      )}
      {showCountrySuggestion && suggestedCountry && (
        <div
          role="status"
          className="mt-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          style={{ color: "var(--text-60)" }}
        >
          <span>This number looks like {suggestedCountry.name}.</span>
          <button
            type="button"
            className="min-h-11 font-semibold uppercase tracking-wider underline underline-offset-4 transition-colors duration-200 hover:text-[var(--text)] focus-visible:text-[var(--text)]"
            onClick={useSuggestedCountry}
          >
            Use {suggestedCountry.name}
          </button>
        </div>
      )}
    </div>
  );
}
