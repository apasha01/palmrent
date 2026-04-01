import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "fa", 'tr'], // Add your RTL locales
  defaultLocale: "fa",
  localePrefix: "as-needed",
  localeDetection: false,
});

export const isRTLLocale = (locale: string): boolean => {
  const rtlLocales = ["ar", "fa"]; // Add more RTL locales as needed
  return rtlLocales.includes(locale);
};

export const supportedLocales = routing.locales;

export function buildLocalizedPath(locale: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (locale === "fa") {
    return cleanPath;
  }

  return `/${locale}${cleanPath}`;
}


export function getLocaleOg(locale: string) {
  switch (locale) {
    case "fa":
      return "fa_IR";
    case "ar":
      return "ar_AR";
    case "tr":
      return "tr_TR";
    case "en":
    default:
      return "en_US";
  }
}