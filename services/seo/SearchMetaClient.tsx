"use client";

import { useLayoutEffect, useRef } from "react";

function upsertMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertOG(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

type Props = {
  title: string;
  description?: string;
};

/**
 * ✅ هدف:
 * - جلوگیری از “فلیکر” title/meta موقع router.replace و sync شدن URL
 * - ست شدن قبل از paint (useLayoutEffect) تا PalmRent لحظه‌ای دیده نشه
 * - جلوگیری از overwrite با مقدار قبلی/دیفالت وقتی navigation داخلی می‌خوره
 */
export default function SearchMetaClient({ title, description }: Props) {
  const lastTitleRef = useRef<string>("");

  useLayoutEffect(() => {
    // title ممکنه یه لحظه خالی بشه؛ ما اجازه نمی‌دیم دیفالت بیاد
    const nextTitle = (title || "").trim();
    if (!nextTitle) return;

    // اگر همون تایتله دوباره نزن
    if (lastTitleRef.current === nextTitle && document.title === nextTitle) {
      return;
    }

    lastTitleRef.current = nextTitle;

    // ✅ ست قبل از paint
    document.title = nextTitle;
    upsertOG("og:title", nextTitle);

    if (description && String(description).trim()) {
      const d = String(description).trim();
      upsertMeta("description", d);
      upsertOG("og:description", d);
    }
  }, [title, description]);

  return null;
}