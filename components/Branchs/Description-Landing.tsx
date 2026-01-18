"use client";

import React, { useId, useMemo, useState } from "react";
import { Button } from "../ui/button";

export default function DescriptionLanding({
  title = "پالم رنت بزرگترین سامانه اجاره خودرو",
  text = `این یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود. یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود. یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود. یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود. یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود.یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود.یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود.یک متن نمونه است. شما می‌توانید این متن را با متن واقعی خودتان جایگزین کنید.
این کامپوننت ابتدا فقط چند خط را نمایش می‌دهد و با کلیک روی مشاهده بیشتر،
به صورت نرم باز می‌شود و دوباره هم می‌تواند بسته شود.`,
  collapsedLines = 3,
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const collapsedMaxHeight = useMemo(() => {
    const lineHeightRem = 1.75; // leading-7
    const extraRem = 0.25;
    return `${collapsedLines * lineHeightRem + extraRem}rem`;
  }, [collapsedLines]);

  return (
    <div className="w-full bg-transparent px-4 md:px-2 lg:px-0" >
      {title ? <p className="font-bold mb-2 text-right">{title}</p> : null}

      <div
        id={contentId}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "1000px" : collapsedMaxHeight }}
      >
        <p className="text-sm leading-7 text-foreground text-right">
          {text}
        </p>
      </div>

      <Button
        variant="link"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="mt-2 p-0 h-auto text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {open ? "مشاهده کمتر" : "مشاهده بیشتر"}
      </Button>
    </div>
  );
}
