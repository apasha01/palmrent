"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

type CarDescriptionProps = {
  html?: string | null;
  title?: string | null;
};

export function CarDescription({ html, title }: CarDescriptionProps) {
  const cleanHtml = useMemo(() => {
    const raw = html || "";

    // ✅ HTML رو پاک‌سازی کن (script و چیزای خطرناک حذف میشه)
    const sanitized = DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });

    return sanitized;
  }, [html]);

  if (!cleanHtml || cleanHtml.trim().length === 0) return null;

  return (
    <div className="rounded-xl p-2">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {title || "توضیحات"}
      </h2>

      <div className="border p-4 rounded-lg">
        {/* ✅ استایل‌دهی به HTML خروجی */}
        <div
          className="
            // prose prose-sm max-w-none
            // prose-headings:font-bold prose-headings:text-gray-900
            // prose-p:text-gray-600 prose-p:leading-relaxed
            // prose-strong:text-gray-900
            // prose-a:text-blue-600 hover:prose-a:text-blue-700
            // prose-img:rounded-xl prose-img:shadow
            // prose-ul:text-gray-600 prose-ol:text-gray-600
          "
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      </div>
    </div>
  );
}
