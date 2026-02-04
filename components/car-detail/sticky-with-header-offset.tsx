"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  gap?: number;
};

export default function StickyWithHeaderOffset({
  children,
  className,
  gap = 8,
}: Props) {
  const [top, setTop] = React.useState(gap);

  React.useLayoutEffect(() => {
    const header = document.getElementById("site-fixed-header");

    const calc = () => {
      if (!header) return setTop(gap);

      const rect = header.getBoundingClientRect();
      // مقدار قسمت قابل مشاهده‌ی هدر
      const visible = Math.max(0, rect.bottom);
      setTop(Math.round(visible + gap));
    };

    calc();

    const onScroll = () => requestAnimationFrame(calc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", calc);

    let ro: ResizeObserver | null = null;
    if (header) {
      ro = new ResizeObserver(calc);
      ro.observe(header);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", calc);
      ro?.disconnect();
    };
  }, [gap]);

  return (
    <div
      className={className}
      style={{
        position: "sticky",
        top,
        alignSelf: "start",
      }}
    >
      {children}
    </div>
  );
}
