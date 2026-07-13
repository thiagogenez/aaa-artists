"use client";

import IntlTelInput from "@intl-tel-input/react";
import "intl-tel-input/styles";

type PhoneFieldProps = {
  value: string;
  error?: string;
  onChange: (number: string) => void;
  onValidityChange: (isValid: boolean) => void;
  onBlur: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">;

/** International phone input with searchable countries and E.164 output.
 * Utilities are split into a lazy chunk so the large numbering-plan dataset is
 * downloaded only when this client component is used. No IP lookup is made. */
export default function PhoneField({
  value,
  error,
  onChange,
  onValidityChange,
  onBlur,
  ...inputProps
}: PhoneFieldProps) {
  return (
    <div className="aaa-phone-field">
      <IntlTelInput
        initialCountry="gb"
        loadUtils={() => import("intl-tel-input/utils")}
        value={value}
        onChangeNumber={onChange}
        onChangeValidity={onValidityChange}
        countrySearch
        formatAsYouType
        separateDialCode
        strictMode
        strictRejectAnimation
        inputProps={{
          ...inputProps,
          name: "phone",
          autoComplete: "tel",
          inputMode: "tel",
          onBlur,
          className: "aaa-phone-input w-full border px-4 py-3 text-base outline-none transition-all",
          style: {
            borderColor: error ? "var(--error)" : "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
          },
        }}
      />
    </div>
  );
}
