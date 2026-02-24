/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { ArrowUpRight, ChevronLeft, Heart, ArrowRight } from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  IconBag,
  IconDiscount,
  IconGas,
  IconGearBox,
  IconInfoCircle,
  IconPerson,
  IconWhatsapp,
} from "../Icons";

import { capitalizeWords, toFaDigits as toFaDigitsHelper } from "@/helpers/helper";
import { STORAGE_URL } from "@/lib/apiClient";
import { adaptCarData } from "@/lib/adapters";
import { normalizeTime } from "@/lib/rent-days";
import { formatJalaliDate } from "@/lib/date-utils";

import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SheetClose } from "@/components/ui/sheet";

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { useRouter } from "next/navigation";

/* ---------------- helpers ---------------- */

const toStorageUrl = (p: unknown) => {
  if (!p) return "";
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) return p;
  return `${STORAGE_URL}${String(p)}`;
};

const normalizeImages = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return (input as unknown[]).filter(Boolean).map(String);
  if (typeof input === "string") return input ? [input] : [];
  return [];
};

const uniqStrings = (arr: string[]) => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const s = String(x || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
};

function normalizePriceList(list: any) {
  if (!list) return [];
  if (Array.isArray(list)) return list;
  return Object.entries(list).map(([key, value]: any) => ({
    range: key,
    ...(value as any),
  }));
}

type PickerRange = NonNullable<React.ComponentProps<typeof DateRangePickerPopover>["initialRange"]>;
const EMPTY_RANGE: PickerRange = { start: null, end: null };

function toEnDigits(input: string) {
  if (!input) return "";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(input);
  for (let i = 0; i < 10; i++) s = s.replaceAll(fa[i], String(i)).replaceAll(ar[i], String(i));
  s = s.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
  return s;
}

