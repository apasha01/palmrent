/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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

function formatIranMobile(value: string) {
  const digits = onlyDigits(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

function formatGeneric(value: string) {
  const digits = onlyDigits(value).slice(0, 15);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function formatByCountry(country: Country, value: string) {
  if (country.iso2 === "ir") return formatIranMobile(value);
  return formatGeneric(value);
}

function findCountryByIso2(iso2?: string | null) {
  if (!iso2) return null;
  return countries.find((c) => c.iso2.toLowerCase() === iso2.toLowerCase()) ?? null;
}

function getNationalNumberFromFullValue(fullValue: string, fallbackCountry: Country) {
  if (!fullValue) return "";
  const normalized = toEnglishDigits(fullValue).trim();

  if (!normalized.startsWith("+")) {
    return formatByCountry(fallbackCountry, normalized);
  }

  const withoutPlus = normalized.slice(1);

  const matchedCountry = [...countries]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => withoutPlus.startsWith(c.dialCode));

  if (!matchedCountry) {
    return formatByCountry(fallbackCountry, withoutPlus);
  }

  const national = withoutPlus.slice(matchedCountry.dialCode.length);
  return formatByCountry(matchedCountry, national);
}

function getCountryFromFullValue(fullValue: string, fallbackCountry: Country) {
  if (!fullValue || !fullValue.startsWith("+")) return fallbackCountry;

  const normalized = toEnglishDigits(fullValue).trim().slice(1);

  return (
    [...countries]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((c) => normalized.startsWith(c.dialCode)) ?? fallbackCountry
  );
}

export default function PhoneInputCustom({
  value,
  onChange,
  defaultCountry,
  placeholder = "شماره وارد کنید (واتساپ)",
  className = "",
  error = false,
}: Props) {
  const locale = useLocale();

  const isRtlLocale =
    locale?.toLowerCase().startsWith("fa") ||
    locale?.toLowerCase().startsWith("ar");

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [resolvedDefaultCountry, setResolvedDefaultCountry] = useState<string | null>(() => {
    if (defaultCountry?.trim()) return defaultCountry.toLowerCase();
    if (locale?.toLowerCase().startsWith("fa")) return "ir";
    return null;
  });

  const [hasResolvedCountry, setHasResolvedCountry] = useState<boolean>(() => {
    if (defaultCountry?.trim()) return true;
    if (locale?.toLowerCase().startsWith("fa")) return true;
    return false;
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const safeFallbackCountry = findCountryByIso2(resolvedDefaultCountry) ?? countries[0];

  const [selected, setSelected] = useState<Country>(() =>
    getCountryFromFullValue(value, safeFallbackCountry),
  );

  const [localNumber, setLocalNumber] = useState(() =>
    getNationalNumberFromFullValue(value, safeFallbackCountry),
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveCountry() {
      if (defaultCountry?.trim()) {
        const normalized = defaultCountry.toLowerCase();
        if (!cancelled) {
          setResolvedDefaultCountry(normalized);
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

      try {
        const res = await fetch("/api/detect-country", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`status ${res.status}`);

        const data: DetectCountryResponse = await res.json();
        const iso2 = data.country?.toLowerCase() ?? null;
        const matchedCountry = findCountryByIso2(iso2);

        if (!cancelled) {
          setResolvedDefaultCountry(matchedCountry?.iso2 ?? null);
          setHasResolvedCountry(true);
        }
      } catch {
        if (!cancelled) {
          setResolvedDefaultCountry(null);
          setHasResolvedCountry(true);
        }
      }
    }

    resolveCountry();

    return () => {
      cancelled = true;
    };
  }, [defaultCountry, locale]);

  useEffect(() => {
    const fallback = findCountryByIso2(resolvedDefaultCountry) ?? countries[0];
    const nextCountry = getCountryFromFullValue(value, fallback);
    const nextLocal = getNationalNumberFromFullValue(value, fallback);

    setSelected((prev) => (prev.iso2 !== nextCountry.iso2 ? nextCountry : prev));
    setLocalNumber((prev) => (prev !== nextLocal ? nextLocal : prev));
  }, [value, resolvedDefaultCountry]);

  useEffect(() => {
    if (!hasResolvedCountry) return;
    if (value) return;

    const nextFallback = findCountryByIso2(resolvedDefaultCountry) ?? countries[0];
    setSelected((prev) => (prev.iso2 !== nextFallback.iso2 ? nextFallback : prev));
  }, [hasResolvedCountry, resolvedDefaultCountry, value]);

  useEffect(() => {
    const digits = onlyDigits(localNumber);
    const full = digits ? `+${selected.dialCode}${digits}` : "";
    onChangeRef.current(full);
  }, [selected, localNumber]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;

    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = useCallback((country: Country) => {
    setSelected(country);
    setLocalNumber((prev) => formatByCountry(country, prev));
    setDrawerOpen(false);
    // Wait for drawer close animation to complete before focusing input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
  }, []);

  const handleNumberInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatByCountry(selected, e.target.value);
      setLocalNumber(formatted);
    },
    [selected],
  );

  useEffect(() => {
    if (drawerOpen) {
      setSearch("");
    }
  }, [drawerOpen]);

  return (
    <>
      <div
        className={`flex items-stretch h-12 rounded-lg border overflow-hidden shadow-xs transition-all bg-white ${
          error
            ? "border-red-500 ring-1 ring-red-200"
            : "border-gray-300 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-2 h-full border-l bg-white shrink-0"
        >
          <span className="text-lg w-6 text-center overflow-hidden shrink-0">
            {selected.flag}
          </span>

          <span className="text-xs font-medium text-gray-500 tabular-nums whitespace-nowrap">
            +{selected.dialCode}
          </span>

          <svg
            className="w-3 h-3 text-gray-400 transition-colors shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          dir={localNumber ? "ltr" : isRtlLocale ? "rtl" : "ltr"}
          autoComplete="tel"
          value={localNumber}
          onChange={handleNumberInput}
          placeholder={placeholder}
          style={{ fontSize: "16px" }}
          className={`
            flex-1 min-w-0 h-full px-3 bg-transparent outline-none border-none
            font-mono tabular-nums
            ${error ? "text-red-500 placeholder:text-red-400" : "text-gray-800 placeholder:text-gray-500"}
            ${localNumber ? "text-left" : isRtlLocale ? "text-right" : "text-left"}
          `}
        />
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className=" w-full">
          <div className="max-w-3xl mx-auto w-full">
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
                  className="px-9 h-10"
                />
              </div>
            </DrawerHeader>

            <ScrollArea className="overflow-y-auto py-2 max-h-[30vh]">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-4xl mb-2">🔍</span>
                  <p className="text-sm">نتیجه‌ای پیدا نشد</p>
                </div>
              ) : (
                filtered.map((c) => {
                  const isActive = c.iso2 === selected.iso2;

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
    </>
  );
}
