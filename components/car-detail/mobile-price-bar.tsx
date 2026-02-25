/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Info, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatJalaliDate } from "@/lib/date-utils";
import { AppDrawer } from "../common/AppDrawer";
import { DateRangePickerPopover } from "../custom/calender/date-range-picker";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SheetClose } from "@/components/ui/sheet";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";

// ---------------- Utils ----------------
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toFaDigits(input: string) {
  const map: Record<string, string> = {
    "0": "۰",
    "1": "۱",
    "2": "۲",
    "3": "۳",
    "4": "۴",
    "5": "۵",
    "6": "۶",
    "7": "۷",
    "8": "۸",
    "9": "۹",
    ".": "٫",
    ",": "٬",
  };
  return String(input)
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
}

function toEnDigits(input: string) {
  if (!input) return "";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(input);

  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(fa[i], String(i)).replaceAll(ar[i], String(i));
  }

  s = s.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
  return s;
}

function formatMoneyFa(value: unknown) {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  const num = Number(toEnDigits(str));
  if (Number.isFinite(num)) {
    const fixed = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return toFaDigits(fixed);
  }
  return toFaDigits(str);
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
  return {
    range: { start: tomorrow, end },
    deliveryTime: "10:00",
    returnTime: "10:00",
  };
}

// ---------------- Types ----------------
export type DailyPriceItem = {
  title: string;
  price: string;
  price_off?: number | null;
};

export type PricingCarMeta = {
  id: number;
  branch_id?: number | null;
};

export type MobilePriceBarProps = {
  car: PricingCarMeta;
  dailyPrice?: DailyPriceItem[] | null;
  currency?: string | null;
  offPercent?: number | null;
};

export function MobilePriceBar({ car, dailyPrice, currency }: MobilePriceBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { openSheet } = useMobileSheet();

  const defaults = React.useMemo(() => buildDefault(), []);
  const unit = currency || "درهم";

  // ✅ Zustand setters (مثل سرچ/رزرو)
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
    [
      setSelectedCarId,
      setBranchId,
      setCarDatesStore,
      setDeliveryTimeStore,
      setReturnTimeStore,
      setRoadMapStep,
      setIsAnySheetOpen,
    ],
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

      // ✅ روی همین صفحه‌ی جزئیات ماشین پارامتر می‌نشونه (بدون رفتن به سرچ)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  // ✅ قیمت‌ها برای AppDrawer
  const pricingOptions = React.useMemo(() => {
    return (dailyPrice || []).filter(Boolean).map((x) => ({
      days: x.title,
      originalPrice: x.price,
      finalPrice: x.price_off ?? x.price,
      hasOffPrice: x.price_off !== null && x.price_off !== undefined,
    }));
  }, [dailyPrice]);

  const firstPrice = (dailyPrice || [])[0];
  const displayPrice = firstPrice?.price_off ?? firstPrice?.price ?? "—";
  const originalPrice = firstPrice?.price;
  const hasOffPrice = firstPrice?.price_off !== null && firstPrice?.price_off !== undefined;

  /**
   * ✅ رزرو:
   * - موبایل: شیت + store + url
   * - دسکتاپ: برو /reserve
   */
  const reserveWith = React.useCallback(
    (v: { start?: Date | null; end?: Date | null; deliveryTime: string; returnTime: string }) => {
      const safeStart = v.start ?? defaults.range.start;
      const safeEnd = v.end ?? defaults.range.end;

      const fromFa = safeStart ? formatJalaliDate(safeStart) : "";
      const toFa = safeEnd ? formatJalaliDate(safeEnd) : "";

      const from = toEnDigits(fromFa);
      const to = toEnDigits(toFa);

      const dt = toEnDigits(v.deliveryTime || defaults.deliveryTime);
      const rt = toEnDigits(v.returnTime || defaults.returnTime);

      const branchId = Number(car?.branch_id ?? 0);
      const carId = Number(car?.id ?? 0);

      if (!branchId || !carId || !from || !to || !dt || !rt) return;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      if (isMobile) {
        const payload = { branchId, carId, from, to, dt, rt };

        hydrateReserveStore(payload);
        hydrateUrl(payload);

        openSheet({
          title: "رزرو",
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

      // ✅ دسکتاپ
      const params = new URLSearchParams();
      params.set("branch_id", String(branchId));
      params.set("from", from);
      params.set("to", to);
      params.set("dt", dt);
      params.set("rt", rt);
      params.set("car_id", String(carId));

      router.push(`/reserve?${params.toString()}`, { scroll: true });
    },
    [
      defaults,
      car?.branch_id,
      car?.id,
      router,
      locale,
      openSheet,
      hydrateReserveStore,
      hydrateUrl,
      setRoadMapStep,
      setIsAnySheetOpen,
    ],
  );

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* قیمت + info */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">شروع قیمت از</span>

          <div className="flex items-center gap-2">
            {hasOffPrice && originalPrice && (
              <span className="text-gray-400 line-through text-sm">{formatMoneyFa(originalPrice)}</span>
            )}

            <span className="text-blue-500 font-bold text-xl">{formatMoneyFa(displayPrice)}</span>
            <span className="text-gray-600 text-sm">{unit}</span>

            <AppDrawer
              kind="prices"
              data={{ prices: pricingOptions, currency: unit }}
              trigger={({ open }) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="inline-flex"
                  aria-label="گروه‌های قیمتی"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
              )}
            />
          </div>
        </div>

        {/* ✅ رزرو آنلاین => تقویم باز میشه => تایید => رزرو (شیت/رزرو) */}
        <DateRangePickerPopover
          initialRange={defaults.range}
          defaultIsJalali={true}
          initialTimes={{
            deliveryTime: defaults.deliveryTime,
            returnTime: defaults.returnTime,
          }}
          onConfirm={(v) => {
            reserveWith(v as any);
          }}
          trigger={
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-base font-medium rounded-xl transition-colors"
            >
              رزرو آنلاین
            </button>
          }
        />
      </div>

      {(!car?.branch_id || !car?.id) && (
        <div className="mt-2 text-xs text-red-500">
          branch_id یا car_id موجود نیست (برای رزرو باید در car پاس داده شود).
        </div>
      )}
    </div>
  );
}