/** ✅ استخراج امن carId */
function getCarIdSafe(car: any, data: any): number {
  const v = car?.id ?? car?.car_id ?? data?.id ?? data?.car_id ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ---------------- main component ---------------- */

export default function BranchCarCard({
  data,
  noBtn = false,
  currency = "",
  rateToRial,
  branchId,
  forceWhatsappNoDate = false,

  // ✅✅ NEW (from HomePage)
  sharedCalendar,
  onSharedCalendarChange,
  calendarHydrated = true,
}: {
  data: any;
  noBtn?: boolean;
  currency?: string;
  rateToRial?: number | null;
  branchId?: number | null;
  forceWhatsappNoDate?: boolean;

  sharedCalendar: {
    range: PickerRange;
    deliveryTime: string;
    returnTime: string;
  };
  onSharedCalendarChange: (v: {
    range: PickerRange;
    deliveryTime: string;
    returnTime: string;
  }) => void;

  /** اگر HomePage هنوز session رو hydrate نکرده، می‌تونی کارت رو null کنی */
  calendarHydrated?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const { openSheet } = useMobileSheet();
  const optionList = useSelector((state: any) => state.carList.optionList);

  // ✅ فقط برای نمایش قیمت/واتساپ از store می‌خونیم
  const carDates = useSearchPageStore((s) => s.carDates);
  const deliveryTimeStore = useSearchPageStore((s) => s.deliveryTime);
  const returnTimeStore = useSearchPageStore((s) => s.returnTime);

  const [isHovering, setIsHovering] = useState(false);

  const car = useMemo(() => {
    const alreadyCardModel =
      data &&
      typeof data === "object" &&
      (Array.isArray((data as any).images) ||
        (data as any).priceList ||
        Array.isArray((data as any).photo) ||
        Array.isArray((data as any).prices));
    return alreadyCardModel ? data : adaptCarData(data);
  }, [data]);

  const carHref = useMemo(() => {
    const carId = Number((car as any)?.id);
    if (!Number.isFinite(carId) || carId <= 0) return `/${locale}/cars`;
    return `/${locale}/cars/${carId}`;
  }, [car, locale]);

  const images = useMemo(() => {
    const arr = normalizeImages((car as any)?.images || (car as any)?.photo);
    return uniqStrings(arr);
  }, [car]);

  // ==========================================
  // ✅ Shared Calendar (from HomePage)
  // ==========================================
  const range = sharedCalendar?.range ?? EMPTY_RANGE;
  const deliveryTime = String(sharedCalendar?.deliveryTime || "10:00");
  const returnTime = String(sharedCalendar?.returnTime || "10:00");
  const hasSavedLocal = Boolean(range?.start && range?.end);

  const persistSharedSelection = useCallback(
    (v: { start: Date; end: Date; deliveryTime: string; returnTime: string }) => {
      onSharedCalendarChange({
        range: { start: v.start, end: v.end },
        deliveryTime: v.deliveryTime,
        returnTime: v.returnTime,
      });
    },
    [onSharedCalendarChange],
  );

  const clearSharedSelection = useCallback(() => {
    onSharedCalendarChange({
      range: EMPTY_RANGE,
      deliveryTime: "10:00",
      returnTime: "10:00",
    });
  }, [onSharedCalendarChange]);

  // ===============================
  // ✅ Zustand setters
  // ===============================
  const setSelectedCarId = useSearchPageStore((s: any) => s.setSelectedCarId);
  const setRoadMapStep = useSearchPageStore((s: any) => s.setRoadMapStep);
  const setBranchIdStore = useSearchPageStore((s: any) => s.setBranchId);

  const setCarDatesStore = useSearchPageStore((s: any) => s.setCarDates);
  const setDeliveryTimeStore2 = useSearchPageStore((s: any) => s.setDeliveryTime);
  const setReturnTimeStore2 = useSearchPageStore((s: any) => s.setReturnTime);

  const setIsAnySheetOpen = useSearchPageStore((s: any) => s.setIsAnySheetOpen);

  const hydrateReserveStore = useCallback(
    (args: { branchId: number; carId: number; from: string; to: string; dt: string; rt: string }) => {
      setSelectedCarId(args.carId);
      setBranchIdStore(args.branchId);
      setCarDatesStore([args.from, args.to]);
      setDeliveryTimeStore2(args.dt);
      setReturnTimeStore2(args.rt);

      setRoadMapStep(3);
      if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(true);
    },
    [
      setSelectedCarId,
      setBranchIdStore,
      setCarDatesStore,
      setDeliveryTimeStore2,
      setReturnTimeStore2,
      setRoadMapStep,
      setIsAnySheetOpen,
    ],
  );

  const buildReserveSearchParams = useCallback((payload: any) => {
    const params = new URLSearchParams();
    params.set("branch_id", String(payload.branchId));
    params.set("car_id", String(payload.carId));
    params.set("from", String(payload.from));
    params.set("to", String(payload.to));
    params.set("dt", String(payload.dt));
    params.set("rt", String(payload.rt));
    params.set("step", "3");
    return params;
  }, []);

  /** ✅ موبایل فقط شیت — hydrateKey باعث remount کامل ReserveInformation میشه */
  const openReserveSheetMobile = useCallback(
    (hydrateKey: string) => {
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
            {/* ✅ key = hydrateKey => هر بار تاریخ/ماشین عوض شد کامپوننت remount میشه */}
            <ReserveInformation key={hydrateKey} />
          </div>
        ),
        onClose: () => {
          setRoadMapStep(2);
          if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(false);
        },
      });
    },
    [openSheet, setRoadMapStep, setIsAnySheetOpen],
  );

  const goReserve = useCallback(
    (args: { start?: Date | null; end?: Date | null; dt?: string | null; rt?: string | null }) => {
      const carId = getCarIdSafe(car, data);

      // ✅ branchId فقط از props
      const bId = Number(branchId || 0);
      const safeBranchId = Number.isFinite(bId) && bId > 0 ? bId : 0;

      if (!carId || !safeBranchId) return;

      // ✅ از shared range/time استفاده می‌کنیم
      const safeStart = args.start ?? range?.start ?? null;
      const safeEnd = args.end ?? range?.end ?? null;
      if (!safeStart || !safeEnd) return;

      const fromFa = formatJalaliDate(safeStart);
      const toFa = formatJalaliDate(safeEnd);

      const from = toEnDigits(fromFa);
      const to = toEnDigits(toFa);

      const dt = toEnDigits(normalizeTime(args.dt ?? deliveryTime) || "10:00");
      const rt = toEnDigits(normalizeTime(args.rt ?? returnTime) || "10:00");

      if (!from || !to || !dt || !rt) return;

      const payload = { branchId: safeBranchId, carId, from, to, dt, rt };

      // ✅ کلید یکتا برای این رزرو — باعث remount ReserveInformation میشه
      const hydrateKey = [safeBranchId, carId, from, to, dt, rt].join("|");

      // 1) store
      hydrateReserveStore(payload);

      // 2) URL sync همین صفحه
      const params = buildReserveSearchParams(payload);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // 3) mobile فقط شیت / desktop => /reserve
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        openReserveSheetMobile(hydrateKey);
        return;
      }

      router.push(`/${locale}/reserve?${params.toString()}`, { scroll: true });
    },
    [
      car,
      data,
      branchId,
      range?.start,
      range?.end,
      deliveryTime,
      returnTime,
      hydrateReserveStore,
      buildReserveSearchParams,
      router,
      pathname,
      locale,
      openReserveSheetMobile,
    ],
  );

  if (!car) return null;

  // اگر دوست داری قبل hydrate شدن سشن، کارت چیزی نشون نده:
  if (!calendarHydrated) return null;

  return (
    <Card
      className={`
        flex w-full flex-col transition-all duration-300
        rounded-2xl md:text-sm text-xs border border-[#0000001f]
        shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] hover:shadow-lg
        bg-white dark:bg-gray-900 dark:border-gray-700
        ${isHovering ? "z-30 relative" : ""}
        xs:p-0 max-sm:p-2 md:p-2 h-full justify-between
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardContent className="p-0 px-1 m-0">
        <SingleCarGallery imageList={images} noBtn={noBtn} carHref={carHref}>
          <div className="absolute top-2 rtl:right-2 ltr:left-2 z-40 w-full flex flex-wrap gap-2 max-[380px]:gap-1 text-nowrap pointer-events-none">
            {(((car as any).rawOptions || (car as any).options || []) as any[]).map((item: any, index: number) => {
              if (!optionList?.[item]) return null;
              const isNoDeposit = optionList[item].title === "noDeposite";

              return (
                <div
                  key={index}
                  className={`sm:py-1 py-2 sm:px-2 px-3 max-[405px]:px-2 text-[9px] font-bold rounded-4xl border border-white ${
                    isNoDeposit ? "bg-[#eafaee] border-[#eafaee]" : "bg-[#e2e6e9]"
                  }`}
                >
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isNoDeposit ? "text-[#1e7b33]" : "text-[#4b5259]"
                    }`}
                  >
                    {t(optionList[item].title)}
                    {isNoDeposit && (
                      <span className="inline-flex">
                        <IconInfoCircle />
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {Number((car as any).discountPercent || (car as any).discount || 0) > 0 && (
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none bg-[#e1ff00] py-1.5 px-2.5 text-[#3b3d40] opacity-85 rounded-lg flex items-center gap-1">
              <IconDiscount size="20" />
              {(car as any).discountPercent || (car as any).discount}% {t("discount")}
            </div>
          )}
        </SingleCarGallery>

        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mt-1.5 mb-2">
            <span
              className="size-5 text-[#888] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
            >
              <Heart className="size-5" />
            </span>

            <h3 className="text-lg">
              {locale === "fa"
                ? toFaDigitsHelper(capitalizeWords((car as any).title))
                : capitalizeWords((car as any).title)}
            </h3>
          </div>

          <SingleCarOptions car={car} />

          <SingleCarPriceList
            priceList={(car as any).priceList || (car as any).dailyPrices || (car as any).prices}
            defaultPrice={(car as any).price ?? (car as any).min_price_f ?? 0}
            oldPrice={(car as any).oldPrice ?? 0}
            carDates={carDates}
            deliveryTime={deliveryTimeStore}
            returnTime={returnTimeStore}
            currency={currency || ""}
            rateToRial={rateToRial}
          />

          {!noBtn && (
            <div
              className="flex w-full gap-2 mt-1"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <DateRangePickerPopover
                initialRange={range}
                defaultIsJalali={true}
                initialTimes={{ deliveryTime, returnTime }}
                noDefaultSelectionOnFirstOpen={!hasSavedLocal}
                onConfirm={(v) => {
                  // ✅ shared for all cards
                  persistSharedSelection(v);
                  goReserve({ start: v.start, end: v.end, dt: v.deliveryTime, rt: v.returnTime });
                }}
                onClear={clearSharedSelection}
                trigger={
                  <Button
                    type="button"
                    className="flex-1 p-4 rounded-md flex justify-center items-center gap-2 cursor-pointer font-bold text-sm transition-colors shadow-sm"
                  >
                    رزرو آنلاین
                  </Button>
                }
              />

              <Button
                asChild
                type="button"
                variant="outline"
                className="rounded-md p-4 flex justify-center items-center gap-2 cursor-pointer transition-all
                  bg-[#10B9811A] border-[#10B98180] text-[#10B981] hover:bg-[#10B981] hover:text-white
                  dark:bg-[#10B9811A] dark:border-[#10B98180] dark:text-[#10B981] dark:hover:bg-[#10B981] dark:hover:text-white"
              >
                <Link
                  href={(() => {
                    const loc = String(locale || "en").toLowerCase().split("-")[0];
                    const carId = getCarIdSafe(car, data);

                    const url =
                      carId > 0
                        ? loc === "fa"
                          ? `https://palmrentcar.com/cars/${carId}`
                          : `https://palmrentcar.com/${loc}/cars/${carId}`
                        : "https://palmrentcar.com";

                    const city = loc === "fa" ? "دبی" : "Dubai";
                    const hasDates = !forceWhatsappNoDate && !!(carDates?.[0] && carDates?.[1]);

                    const message = hasDates
                      ? t("whatsappMessage.reserveWithDate", {
                          car: String((car as any)?.title || ""),
                          city,
                          url,
                          from: String(carDates?.[0] || ""),
                          to: String(carDates?.[1] || ""),
                          dt: normalizeTime(deliveryTimeStore) || "10:00",
                          rt: normalizeTime(returnTimeStore) || "10:00",
                        })
                      : t("whatsappMessage.reserve", {
                          car: String((car as any)?.title || ""),
                          city,
                          url,
                        });

                    return `https://wa.me/971556061134?text=${encodeURIComponent(message)}`;
                  })()}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconWhatsapp className="size-5" />
                  {t("whatsapp")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- gallery ---------------- */

export function SingleCarGallery({
  children,
  imageList,
  carHref,
}: {
  children?: React.ReactNode;
  noBtn?: boolean;
  imageList?: any[];
  carHref?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const safeImageList = Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"];

  const goCar = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!carHref) return;
      router.push(carHref);
    },
    [carHref, router],
  );

  return (
    <div className="relative w-full z-10 overflow-hidden rounded-none md:rounded-lg group">
      {/* Mobile */}
      <div
        className="
          md:hidden flex w-full h-57.5
          overflow-x-auto flex-nowrap gap-2
          hide-scrollbar
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
          [-webkit-overflow-scrolling:touch]
          touch-pan-x
          overscroll-x-auto
        "
      >
        {safeImageList.map((src: any, index: number) => {
          const isFirst = index === 0;
          const isLast = index === safeImageList.length - 1;
          const isSingle = safeImageList.length === 1;

          return (
            <Link
              key={`${String(src)}-${index}`}
              href={carHref || "#"}
              onClick={(e) => {
                if (!carHref) e.preventDefault();
              }}
              className={`
                shrink-0 h-full
                relative overflow-hidden bg-white block
                ${isSingle ? "rounded-xl" : ""}
                ${!isSingle && isFirst ? "rounded-tr-xl rounded-br-xl" : ""}
                ${!isSingle && isLast ? "rounded-tl-xl rounded-bl-xl" : ""}
              `}
            >
              <Image
                className="w-full h-full object-contain"
                src={toStorageUrl(src)}
                width={395}
                height={253}
                alt={`Car image ${index + 1}`}
                loading="lazy"
              />
            </Link>
          );
        })}

        {safeImageList.length > 1 && (
          <Link
            href={carHref || "#"}
            onClick={(e) => {
              if (!carHref) e.preventDefault();
            }}
            className="shrink-0 h-full w-[26%] bg-transparent flex items-center justify-center flex-col gap-2"
          >
            <Button size="icon" variant="outline" className="rounded-full border-none" onClick={(e) => e.stopPropagation()}>
              <ChevronLeft className="size-6" />
            </Button>
            <span className="text-xs text-black">{t("moredetail")}</span>
          </Link>
        )}
      </div>

      {/* Desktop */}
      <div
        className="hidden md:block w-full aspect-16/10 relative rounded-lg overflow-hidden cursor-pointer"
        onClick={goCar}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goCar();
          }
        }}
      >
        {safeImageList.map((src: any, index: number) => (
          <div
            key={`${String(src)}-${index}`}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              index === activeImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image className="w-full h-full object-cover" src={toStorageUrl(src)} fill alt="Car image" />

            {index === safeImageList.length - 1 && safeImageList.length > 1 && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20 pointer-events-none">
                <span className="flex items-center justify-center border-2 border-white rounded-full size-12 mb-2 -rotate-45">
                  <ArrowUpRight className="size-5" />
                </span>
                <span className="text-xs font-bold">{t("moredetail")}</span>
              </div>
            )}
          </div>
        ))}

        <div className="absolute inset-0 z-30 flex" onMouseLeave={() => setActiveImageIndex(0)}>
          {safeImageList.map((_: any, index: number) => (
            <div key={index} className="flex-1 h-full" onMouseEnter={() => setActiveImageIndex(index)} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full flex p-1 gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {safeImageList.map((_: any, index: number) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${index === activeImageIndex ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}

/* ---------------- options ---------------- */

export function SingleCarOptions({ car, bigFont = false }: { car: any; bigFont?: boolean }) {
  const t = useTranslations();
  if (!car) return null;

  const textSize = bigFont ? "xl:text-base sm:text-sm text-xs" : "text-[10px] sm:text-xs";

  const fuel = car.fuel || car.gasType || "Petrol";
  const gearboxKey = String(car.gearbox || car.gearBox || "").toLowerCase();
  const gearbox = gearboxKey.includes("auto") || gearboxKey.includes("اتوماتیک") ? "automatic" : "geared";

  return (
    <div className={`grid grid-cols-4 gap-1 text-[#787878] dark:text-gray-400 mt-1 mb-4 ${textSize} border-y p-2 text-nowrap`}>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : `size-4`}>
          <IconGas />
        </span>
        <span className="text-xs">{t(String(fuel === "بنزین" ? "petrol" : fuel).toLowerCase())}</span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : `size-4`}>
          <IconGearBox />
        </span>
        <span className="text-xs">{t(gearbox)}</span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : `size-4`}>
          <IconBag />
        </span>
        <span className="text-xs">
          {toFaDigitsHelper(car.baggage ?? car.suitcase ?? 0) || 0} {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : `size-4`}>
          <IconPerson />
        </span>
        <span className="text-xs">
          {toFaDigitsHelper(car.passengers ?? car.person ?? 0) || 0} {t("people")}
        </span>
      </div>
    </div>
  );
}

/* ---------------- price list ---------------- */
export function SingleCarPriceList({
  priceList,
  currency,
}: {
  priceList: any;
  defaultPrice?: number | null;
  oldPrice?: number | null;
  carDates: [string | null, string | null] | null;
  deliveryTime: string | null;
  returnTime: string | null;
  currency: string;
  rateToRial?: number | null;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const numberFmt = useMemo(() => {
    if (locale === "fa") return new Intl.NumberFormat("fa-IR");
    if (locale === "ar") return new Intl.NumberFormat("ar");
    if (locale === "tr") return new Intl.NumberFormat("tr-TR");
    return new Intl.NumberFormat("en-US");
  }, [locale]);

  const formatNum = useCallback((n: number) => numberFmt.format(Math.round(Number(n) || 0)), [numberFmt]);

  const pricesArray = useMemo(() => {
    const arr = normalizePriceList(priceList);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }, [priceList]);

  const currencyLabel = useMemo(() => {
    const c = String(currency || "").trim();
    if (!c) return "";
    const upper = c.toUpperCase();
    const translated = t(upper);
    return translated && translated !== upper ? translated : c;
  }, [currency, t]);

  if (!pricesArray.length) return null;

  return (
    <Card className="p-0 shadow-none border-0 bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col my-3 mt-auto pt-1">
          {pricesArray.map((row: any, idx: number) => {
            const rangeRaw = String(row?.range ?? "").trim();
            const rangeText = locale === "fa" ? toFaDigitsHelper(rangeRaw) : rangeRaw;

            const daily = Number(row?.final_price ?? row?.currentPrice ?? 0) || 0;
            const dailyOld = Number(row?.base_price ?? row?.previousPrice ?? 0) || 0;

            return (
              <div key={`${rangeRaw || "range"}-${idx}`} className="py-.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#6b7280] text-xs sm:text-sm font-semibold">{rangeText}</span>

                  <div dir="ltr" className="flex items-center gap-2">
                    {!!currencyLabel && <span className="text-sm text-[#4b5259] ">{currencyLabel}</span>}
                    <span className="text-[#3B82F6] text-base">{formatNum(daily)}</span>

                    {dailyOld > daily && (
                      <span className="text-[#A7A7A7] line-through text-xs sm:text-sm">{formatNum(dailyOld)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
