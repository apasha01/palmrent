"use client";

import React, { useId, useMemo, useState } from "react";
import { Button } from "../ui/button";

type Props = {
  title?: string;
  html?: string;
  collapsedLines?: number;
};

export default function DescriptionLanding({
  title,
  html = "",
  collapsedLines = 6,
}: Props) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const collapsedMaxHeight = useMemo(() => {
    const lineHeightRem = 1.75;
    const extraRem = 0.5;
    return `${collapsedLines * lineHeightRem + extraRem}rem`;
  }, [collapsedLines]);

  if (!html?.trim()) {
    return null;
  }

  return (
    <div className="w-full bg-transparent px-4 md:px-2 lg:px-0">
      {title ? <p className="mb-2 text-right font-bold">{title}</p> : null}

      <div
        id={contentId}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "5000px" : collapsedMaxHeight }}
      >
        <div
          className="prose prose-sm max-w-none text-right dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <Button
        variant="link"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="mt-2 h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {open ? "مشاهده کمتر" : "مشاهده بیشتر"}
      </Button>
    </div>
  );
}