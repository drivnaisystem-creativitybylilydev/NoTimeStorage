import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export type CountryCode = string;

// Helper to build emoji flag from ISO country code (e.g. "US" -> 🇺🇸)
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1F1E6;
  const first = code.charCodeAt(0) - 65 + base;
  const second = code.charCodeAt(1) - 65 + base;
  return String.fromCodePoint(first, second);
}

export const SUPPORTED_COUNTRIES: { code: CountryCode; label: string }[] = getCountries().map((code) => {
  const callingCode = getCountryCallingCode(code);
  const flag = countryCodeToFlag(code);
  return {
    code,
    // Only show flag + calling code to keep the control compact.
    label: `${flag || code} +${callingCode}`,
  };
});

export function normalizePhoneForStorage(raw: string, country: CountryCode): string {
  const value = raw.trim();
  if (!value) return '';

  const parsed = parsePhoneNumberFromString(value, country);
  if (!parsed) return value;

  // Store as E.164 so backend has a clean, country-agnostic format.
  return parsed.number; // e.g. +15551234567
}

export function formatPhoneForDisplay(raw: string, fallbackCountry: CountryCode = 'US'): string {
  const value = raw.trim();
  if (!value) return '';

  const parsed =
    parsePhoneNumberFromString(value) ||
    parsePhoneNumberFromString(value, fallbackCountry);

  if (!parsed) return value;

  // Show in national format: (xxx) xxx xxxx in US, local style elsewhere.
  return parsed.formatNational();
}

