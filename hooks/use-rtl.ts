"use client";

import { useLocale } from "next-intl";

export default function useDIR() {
  const locale = useLocale();
  const languages = ["fa","ar"]

  const isRtl = languages.includes(locale)
  
  const language = isRtl? "rtl" : "ltr";
  const direction = language === 'rtl';

  // console.log(direction, language)
  return {language, direction};
}
