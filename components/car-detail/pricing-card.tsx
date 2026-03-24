/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Info,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { formatJalaliDate } from "@/lib/date-utils";
import { DateRangePickerPopover } from "../custom/calender/date-range-picker";
import { AppDrawer } from "../common/AppDrawer";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SheetClose } from "@/components/ui/sheet";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function yesNoFa(v: any, yesText: string, noText: string) {
  const s = String(v ?? "").toLowerCase();
  const yes = s === "yes" || s === "true" || s === "1";
  const no = s === "no" || s === "false" || s === "0";
  if (yes) return yesText;
  if (no) return noText;
  return "—";
}

function formatMoneyFa(value: any) {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  const num = Number(str);
  if (Number.isFinite(num)) {
    const fixed = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return fixed;
  }
  return str;
}

type PickerRange = NonNullable<
  React.ComponentProps<typeof DateRangePickerPopover>["initialRange"]
>;

function buildDefault(): {
  range: PickerRange;
  deliveryTime: string;
  returnTime: string;
} {
  const tomorrow = addDays(new Date(), 1);
  const end = addDays(new Date(), 6);
  return { range: { start: tomorrow, end }, deliveryTime: "10:00", returnTime: "10:00" };
}

function normalizeWhatsappPhone(phone?: string | null) {
  if (!phone) return "";
  const digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

function diffDays(start?: Date | null, end?: Date | null) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const ms = e.getTime() - s.getTime();
  const d = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, d);
}

export type DailyPriceItem = {
  title: string;
  price: string;
  price_off?: number | null;
};

export type PricingCarMeta = {
  id: number;
  branch_id?: number | null;
  title?: string | null;
  branch?: string | null;
  insurance?: "yes" | "no" | string | null;
  free_delivery?: "yes" | "no" | string | null;
  km?: "yes" | "no" | string | null;
};

export type PricingCardProps = {
  car: PricingCarMeta;
  dailyPrice?: DailyPriceItem[] | null;
  deposit?: string | number | null;
  currency?: string | null;
  offPercent?: number | null;
  whatsapp?: string | null;
};

