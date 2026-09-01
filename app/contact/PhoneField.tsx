"use client";

import IntlTelInput, { type IntlTelInputRef } from "@intl-tel-input/react";
import type { Iso2 } from "intl-tel-input";
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
  const selectorOpenRef = useRef(false);
  const [selectedCountry, setSelectedCountry] = useState<Iso2 | "">(initialCountry);
  const [selectorVersion, setSelectorVersion] = useState(0);
  const canClearCountry = Boolean(selectedCountry && !value);

  function handleNumberChange(number: string) {
    onChange(number);
  }

  function handleDetectedCountry(country: string) {
    const nextCountry = country as Iso2 | "";
    const lockedCountry = lockedCountryRef.current;
    const instance = intlInputRef.current?.getInstance();
    if (selectorOpenRef.current) {
      setSelectedCountry(nextCountry);
      onCountryChange?.(nextCountry);
      return;
    }
    if (lockedCountry && nextCountry && nextCountry !== lockedCountry) {
      // Changing only the flag through the library API also reformats the input.
      // Preserve the exact text and caret that the visitor entered, then emit one
      // country-change input event so the React wrapper recalculates its canonical
      // number against the restored country without processing the text again.
      const input = intlInputRef.current?.getInput();
      const displayedNumber = input?.value;
      const selectionStart = input?.selectionStart;
      const selectionEnd = input?.selectionEnd;
      instance?.setSelectedCountry(lockedCountry);
      if (input && displayedNumber !== undefined) {
        input.value = displayedNumber;
        if (document.activeElement === input && selectionStart != null && selectionEnd != null) {
          input.setSelectionRange(selectionStart, selectionEnd);
        }
        input.dispatchEvent(
          new CustomEvent("input", { bubbles: true, detail: { isCountryChange: true } })
        );
      }
      return;
    }

    setSelectedCountry(nextCountry);
    onCountryChange?.(nextCountry);
  }

  function handleCountrySelectorClose() {
    selectorOpenRef.current = false;
    const country = intlInputRef.current?.getInstance()?.getSelectedCountry();
    if (!country) return;
    lockedCountryRef.current = country.iso2;
    setSelectedCountry(country.iso2);
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
        onOpenCountrySelector={() => {
          selectorOpenRef.current = true;
        }}
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
            setSelectedCountry("");
            onCountryChange?.("");
            // intl-tel-input supports an empty country only during initialisation,
            // so remount this one selector to restore that supported state.
            setSelectorVersion((version) => version + 1);
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
