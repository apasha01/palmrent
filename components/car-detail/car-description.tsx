"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

type CarDescriptionProps = {
  html?: string | null;

};

export function CarDescription({ html }: CarDescriptionProps) {
  const cleanHtml = useMemo(() => {
    const raw = html || "";

    const sanitized = DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });

    return sanitized;
  }, [html]);

  if (!cleanHtml || cleanHtml.trim().length === 0) return null;

  return (
    <div className="rounded-xl ">


      <div className="border p-4 rounded-lg">
        <div
     
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      </div>
    </div>
  );
}