export function PricingCard({
  car,
  dailyPrice,
  deposit,
  currency,
  offPercent,
  whatsapp,
}: PricingCardProps) {
  const t = useTranslations("pricingCard");
  const tWa = useTranslations("whatsapp");

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { openSheet } = useMobileSheet();

  const defaults = React.useMemo(() => buildDefault(), []);
  const [range, setRange] = React.useState<PickerRange>(defaults.range);
  const [deliveryTime, setDeliveryTime] = React.useState<string>(defaults.deliveryTime);
  const [returnTime, setReturnTime] = React.useState<string>(defaults.returnTime);

  const unit = currency || "درهم";
  const off = Number(offPercent ?? 0);
  const hasOff = Number.isFinite(off) && off > 0;

  const pricingOptions = (dailyPrice || []).filter(Boolean).map((x) => ({
    days: x.title,
    originalPrice: x.price,
    finalPrice: x.price_off ?? x.price,
    hasOffPrice: x.price_off !== null && x.price_off !== undefined,
  }));

  const titleText =
    car?.title && car?.branch
      ? t("title", { car: car.title, branch: car.branch })
      : car?.title
        ? t("titleNoBranch", { car: car.title })
        : t("titleDefault");

  const locationLabel =
    car?.title && car?.branch
      ? t("locationLabel", { car: car.title, branch: car.branch })
      : car?.title
        ? t("locationNoBranch", { car: car.title })
        : t("locationDefault");

  const calendarTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const reserveActionRef = React.useRef<"online" | "whatsapp">("online");

  const waPhone = React.useMemo(() => normalizeWhatsappPhone(whatsapp), [whatsapp]);

  const whatsappLink = React.useMemo(() => {
    if (!waPhone) return "";
    const safeStart = range?.start ?? defaults.range.start;
    const safeEnd = range?.end ?? defaults.range.end;
    const days = diffDays(safeStart ?? null, safeEnd ?? null);
    const branchPart = car?.branch ? tWa("branchPart", { branch: car.branch }) : "";
    const text = tWa("message", {
      car: car?.title || "این خودرو",
      branch: branchPart,
      from: safeStart ? formatJalaliDate(safeStart) : "",
      deliveryTime: deliveryTime || defaults.deliveryTime,
      to: safeEnd ? formatJalaliDate(safeEnd) : "",
      returnTime: returnTime || defaults.returnTime,
      days: String(days),
    });
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  }, [waPhone, car?.title, car?.branch, range?.start, range?.end, deliveryTime, returnTime, defaults, tWa]);

  const setSelectedCarId = useSearchPageStore((s: any) => s.setSelectedCarId);
  const setRoadMapStep = useSearchPageStore((s: any) => s.setRoadMapStep);
  const setBranchId = useSearchPageStore((s: any) => s.setBranchId);
  const setCarDatesStore = useSearchPageStore((s: any) => s.setCarDates);
  const setDeliveryTimeStore = useSearchPageStore((s: any) => s.setDeliveryTime);
  const setReturnTimeStore = useSearchPageStore((s: any) => s.setReturnTime);
  const setIsAnySheetOpen = useSearchPageStore((s: any) => s.setIsAnySheetOpen);

  const hydrateReserveStore = React.useCallback(
    (args: { branchId: number; carId: number; from: string; to: string; dt: string; rt: string }) => {
      setSelectedCarId(args.carId);
      setBranchId(args.branchId);
      setCarDatesStore([args.from, args.to]);
      setDeliveryTimeStore(args.dt);
      setReturnTimeStore(args.rt);
      setRoadMapStep(3);
      if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(true);
    },
    [setSelectedCarId, setBranchId, setCarDatesStore, setDeliveryTimeStore, setReturnTimeStore, setRoadMapStep, setIsAnySheetOpen],
  );

  const hydrateUrl = React.useCallback(
    (args: { branchId: number; carId: number; from: string; to: string; dt: string; rt: string }) => {
      const params = new URLSearchParams();
      params.set("branch_id", String(args.branchId));
      params.set("from", String(args.from));
      params.set("to", String(args.to));
      params.set("dt", String(args.dt));
      params.set("rt", String(args.rt));
      params.set("car_id", String(args.carId));
      params.set("step", "3");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const reserveWith = React.useCallback(
    (args: { start?: Date | null; end?: Date | null; deliveryTime?: string; returnTime?: string }) => {
      const safeStart = args.start ?? defaults.range.start;
      const safeEnd = args.end ?? defaults.range.end;
      const fromFa = safeStart ? formatJalaliDate(safeStart) : "";
      const toFa = safeEnd ? formatJalaliDate(safeEnd) : "";
      const from = fromFa;
      const to = toFa;
      const dt = args.deliveryTime || defaults.deliveryTime;
      const rt = args.returnTime || defaults.returnTime;
      const branchId = Number(car?.branch_id ?? 0);
      const carId = Number(car?.id ?? 0);
      if (!branchId || !carId || !from || !to || !dt || !rt) return;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      if (isMobile) {
        const payload = { branchId, carId, from, to, dt, rt };
        hydrateReserveStore(payload);
        hydrateUrl(payload);
        openSheet({
          title: t("reserveSheetTitle"),
          content: (
            <div>
              <div className="flex items-center bg-white">
                <SheetClose>
                  <ArrowRight className="size-8 px-2" />
                </SheetClose>
                <SearchHeader stepSecond />
              </div>
              <StepRent step={3} />
              <ReserveInformation />
            </div>
          ),
          onClose: () => {
            setRoadMapStep(2);
            if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(false);
          },
        });
        return;
      }

      const params = new URLSearchParams();
      params.set("branch_id", String(branchId));
      params.set("from", from);
      params.set("to", to);
      params.set("dt", dt);
      params.set("rt", rt);
      params.set("car_id", String(carId));
      router.push(`/${locale}/reserve?${params.toString()}`, { scroll: true });
    },
    [defaults, car?.branch_id, car?.id, locale, router, openSheet, hydrateReserveStore, hydrateUrl, setRoadMapStep, setIsAnySheetOpen, t],
  );

  const handleReserve = React.useCallback(() => {
    reserveWith({ start: range?.start, end: range?.end, deliveryTime, returnTime });
  }, [reserveWith, range?.start, range?.end, deliveryTime, returnTime]);

  const deliveryText = React.useMemo(() => {
    const datePart = range.start ? formatJalaliDate(range.start) : "";
    return `${datePart} - ${deliveryTime}`;
  }, [range.start, deliveryTime]);

  const returnText = React.useMemo(() => {
    const datePart = range.end ? formatJalaliDate(range.end) : "";
    return `${datePart} - ${returnTime}`;
  }, [range.end, returnTime]);

  const pricesDrawerData = React.useMemo(() => {
    return { prices: pricingOptions, currency: unit };
  }, [pricingOptions, unit]);

  const TopContent = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-700 font-medium text-base">{titleText}</h2>
        {hasOff && (
          <span className="bg-amber-400 text-white px-4 py-1.5 rounded-full text-sm font-medium">
            {t("discountBadge", { off: String(off) })}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-800">{t("dailyPricesTitle")}</div>
        <AppDrawer
          kind="prices"
          data={pricesDrawerData as any}
          trigger={({ open }) => (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              onClick={(e) => { e.stopPropagation(); open(); }}
              aria-label={t("details")}
            >
              <Info className="w-4 h-4" />
              {t("details")}
            </button>
          )}
        />
      </div>

      <div className="space-y-3 mb-6">
        {pricingOptions.length === 0 ? (
          <div className="text-sm text-gray-500">{t("noPrices")}</div>
        ) : (
          pricingOptions.map((option, index) => (
            <div key={`${option.days}-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 ? <DollarSign className="w-5 h-5 text-gray-400" /> : <div className="w-5" />}
                <span className="text-gray-600 text-sm">{option.days}</span>
              </div>
              <div className="flex items-center gap-3">
                {option.hasOffPrice ? (
                  <span className="text-gray-400 line-through text-sm">{formatMoneyFa(option.originalPrice)}</span>
                ) : (
                  <span className="text-gray-400 text-sm"> </span>
                )}
                <span className="text-gray-700 font-medium">
                  {formatMoneyFa(option.finalPrice)} {unit}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 my-4" />

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{t("deposit")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700">{formatMoneyFa(deposit)} {unit}</span>
            <AppDrawer
              kind="deposit"
              data={{ deposit, currency: unit } as any}
              trigger={({ open }) => (
                <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="text-gray-400 hover:text-gray-600" aria-label={t("deposit")}>
                  <Info className="w-4 h-4" />
                </button>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{t("deliveryCost")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">
              {yesNoFa(car?.free_delivery, t("freeDelivery"), t("paidDelivery"))}
            </span>
            <AppDrawer
              kind="delivery"
              data={{ free_delivery: car?.free_delivery } as any}
              trigger={({ open }) => (
                <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="text-gray-400 hover:text-gray-600" aria-label={t("deliveryCost")}>
                  <Info className="w-4 h-4" />
                </button>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{t("insuranceCar")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">
              {yesNoFa(car?.insurance, t("freeInsurance"), t("noInsurance"))}
            </span>
            <AppDrawer
              kind="insurance"
              data={{ insurance: car?.insurance } as any}
              trigger={({ open }) => (
                <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="text-gray-400 hover:text-gray-600" aria-label={t("insuranceCar")}>
                  <Info className="w-4 h-4" />
                </button>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{t("km")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">
              {yesNoFa(car?.km, t("unlimitedKm"), t("limitedKm"))}
            </span>
            <AppDrawer
              kind="km"
              data={{ km: car?.km } as any}
              trigger={({ open }) => (
                <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="text-gray-400 hover:text-gray-600" aria-label={t("km")}>
                  <Info className="w-4 h-4" />
                </button>
              )}
            />
          </div>
        </div>
      </div>

      {/* Mobile bottom */}
      <div className="mt-4 border-t md:hidden">
        <div className="pt-4 flex gap-2">
          <button
            type="button"
            className="flex items-center text-sm text-blue-500"
            onClick={() => {
              reserveActionRef.current = "online";
              calendarTriggerRef.current?.click();
            }}
          >
            <p>{t("onlineReserve")}</p>
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="flex items-center text-sm text-green-600"
            onClick={() => {
              if (!whatsappLink) return;
              window.open(whatsappLink, "_blank", "noopener,noreferrer");
            }}
          >
            <p>{t("whatsappReserve")}</p>
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const ReserveContent = (
    <div className="p-2">
      <h3 className="text-md font-medium mb-2 md:mb-0">{t("reserveTitle")}</h3>

      <div id="reserve-card" className="p-4 border md:border-none rounded-lg">
        <div className="text-xs text-gray-400 mb-1">{t("rentOnlineLabel")}</div>

        <div className="border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600 text-sm">{locationLabel}</span>
        </div>

        <DateRangePickerPopover
          initialRange={range}
          defaultIsJalali={true}
          initialTimes={{ deliveryTime, returnTime }}
          onConfirm={(v) => {
            setRange({ start: v.start, end: v.end });
            setDeliveryTime(v.deliveryTime);
            setReturnTime(v.returnTime);
            if (reserveActionRef.current === "online") {
              reserveWith({ start: v.start, end: v.end, deliveryTime: v.deliveryTime, returnTime: v.returnTime });
            }
          }}
          onClear={() => {
            const d = buildDefault();
            setRange(d.range);
            setDeliveryTime(d.deliveryTime);
            setReturnTime(d.returnTime);
            reserveActionRef.current = "online";
          }}
          trigger={
            <button
              ref={calendarTriggerRef}
              type="button"
              className="flex w-full mb-4 cursor-pointer text-left"
              onClick={() => { reserveActionRef.current = "online"; }}
            >
              <div className="flex w-full">
                <div className="flex-1">
                  <div className="text-xs text-right text-gray-400 mb-1">{t("deliveryDateLabel")}</div>
                  <div className="border border-gray-200 rounded-r-lg p-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 text-sm">{deliveryText}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-right text-gray-400 mb-1">{t("returnDateLabel")}</div>
                  <div className="border border-gray-200 rounded-l-lg gap-2 p-2 flex items-center">
                    <span className="text-gray-600 text-sm">{returnText}</span>
                  </div>
                </div>
              </div>
            </button>
          }
        />

        <button
          type="button"
          onClick={handleReserve}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 text-base font-medium rounded-md transition-colors"
        >
          {t("reserveButton")}
        </button>

        {(!car?.branch_id || !car?.id) && (
          <div className="mt-2 text-xs text-red-500">{t("missingIds")}</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden space-y-3">
        <div className="rounded-xl border overflow-hidden">{TopContent}</div>
        <div className="rounded-xl overflow-hidden">{ReserveContent}</div>
      </div>

      <div className="hidden md:block">
        <div className="rounded-xl border max-w-md mx-auto overflow-hidden">
          {TopContent}
          <div className="border-t border-gray-200" />
          {ReserveContent}
        </div>
      </div>
    </>
  );
}