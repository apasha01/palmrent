"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useLocale } from "next-intl";
import { countries, type Country } from "@/lib/countries";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface Props {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
  lockedCountry?: boolean;
  /** When true: input is read-only, flag button is non-interactive, no drawer opens */
  disabled?: boolean;
}

type DetectCountryResponse = {
  country?: string | null;
  source?: string | null;
  ip?: string | null;
  countryName?: string | null;
  city?: string | null;
  region?: string | null;
  providerMessage?: string | null;
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function onlyDigits(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

function findCountryByIso2(iso2?: string | null) {
  if (!iso2) return null;
  return countries.find((c) => c.iso2.toLowerCase() === iso2.toLowerCase()) ?? null;
}

function getCountryFromValue(rawValue: string, fallbackCountry: Country): Country {
  const value = (rawValue ?? "").trim();
  if (!value.startsWith("+")) return fallbackCountry;
  const normalized = toEnglishDigits(value).slice(1);
  return (
    [...countries]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((c) => normalized.startsWith(c.dialCode)) ?? fallbackCountry
  );
}

function sanitizeIranLocalNumber(value: string) {
  let digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(0, 11);
  return digits.slice(0, 10);
}

function sanitizeLocalNumberByCountry(country: Country, value: string) {
  const digits = onlyDigits(value);
  if (country.iso2.toLowerCase() === "ir") return sanitizeIranLocalNumber(value);
  return digits.slice(0, 15);
}

function getDisplayLocalNumber(value: string, country: Country): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const iso2 = country.iso2.toLowerCase();

  if (iso2 === "ir") {
    if (raw.startsWith("+")) {
      const normalized = toEnglishDigits(raw).slice(1);
      if (normalized.startsWith("98")) {
        const national = normalized.slice(2);
        if (/^9\d{9}$/.test(national)) return `0${national}`;
        if (/^0\d+$/.test(national)) return national;
        return national;
      }
    }
    return sanitizeIranLocalNumber(raw);
  }

  if (raw.startsWith("+")) {
    const normalized = toEnglishDigits(raw).slice(1);
    if (normalized.startsWith(country.dialCode)) {
      return onlyDigits(normalized.slice(country.dialCode.length)).slice(0, 15);
    }
    return onlyDigits(normalized).slice(0, 15);
  }

  return onlyDigits(raw).slice(0, 15);
}

function buildEmittedValue(country: Country, localNumber: string): string {
  const iso2 = country.iso2.toLowerCase();
  if (iso2 === "ir") return sanitizeIranLocalNumber(localNumber);
  const digits = sanitizeLocalNumberByCountry(country, localNumber).replace(/^0+/, "");
  return digits ? `+${country.dialCode}${digits}` : `+${country.dialCode}`;
}

export default function PhoneInputCustom({
  value,
  onChange,
  defaultCountry,
  placeholder,
  className = "",
  error = false,
  lockedCountry = false,
  disabled = false,
}: Props) {
  const locale = useLocale();

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [shouldFocusMainInput, setShouldFocusMainInput] = useState(false);

  const [resolvedDefaultCountry, setResolvedDefaultCountry] = useState<string | null>(
    () => {
      if (defaultCountry?.trim()) return defaultCountry.toLowerCase();
      if (locale?.toLowerCase().startsWith("fa")) return "ir";
      return null;
    }
  );

  const [hasResolvedCountry, setHasResolvedCountry] = useState<boolean>(() => {
    if (defaultCountry?.trim()) return true;
    if (locale?.toLowerCase().startsWith("fa")) return true;
    return false;
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const safeFallbackCountry =
    findCountryByIso2(resolvedDefaultCountry) ?? countries[0];

  const derivedSelected = useMemo(
    () => getCountryFromValue(value, safeFallbackCountry),
    [value, safeFallbackCountry]
  );

  const derivedLocalNumber = useMemo(
    () => getDisplayLocalNumber(value, derivedSelected),
    [value, derivedSelected]
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveCountry() {
      if (defaultCountry?.trim()) {
        if (!cancelled) {
          setResolvedDefaultCountry(defaultCountry.toLowerCase());
          setHasResolvedCountry(true);
        }
        return;
      }

      if (locale?.toLowerCase().startsWith("fa")) {
        if (!cancelled) {
          setResolvedDefaultCountry("ir");
          setHasResolvedCountry(true);
        }
        return;
      }

      // اگر disabled یا lockedCountry بود، API صدا نزن
      if (!lockedCountry && !disabled) {
        try {
          const res = await fetch("/api/detect-country", {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`status ${res.status}`);
          const data: DetectCountryResponse = await res.json();
          const iso2 = data.country?.toLowerCase() ?? null;
          const matched = findCountryByIso2(iso2);
          if (!cancelled) {
            setResolvedDefaultCountry(matched?.iso2 ?? null);
            setHasResolvedCountry(true);
          }
        } catch {
          if (!cancelled) {
            setResolvedDefaultCountry(null);
            setHasResolvedCountry(true);
          }
        }
      } else {
        if (!cancelled) setHasResolvedCountry(true);
      }
    }

    resolveCountry();
    return () => { cancelled = true; };
  }, [defaultCountry, locale, lockedCountry, disabled]);

  useEffect(() => {
    if (!hasResolvedCountry) return;
    if (value) return;
    if (derivedSelected.iso2 === safeFallbackCountry.iso2) return;

    const initialValue =
      safeFallbackCountry.iso2.toLowerCase() === "ir"
        ? ""
        : `+${safeFallbackCountry.dialCode}`;

    onChangeRef.current(initialValue);
  }, [
    hasResolvedCountry,
    value,
    derivedSelected.iso2,
    safeFallbackCountry.iso2,
    safeFallbackCountry.dialCode,
  ]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q)
    );
  }, [search]);

  const focusMainInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        try { el.setSelectionRange(len, len); } catch {}
      });
    });
  }, []);

  const handleSelect = useCallback(
    (country: Country) => {
      const next = buildEmittedValue(country, derivedLocalNumber);
      onChangeRef.current(next);
      setShouldFocusMainInput(true);
      flushSync(() => { setDrawerOpen(false); });
    },
    [derivedLocalNumber]
  );

  const handleNumberInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // اگر disabled بود، تغییر نده
      if (disabled) return;
      const nextLocal = sanitizeLocalNumberByCountry(derivedSelected, e.target.value);
      const nextValue = buildEmittedValue(derivedSelected, nextLocal);
      onChangeRef.current(nextValue);
    },
    [derivedSelected, disabled]
  );

  useEffect(() => {
    if (drawerOpen) setSearch("");
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen && shouldFocusMainInput) {
      focusMainInput();
      setShouldFocusMainInput(false);
    }
  }, [drawerOpen, shouldFocusMainInput, focusMainInput]);

  const handleCountryButtonClick = () => {
    // اگر disabled یا lockedCountry بود، drawer باز نشود
    if (disabled || lockedCountry) return;
    setDrawerOpen(true);
  };

  // وقتی disabled است، همه‌چیز read-only و غیرفعال
  const isEffectivelyLocked = disabled || lockedCountry;

  return (
    <>
      <div
        className={`flex items-stretch h-12 rounded-lg border overflow-hidden shadow-xs transition-all bg-white ${
          disabled
            ? "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
            : error
            ? "border-red-500 ring-1 ring-red-200"
            : "border-gray-300 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        } ${className}`}
      >
        {/* ── Flag / country code button ── */}
        <button
          type="button"
          onClick={handleCountryButtonClick}
          disabled={isEffectivelyLocked}
          tabIndex={disabled ? -1 : undefined}
          className={`flex items-center gap-1.5 px-2 h-full border-l bg-white shrink-0 ${
            isEffectivelyLocked
              ? "cursor-default opacity-70"
              : "cursor-pointer hover:bg-gray-50 transition-colors"
          }`}
        >
          <span className="text-lg w-6 text-center overflow-hidden shrink-0">
            {derivedSelected.flag}
          </span>

          <span className="text-xs font-medium text-gray-500 tabular-nums whitespace-nowrap">
            +{derivedSelected.dialCode}
          </span>

          {/* chevron فقط اگر نه disabled و نه locked */}
          {!isEffectivelyLocked && (
            <svg
              className="w-3 h-3 text-gray-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* ── Number input ── */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          autoComplete={disabled ? "off" : "tel"}
          readOnly={disabled}
          tabIndex={disabled ? -1 : undefined}
          value={derivedLocalNumber}
          onChange={handleNumberInput}
          placeholder={disabled ? "" : placeholder}
          style={{
            fontSize: "16px",
            textAlign: derivedLocalNumber ? "left" : "right",
            cursor: disabled ? "default" : undefined,
          }}
          className={`
            flex-1 min-w-0 h-full px-3 bg-transparent outline-none border-none
            font-mono tabular-nums
            ${disabled
              ? "text-gray-600 select-none pointer-events-none"
              : error
              ? "text-red-500 placeholder:text-red-400"
              : "text-gray-800 placeholder:text-gray-500"
            }
          `}
        />
      </div>

      {/* Drawer فقط اگر نه disabled و نه locked */}
      {!isEffectivelyLocked && (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          repositionInputs={false}
        >
          <DrawerContent className="w-full">
            <div className="max-w-3xl mx-auto w-full overflow-hidden">
              <DrawerHeader className="pb-3">
                <DrawerTitle className="text-base font-bold text-center">
                  کشور را انتخاب کنید
                </DrawerTitle>

                <div className="relative mt-3">
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    width="18px"
                    height="18px"
                  />
                  <Input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام یا کد کشور"
                    inputMode="search"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    style={{ fontSize: "16px" }}
                    className="px-9 h-11 text-base"
                  />
                </div>
              </DrawerHeader>

              <ScrollArea className="overflow-y-auto py-2 max-h-[35dvh]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <span className="text-4xl mb-2">🔍</span>
                    <p className="text-sm">نتیجه‌ای پیدا نشد</p>
                  </div>
                ) : (
                  filtered.map((c) => {
                    const isActive = c.iso2 === derivedSelected.iso2;
                    return (
                      <button
                        key={c.iso2}
                        type="button"
                        onClick={() => handleSelect(c)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors mb-0.5 ${
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "hover:bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full min-w-0">
                          <div className="shrink-0 w-8 text-center">
                            <span className="text-2xl leading-none">{c.flag}</span>
                          </div>
                          <div className="flex gap-2 items-center min-w-0">
                            {isActive && (
                              <Check className="w-5 h-5 text-blue-500 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-mono px-2 py-0.5 rounded-md shrink-0 ${
                                isActive
                                  ? "bg-blue-100 text-blue-500"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                              dir="ltr"
                            >
                              +{c.dialCode}
                            </span>
                            <span className="truncate">{c.name}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}