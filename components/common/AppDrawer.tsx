/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ===========================
// ✅ SINGLE SOURCE OF TRUTH: Styles
// ===========================
const UI = {
  content: "max-h-[85vh]",
  wrap: "mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-3xl",
  header: "px-5 pt-4 pb-2",
  title: "truncate text-base font-extrabold text-gray-900",
  iconWrap:
    "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600",
  body: "px-5 pb-4",
  bodyText: "whitespace-pre-line text-sm leading-7 text-gray-700",
  hint: "text-xs text-gray-500 leading-6",

  priceCard: "rounded-2xl border border-gray-200 bg-white p-3 shadow-sm",
  priceTitle: "text-sm font-extrabold text-gray-900",
  priceSub: "mt-1 text-xs text-gray-500",
  priceFinal: "text-sm font-extrabold text-gray-900",
  priceUnit: "text-xs font-normal text-gray-500",
  priceOld: "mt-1 text-xs text-gray-400 line-through",
} as const;

// ===========================
// types
// ===========================
type PriceRow = {
  days: string;
  originalPrice: any;
  finalPrice: any;
  hasOffPrice: boolean;
};

export type AppDrawerKind =
  | "prices"
  | "deposit"
  | "no_deposit"
  | "delivery"
  | "insurance"
  | "km"
  | "extra_option"
  | "insurance_complete";

export type AppDrawerData = {
  prices?: PriceRow[];
  currency?: string;
  pricesSubtitle?: string;

  deposit?: any;

  free_delivery?: any;
  insurance?: any;
  km?: any;

  optionId?: number;
  optionTitle?: string;
  optionDescriptionFromApi?: string;
};

// ===========================
// utils
// ===========================
function isYes(v: any) {
  const s = String(v ?? "").toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function formatNumberByLocale(value: number, locale: string) {
  if (locale === "fa") return value.toLocaleString("fa-IR");
  if (locale === "ar") return value.toLocaleString("ar-IQ");
  if (locale === "tr") return value.toLocaleString("tr-TR");
  return value.toLocaleString("en-US");
}

function moneyText(value: any, locale: string) {
  if (value === null || value === undefined) return "—";

  const str = String(value);
  const num = Number(str);

  if (Number.isFinite(num)) {
    if (Number.isInteger(num)) return formatNumberByLocale(num, locale);
    return String(num);
  }

  return str;
}

export function AppDrawer({
  kind,
  data,
  trigger,
  onOpenChange,
}: {
  kind: AppDrawerKind;
  data?: AppDrawerData;
  trigger: (args: { open: () => void }) => React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations("AppDrawer");
  const locale = useLocale();
  const isRtl = locale === "fa" || locale === "ar";

  const [open, setOpen] = React.useState(false);

  const [stickyKind, setStickyKind] = React.useState<AppDrawerKind>(kind);
  const [stickyData, setStickyData] = React.useState<AppDrawerData | undefined>(
    data
  );
  const closeTimerRef = React.useRef<any>(null);

  const openNow = React.useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setStickyKind(kind);
    setStickyData(data);
    setOpen(true);
    onOpenChange?.(true);
  }, [kind, data, onOpenChange]);

  const title = React.useMemo(() => {
    const d = stickyData;

    switch (stickyKind) {
      case "prices":
        return t("prices.title");

      case "deposit":
        return t("deposit.title");

      case "no_deposit":
        return t("noDeposit.title");

      case "delivery":
        return t("delivery.title");

      case "insurance":
        return t("insurance.title");

      case "km":
        return t("km.title");

      case "insurance_complete":
        return t("insuranceComplete.title");

      case "extra_option":
        return d?.optionTitle || t("extraOption.titleFallback");
    }
  }, [stickyKind, stickyData, t]);

  const Body = React.useMemo(() => {
    const d = stickyData || {};

    if (stickyKind === "prices") {
      const list = Array.isArray(d.prices) ? d.prices : [];
      const currency = d.currency || "";

      return (
        <div className={UI.body + (isRtl ? " text-right" : " text-left")}>
          <div className={UI.hint}>
            {d.pricesSubtitle || t("prices.desc")}
          </div>

          <Separator className="my-3" />

          {list.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">{t("prices.empty")}</div>
          ) : (
            <div className="space-y-2">
              {list.map((p, idx) => (
                <div key={`${p.days}-${idx}`} className={UI.priceCard}>
                  <div className="flex items-start justify-between gap-3">
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <div className={UI.priceTitle}>{p.days}</div>
                      <div className={UI.priceSub}>
                        {p.hasOffPrice
                          ? t("prices.subOff")
                          : t("prices.subNormal")}
                      </div>
                    </div>

                    <div className="whitespace-nowrap text-left">
                      <div className={UI.priceFinal}>
                        {moneyText(p.finalPrice, locale)}{" "}
                        <span className={UI.priceUnit}>{currency}</span>
                      </div>

                      {p.hasOffPrice ? (
                        <div className={UI.priceOld}>
                          {moneyText(p.originalPrice, locale)} {currency}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (stickyKind === "deposit") {
      const currency = d.currency || "";
      const txt = t("deposit.desc", {
        amountText: moneyText(d.deposit, locale),
        currency,
      });

      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "no_deposit") {
      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>
            {t("noDeposit.desc")}
          </p>
        </div>
      );
    }

    if (stickyKind === "delivery") {
      const txt = isYes(d.free_delivery)
        ? t("delivery.freeDesc")
        : t("delivery.paidDesc");

      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "insurance") {
      const txt = isYes(d.insurance)
        ? t("insurance.hasDesc")
        : t("insurance.noDesc");

      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "km") {
      const txt = isYes(d.km)
        ? t("km.unlimitedDesc")
        : t("km.limitedDesc");

      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{txt}</p>
        </div>
      );
    }

    if (stickyKind === "insurance_complete") {
      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>
            {t("insuranceComplete.desc")}
          </p>
        </div>
      );
    }

    const apiDesc = String(d.optionDescriptionFromApi ?? "").trim();
    if (apiDesc) {
      return (
        <div className={UI.body}>
          <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{apiDesc}</p>
        </div>
      );
    }

    const id = Number(d.optionId);

    const optionText =
      id === 2
        ? t("optionById.2")
        : id === 10
          ? t("optionById.10")
          : t("extraOption.descFallback");

    return (
      <div className={UI.body}>
        <p className={cn(UI.bodyText, isRtl ? "text-right" : "text-left")}>{optionText}</p>
      </div>
    );
  }, [stickyKind, stickyData, t, locale, isRtl]);

  return (
    <>
      {trigger({ open: openNow })}

      <Drawer
        open={open}
        onOpenChange={(v) => {
          onOpenChange?.(Boolean(v));

          if (v) {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setStickyKind(kind);
            setStickyData(data);
            setOpen(true);
            return;
          }

          setOpen(false);

          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
          }, 250);
        }}
      >
        <DrawerContent dir={isRtl ? "rtl" : "ltr"} className={UI.content}>
          <div className={UI.wrap}>
            <DrawerHeader className={UI.header}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={UI.iconWrap}>
                  <Sparkles className="h-5 w-5" />
                </span>
                <DrawerTitle
                  className={cn(
                    UI.title,
                    isRtl ? "text-right" : "text-left"
                  )}
                >
                  {title}
                </DrawerTitle>
              </div>
            </DrawerHeader>

            {Body}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}