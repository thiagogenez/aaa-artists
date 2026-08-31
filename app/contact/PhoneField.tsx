"use client";

import IntlTelInput from "@intl-tel-input/react";
import type { Iso2 } from "intl-tel-input";
import "intl-tel-input/styles";
import { useState } from "react";

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
  const [selectedCountry, setSelectedCountry] = useState<Iso2 | "">(initialCountry);
  const [selectorVersion, setSelectorVersion] = useState(0);
  const canClearCountry = Boolean(selectedCountry && !value);

  return (
    <div className={`aaa-phone-field${canClearCountry ? " aaa-phone-field--clearable" : ""}`}>
      <IntlTelInput
        key={selectorVersion}
        initialCountry={initialCountry}
        loadUtils={() => import("intl-tel-input/utils")}
        value={value}
        onChangeNumber={onChange}
        onChangeCountry={(country) => {
          const nextCountry = country as Iso2 | "";
          setSelectedCountry(nextCountry);
          onCountryChange?.(nextCountry);
        }}
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
          onBlur,
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
