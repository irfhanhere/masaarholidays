"use client";

import { useState } from "react";
import { COUNTRY_CODES } from "@/lib/country-codes";

/** Keeps only digits — the national number is entered separately from the country code, so no "+" or letters belong here. */
function sanitizeNationalNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Country-code select + digits-only national number, combined into a
 * hidden "{name}" input as one real E.164-style number (e.g.
 * "+971501234567") for the surrounding form to submit. Used by every
 * enquiry form on the site so phone validation and the country list stay
 * consistent — never a free-text field that accepts letters/symbols.
 */
export function PhoneNumberField({
  name,
  label = "Phone / WhatsApp",
  required = true,
  id,
}: {
  name: string;
  label?: string;
  required?: boolean;
  id?: string;
}) {
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [nationalNumber, setNationalNumber] = useState("");
  const fieldId = id ?? `${name}_national`;

  return (
    <div>
      <input type="hidden" name={name} value={nationalNumber ? `${countryCode}${nationalNumber}` : ""} readOnly />
      <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor={fieldId}>
        {label}
        {required && " *"}
      </label>
      <div className="flex gap-2">
        <select
          aria-label="Country code"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-36 shrink-0 rounded-md border border-black/15 px-2 py-2 text-sm"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code + c.name} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        <input
          id={fieldId}
          type="tel"
          inputMode="numeric"
          required={required}
          value={nationalNumber}
          onChange={(e) => setNationalNumber(sanitizeNationalNumber(e.target.value))}
          minLength={6}
          maxLength={12}
          title="Enter your number without the country code — digits only"
          placeholder="5X XXX XXXX"
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
