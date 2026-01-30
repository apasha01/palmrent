/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Info, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type PriceRow = {
  range?: string;
  base_price?: number | string;
  final_price?: number | string;
};

function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function formatNum(n: number) {
  return new Intl.NumberFormat("fa-IR").format(Math.round(n));
}

type PriceGroupsResponsiveProps = {
  trigger: React.ReactNode;
  prices?: PriceRow[] | null;
  currencyLabel?: string;
  title?: string;
  closeLabel?: string;
  subtitle?: string;
};

function PriceListBody({
  prices,
  currencyLabel,
  subtitle,
}: {
  prices: PriceRow[];
  currencyLabel: string;
  subtitle?: string;
}) {
  const rows = Array.isArray(prices) ? prices.filter(Boolean) : [];

  return (
    <div className="px-4 pb-2 text-right">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 leading-5">
            {subtitle ?? "قیمت‌ها به ازای هر روز محاسبه شده‌اند."}
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      {rows.length === 0 ? (
        <div className="text-sm text-gray-500 text-right py-6">
          گروه قیمتی برای این خودرو موجود نیست.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, idx) => {
            const range = String(r.range ?? "").trim();
            const base = safeNum(r.base_price, 0);
            const final = safeNum(r.final_price, 0);
            const hasDiscount = base > 0 && final > 0 && base !== final;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Right range block */}
                  <div className="text-right">
                    <div className="flex items-center justify-start gap-2">
                      <CalendarDays className="size-4 text-gray-400" />
                      <div className="text-sm font-extrabold text-gray-900">
                        {range || `بازه ${idx + 1}`}
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {hasDiscount
                        ? "قیمت پایه و قیمت بعد از تخفیف"
                        : "قیمت روزانه"}
                    </div>
                  </div>

                  {/* Left price block */}
                  <div className="text-left whitespace-nowrap">
                    <div className="text-sm font-extrabold text-gray-900">
                      {final > 0 ? formatNum(final) : "—"}{" "}
                      <span className="text-xs font-normal text-gray-500">
                        {currencyLabel}
                      </span>
                    </div>

                    {hasDiscount ? (
                      <div className="mt-1 inline-flex items-center gap-2 justify-end">
                        <span className="text-xs text-gray-400 line-through">
                          {formatNum(base)} {currencyLabel}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ✅ همه‌ی حالت‌ها Drawer (بدون Dialog)
 * ✅ RTL Fix: dir="rtl" روی Content
 * ✅ NEW: max-w برای وقتی محتوا کم هست
 */
export function PriceGroupsResponsive({
  trigger,
  prices,
  currencyLabel = "",
  title = "گروه‌های قیمتی",
  closeLabel = "بستن",
  subtitle,
}: PriceGroupsResponsiveProps) {
  const rows = Array.isArray(prices) ? prices.filter(Boolean) : [];

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      {/* ✅ max-w + center */}
      <DrawerContent dir="rtl" className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-right px-4">
            <DrawerTitle className="flex items-center gap-1 text-base">
              <Info className="size-4 text-gray-500" />
              {title}
            </DrawerTitle>
          </DrawerHeader>

          <PriceListBody
            prices={rows}
            currencyLabel={currencyLabel}
            subtitle={subtitle}
          />

          <DrawerFooter className="px-4">
            <DrawerClose asChild>
              <Button variant="outline" className="h-12 rounded-2xl w-full">
                {closeLabel}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
