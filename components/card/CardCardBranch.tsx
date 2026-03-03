/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import {  ChevronLeft, ArrowRight, InfinityIcon, ArrowUpRight } from "lucide-react";

import {
  IconBag,
  IconDiscount,
  IconGas,
  IconGearBox,
  IconHeart,
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
  calendarHydrated?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const { openSheet } = useMobileSheet();
  const optionList = useSelector((state: any) => state.carList.optionList);

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
    return `/cars/${carId}`;
  }, [car, locale]);

  const images = useMemo(() => {
    const arr = normalizeImages((car as any)?.images || (car as any)?.photo);
    return uniqStrings(arr);
  }, [car]);

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
    [setSelectedCarId, setBranchIdStore, setCarDatesStore, setDeliveryTimeStore2, setReturnTimeStore2, setRoadMapStep, setIsAnySheetOpen],
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
      const bId = Number(branchId || 0);
      const safeBranchId = Number.isFinite(bId) && bId > 0 ? bId : 0;
      if (!carId || !safeBranchId) return;

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
      const hydrateKey = [safeBranchId, carId, from, to, dt, rt].join("|");
      hydrateReserveStore(payload);
      const params = buildReserveSearchParams(payload);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        openReserveSheetMobile(hydrateKey);
        return;
      }
      router.push(`/reserve?${params.toString()}`, { scroll: true });
    },
    [car, data, branchId, range?.start, range?.end, deliveryTime, returnTime, hydrateReserveStore, buildReserveSearchParams, router, pathname, locale, openReserveSheetMobile],
  );

  if (!car) return null;
  if (!calendarHydrated) return null;

  return (
    <div
      className={`${isHovering ? "z-30" : ""} flex w-full flex-col bg-white cursor-pointer transition-all rounded-2xl md:text-sm text-xs border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] max-md:pl-0 p-2.5 h-full justify-between overflow-hidden`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <SingleCarGallery imageList={images} noBtn={noBtn} carHref={carHref}>
        {/* ── badges ── */}
        <div className="flex text-[#0B835C] text-[10px] absolute gap-2 max-[380px]:gap-1 text-nowrap top-2 rtl:right-2 ltr:left-2 w-full">
          {(((car as any).rawOptions || (car as any).options || []) as any[]).map((item: any, index: number) => {
            if (!optionList?.[item]) return null;
            const isNoDeposit = optionList[item].title === "noDeposite";
            return (
              <div
                key={index}
                className={`sm:py-1 py-2 group sm:px-2 max-[405px]:px-2 max-[405px]:text-[9px] font-bold px-3 rounded-4xl ${isNoDeposit ? "bg-[#eafaee] border-[#eafaee]" : "bg-[#e2e6e9]"} relative hover:scale-[105%] transition-all border border-white`}
              >
                <span className={`${isNoDeposit ? "text-[#1e7b33]" : "text-[#4b5259]"} font-bold flex items-center gap-1`}>
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

        {/* ── discount badge ── */}
        {Number((car as any).discountPercent || (car as any).discount || 0) > 0 && (
          <div className="absolute bottom-2 left-2 bg-[#e1ff00] py-1.5 px-2.5 text-[#3b3d40] opacity-85 rounded-lg flex items-center gap-1">
            <IconDiscount size="20" />
            {(car as any).discountPercent || (car as any).discount}% {t("discount")}
          </div>
        )}
      </SingleCarGallery>

      <div className="pl-2.5 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="size-6 text-[#333333]" role="button" tabIndex={0}>
            <IconHeart active={undefined}  />
          </span>
          <div className="text-left my-2 text-lg font-bold">
            {locale === "fa"
              ? toFaDigitsHelper(capitalizeWords((car as any).title))
              : capitalizeWords((car as any).title)}
          </div>
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
            className="flex w-full gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <DateRangePickerPopover
              initialRange={range}
              defaultIsJalali={true}
              initialTimes={{ deliveryTime, returnTime }}
              noDefaultSelectionOnFirstOpen={!hasSavedLocal}
              onConfirm={(v) => {
                persistSharedSelection(v);
                goReserve({ start: v.start, end: v.end, dt: v.deliveryTime, rt: v.returnTime });
              }}
              onClear={clearSharedSelection}
              trigger={
                <button
                  type="button"
                  className="rounded-xl py-1 flex justify-center items-center gap-2 w-full cursor-pointer bg-[#0077db] text-white font-bold text-base"
                >
                  رزرو آنلاین
                </button>
              }
            />

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
              className="rounded-xl py-1 flex justify-center gap-2 w-fit items-center text-nowrap px-2 cursor-pointer bg-[#10B9811A] border border-[#10B98180] text-[#10B981]"
            >
              <IconWhatsapp className="size-5" />
              {t("whatsapp")}
            </Link>
          </div>
        )}
      </div>
    </div>
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
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (!carHref) return;
      router.push(carHref);
    },
    [carHref, router],
  );

  return (
    <div className="flex relative z-10 w-full lg:h-55 h-55">
      <div className="flex h-full max-md:overflow-x-auto max-md:z-10 hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="md:absolute max-md:flex w-full h-full top-0 right-0 rounded-lg -z-10 max-md:gap-2"
        >
          {/* Mobile images */}
          {safeImageList.map((src: any, index: number) => {
            const isFirst = index === 0;
            const isLast = index === safeImageList.length - 1;
            const isSingle = safeImageList.length === 1;

            return (
              <Link
                key={`${String(src)}-${index}`}
                href={carHref || "#"}
                onClick={(e) => { if (!carHref) e.preventDefault(); }}
                className={`
                  md:hidden shrink-0 h-full relative overflow-hidden bg-white block
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

          {/* Desktop images */}
          {safeImageList.map((src: any, index: number) => (
            <Image
              key={`desk-${String(src)}-${index}`}
              className={`md:rounded-lg w-full h-full object-cover md:absolute max-md:hidden ${index === activeImageIndex ? "z-10" : ""} ${index !== safeImageList.length - 1 ? "" : "md:hidden"}`}
              src={toStorageUrl(src)}
              width={395}
              height={253}
              alt={`Car image ${index + 1}`}
              loading="lazy"
            />
          ))}

          {/* Mobile: more detail button */}
          {safeImageList.length > 1 && (
            <Link
              href={carHref || "#"}
              onClick={(e) => { if (!carHref) e.preventDefault(); }}
              className="flex md:hidden flex-col items-center justify-center text-black text-nowrap relative gap-2 font-bold px-4 shrink-0"
            >
              <span className="flex items-center justify-center bg-[#F1F1F1] rounded-full size-8">
                <ChevronLeft className="size-4" />
              </span>
              {t("moredetail")}
            </Link>
          )}

          {/* Desktop: last image overlay */}
          <div
            className={`${activeImageIndex === safeImageList.length - 1 ? "z-10" : ""} rounded-lg w-full h-full max-md:hidden md:absolute cursor-pointer`}
            onClick={goCar}
          >
            <div className={`absolute w-full h-full rounded-lg ${activeImageIndex === safeImageList.length - 1 ? "z-20" : ""} bg-[#000000aa] text-white flex flex-col items-center justify-center`}>
              <span className="flex items-center justify-center border-2 border-white rounded-full size-16 ">
                <ArrowRight className="size-6" />
              </span>
              {t("moredetail")}
            </div>
            <Image
              className={`${activeImageIndex === safeImageList.length - 1 ? "z-10" : ""} rounded-lg w-full h-full object-cover md:absolute`}
              src={toStorageUrl(safeImageList[safeImageList.length - 1])}
              width={395}
              height={253}
              alt="Car image last"
            />
          </div>
        </div>

        <div className="z-20">{children}</div>

        {/* hover zones + indicator bars */}
        <div
          className="absolute w-full h-full md:flex items-end flex-row-reverse p-2 cursor-pointer transition-all opacity-0 hover:opacity-100 hidden"
          onMouseLeave={() => setActiveImageIndex(0)}
        >
          {safeImageList.map((_: any, index: number) => (
            index !== safeImageList.length - 1 ? (
              <div
                key={index}
                onMouseEnter={() => setActiveImageIndex(index)}
                className="w-full h-full flex items-end group px-1"
              >
                <span className="w-full h-1 rounded-2xl bg-[#00000070] group-hover:bg-white transition-all"></span>
              </div>
            ) : (
              <div
                key={index}
                onMouseEnter={() => setActiveImageIndex(index)}
                onClick={goCar}
                className="w-full h-full flex items-end group px-1 cursor-pointer"
              >
                <span className="w-full h-1 rounded-2xl bg-[#00000070] group-hover:bg-white transition-all"></span>
              </div>
            )
          ))}
        </div>
      </div>
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
    <div className={`grid grid-cols-4 gap-1 text-[#787878] mt-1 mb-4 ${textSize} border-y p-2 text-nowrap`}>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}><IconGas /></span>
        <span className="text-xs">{t(String(fuel === "بنزین" ? "petrol" : fuel).toLowerCase())}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}><IconGearBox /></span>
        <span className="text-xs">{t(gearbox)}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}><IconBag /></span>
        <span className="text-xs">{toFaDigitsHelper(car.baggage ?? car.suitcase ?? 0) || 0} {t("suitCase")}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}><IconPerson /></span>
        <span className="text-xs">{toFaDigitsHelper(car.passengers ?? car.person ?? 0) || 0} {t("people")}</span>
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

const formatRangeLabel = useCallback(
  (raw: string): React.ReactNode => {
    const s = String(raw || "").trim();
    if (!s) return "";

    const m = s.match(/^(\d+)\s*[-_–—]\s*(\d+)\s*$/);
    if (!m) return s;

    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return s;

    const aTxt = numberFmt.format(a);

    // ✅ اگر انتها 9999 یا خیلی بزرگ بود => آیکون بی‌نهایت
    if (b >= 9999) {
      if (locale === "fa") {
        return (
          <span className="inline-flex items-center gap-1">
            <span>{aTxt}</span>
            <span>تا</span>
            <InfinityIcon className="size-4 translate-y-[1px]" />
            <span>روز</span>
          </span>
        );
      }

      if (locale === "ar") {
        return (
          <span className="inline-flex items-center gap-1">
            <span>{aTxt}</span>
            <span>إلى</span>
            <InfinityIcon className="size-4 translate-y-[1px]" />
            <span>يوم</span>
          </span>
        );
      }

      if (locale === "tr") {
        return (
          <span className="inline-flex items-center gap-1">
            <span>{aTxt}</span>
            <span>-</span>
            <InfinityIcon className="size-4 translate-y-[1px]" />
            <span>gün</span>
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1">
          <span>{aTxt}</span>
          <span>to</span>
          <InfinityIcon className="size-4 translate-y-[1px]" />
          <span>days</span>
        </span>
      );
    }

    // ✅ حالت عادی: "۱ تا ۶ روز"
    const bTxt = numberFmt.format(b);

    if (locale === "fa") return `${aTxt} تا ${bTxt} روز`;
    if (locale === "ar") return `${aTxt} إلى ${bTxt} يوم`;
    if (locale === "tr") return `${aTxt} - ${bTxt} gün`;
    return `${aTxt} to ${bTxt} days`;
  },
  [locale, numberFmt],
);
  if (!pricesArray.length) return null;

  return (
    <div className="flex flex-col gap-2 mb-4 border-[#0000001f]">
      {pricesArray.map((row: any, idx: number) => {
        const rangeRaw = String(row?.range ?? "").trim();
        const rangeText = formatRangeLabel(rangeRaw);

        const daily = Number(row?.final_price ?? row?.currentPrice ?? 0) || 0;
        const dailyOld = Number(row?.base_price ?? row?.previousPrice ?? 0) || 0;

        return (
          <div key={`${rangeRaw || "range"}-${idx}`} className="flex justify-between items-center text-sm font-bold">
            {/* ✅ سمت راست: "۱ تا ۶ روز :" */}
            <span className="text-[#4b5259]">{rangeText} :</span>

            <div className="flex gap-2">
              {dailyOld > daily && <span className="text-[#A7A7A7] line-through">{formatNum(dailyOld)}</span>}
              <span className="text-[#3B82F6] font-bold">{formatNum(daily)}</span>
              {!!currencyLabel && <span>{currencyLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}