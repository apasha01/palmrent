"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  gap?: number; // فاصله زیر هدر
};

export default function HeaderAwareSticky({ children, className, gap = 10 }: Props) {
  const [top, setTop] = React.useState<number>(gap);

  React.useLayoutEffect(() => {
    const header = document.getElementById("site-fixed-header");

    const calc = () => {
      if (!header) {
        setTop(gap);
        return;
      }

      // چون هدر شما fixed و با transform میره بالا/پایین،
      // rect.bottom دقیقاً مقدار بخش visible هدره
      const rect = header.getBoundingClientRect();
      const visibleBottom = Math.max(0, rect.bottom);

      setTop(Math.round(visibleBottom + gap));
    };

    calc();

    const onScroll = () => requestAnimationFrame(calc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", calc);

    const ro = new ResizeObserver(calc);
    ro.observe(header || document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", calc);
      ro.disconnect();
    };
  }, [gap]);

  return (
    <div className={className} style={{ position: "sticky", top, alignSelf: "start" }}>
      {children}
    </div>
  );
}
