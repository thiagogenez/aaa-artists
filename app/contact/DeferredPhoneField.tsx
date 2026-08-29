"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhoneFieldProps } from "./PhoneField";

type PhoneFieldComponent = typeof import("./PhoneField").default;

let phoneFieldPromise: Promise<typeof import("./PhoneField")> | undefined;

function loadPhoneField() {
  phoneFieldPromise ??= import("./PhoneField").catch((error) => {
    phoneFieldPromise = undefined;
    throw error;
  });
  return phoneFieldPromise;
}

function PendingCountryIcon() {
  return (
    <span className="aaa-phone-pending-country" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <span className="aaa-phone-pending-arrow" />
    </span>
  );
}

/**
 * Keep the optional phone dependency out of the initial route. The native input
 * remains usable while the enhanced control loads, then hands its current value
 * to intl-tel-input without dropping keyboard focus.
 */
export default function DeferredPhoneField({
  value,
  error,
  initialCountry,
  onChange,
  onCountryChange,
  onValidityChange,
  onBlur,
  ...inputProps
}: PhoneFieldProps) {
  const [EnhancedPhoneField, setEnhancedPhoneField] = useState<PhoneFieldComponent | null>(null);
  const [enhancementFailed, setEnhancementFailed] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const enhancedRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enhance = useCallback(
    (shouldRestoreFocus = false) => {
      if (shouldRestoreFocus && document.activeElement === fallbackRef.current) {
        setRestoreFocus(true);
      }
      void loadPhoneField()
        .then((module) => {
          if (mountedRef.current) setEnhancedPhoneField(() => module.default);
        })
        .catch(() => {
          if (!mountedRef.current) return;
          // Keep the optional native field usable if its enhancement chunk cannot
          // be fetched. A failed enhancement must not block the whole enquiry.
          setEnhancementFailed(true);
          onValidityChange(true);
        });
    },
    [onValidityChange]
  );

  // A restored draft already contains deliberate phone input, so enhance it
  // without waiting for another interaction.
  useEffect(() => {
    if (value) enhance();
  }, [enhance, value]);

  useEffect(() => {
    if (!EnhancedPhoneField || !restoreFocus) return;
    const frame = window.requestAnimationFrame(() => {
      enhancedRef.current?.querySelector("input")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [EnhancedPhoneField, restoreFocus]);

  if (EnhancedPhoneField) {
    return (
      <div ref={enhancedRef} data-phone-enhancement="ready">
        <EnhancedPhoneField
          {...inputProps}
          value={value}
          error={error}
          initialCountry={initialCountry}
          onChange={onChange}
          onCountryChange={onCountryChange}
          onValidityChange={onValidityChange}
          onBlur={onBlur}
        />
      </div>
    );
  }

  return (
    <div
      className="aaa-phone-field"
      data-phone-enhancement={enhancementFailed ? "fallback" : "pending"}
    >
      {!enhancementFailed && <PendingCountryIcon />}
      <input
        {...inputProps}
        ref={fallbackRef}
        type="tel"
        name={inputProps.name ?? "phone"}
        autoComplete="tel"
        inputMode="tel"
        value={value}
        onPointerEnter={(event) => {
          inputProps.onPointerEnter?.(event);
          enhance();
        }}
        onPointerDown={(event) => {
          inputProps.onPointerDown?.(event);
          enhance();
        }}
        onFocus={(event) => {
          inputProps.onFocus?.(event);
          enhance(true);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          // Do not let a non-empty number bypass library validation while the
          // enhancement is still loading.
          onValidityChange(enhancementFailed || !nextValue);
        }}
        onBlur={onBlur}
        className="aaa-phone-input w-full border px-4 py-3 text-base outline-none transition-all"
        style={{
          borderColor: error ? "var(--error)" : "var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}
