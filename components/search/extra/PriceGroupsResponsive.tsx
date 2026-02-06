/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AppDrawer } from "@/components/common/AppDrawer";
import * as React from "react";

type PriceRow = {
  range?: string;
  base_price?: number | string;
  final_price?: number | string;
};

function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export type PriceGroupsResponsiveProps = {
  trigger: React.ReactNode;
  prices?: PriceRow[] | null;
  currencyLabel?: string;
  subtitle?: string;
};

export function PriceGroupsResponsive({
  trigger,
  prices,
  currencyLabel = "",
  subtitle,
}: PriceGroupsResponsiveProps) {
  const rows = React.useMemo(() => {
    const list = Array.isArray(prices) ? prices.filter(Boolean) : [];
    return list.map((r) => {
      const days = String(r?.range ?? "").trim() || "—";
      const base = safeNum(r?.base_price, 0);
      const final = safeNum(r?.final_price, 0);
      const hasOffPrice = base > 0 && final > 0 && base !== final;

      return {
        days,
        originalPrice: base,
        finalPrice: final,
        hasOffPrice,
      };
    });
  }, [prices]);

  return (
    <AppDrawer
      kind="prices"
      data={{
        prices: rows,
        currency: currencyLabel,
        pricesSubtitle: subtitle,
      }}
      trigger={({ open }) => (
        <span
          className="contents"
          role="button"
          tabIndex={0}
          aria-label="نمایش گروه‌های قیمتی"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              open();
            }
          }}
        >
          {trigger}
        </span>
      )}
    />
  );
}
