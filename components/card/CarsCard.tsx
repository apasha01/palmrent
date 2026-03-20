/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

import { ArrowRight, ChevronLeft, InfinityIcon } from "lucide-react";
import {
  IconBag,
  IconDiscount,
  IconGas,
  IconHeart,
  IconGearBox,
  IconInfoCircle,
  IconPerson,
  IconWhatsapp,
} from "../Icons";

import { STORAGE_URL } from "@/lib/apiClient";
import { adaptCarData } from "@/lib/adapters";
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days";
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker";
import { useMobileSheet } from "@/providers/mobile-sheet-provider";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { SheetClose } from "@/components/ui/sheet";
import {
  AppDrawer,
  type AppDrawerData,
  type AppDrawerKind,
} from "@/components/common/AppDrawer";
// ✅ فقط این یه خط اضافه شد
import { useTopLoader } from "nextjs-toploader";

/* ---------------- helpers ---------------- */

const toStorageUrl = (p: unknown) => {
  if (!p) return "";
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) {
    return p;
  }
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

function calcDaysWithGraceSafe(opts: {
  carDates: [string | null, string | null] | null;
  deliveryTime: string | null;
  returnTime: string | null;
}) {
  const { carDates, deliveryTime, returnTime } = opts;
  if (!carDates?.[0] || !carDates?.[1]) return 1;
  try {
    return calcRentDaysWithGrace({
      fromDateJalali: carDates[0],
      toDateJalali: carDates[1],
      deliveryTime: normalizeTime(deliveryTime),
      returnTime: normalizeTime(returnTime),
      graceMinutes: 90,
      jalaliToDate,
    });
  } catch {
    return 1;
  }
}

function getCarIdSafe(car: any, data: any): number {
  const v = car?.id ?? car?.car_id ?? data?.id ?? data?.car_id ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizePriceList(list: any) {
  if (!list) return [];
  if (Array.isArray(list)) return list;
  return Object.entries(list).map(([key, value]: any) => ({
    range: key,
    ...(value as any),
  }));
}

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildBadgesFromApi(car: any): Array<{
  key: string;
  label: string;
  type: "noDeposit" | "default";
}> {
  const badges: Array<{ key: string; label: string; type: "noDeposit" | "default" }> = [];

  const deposit = car?.deposit ?? car?.deposit_val ?? null;
  if (!deposit || deposit === "no") {
    badges.push({ key: "noDeposit", label: "noDeposite", type: "noDeposit" });
  }

  const km = car?.km ?? car?.km_val ?? null;
  if (km === "yes") {
    badges.push({ key: "freeKm", label: "unlimitedKilometers", type: "default" });
  }

  const insurance = car?.insurance ?? car?.insurance_val ?? null;
  if (insurance === "yes") {
    badges.push({ key: "insurance", label: "freeinsurance", type: "default" });
  }

  const freeDelivery = car?.free_delivery ?? null;
  if (freeDelivery === "yes") {
    badges.push({ key: "freeDelivery", label: "freeDelivery", type: "default" });
  }

  return badges;
}

function getBadgeDrawerConfig(badgeKey: string, car: any, currency: string): {
  kind: AppDrawerKind;
  data: AppDrawerData;
} {
  switch (badgeKey) {
    case "noDeposit":
      return { kind: "no_deposit", data: { currency, deposit: car?.deposit_amount ?? car?.deposit_value ?? 0 } };
    case "freeKm":
      return { kind: "km", data: { km: "yes" } };
    case "insurance":
      return { kind: "insurance", data: { insurance: "yes" } };
    case "freeDelivery":
      return { kind: "delivery", data: { free_delivery: "yes" } };
    default:
      return {
        kind: "extra_option",
        data: {
          optionTitle: "جزئیات",
          optionDescriptionFromApi: "برای این مورد توضیحی ثبت نشده است. برای اطلاعات بیشتر با پشتیبانی هماهنگ کنید.",
        },
      };
  }
}

type PickerRange = { start: Date | null; end: Date | null };
const EMPTY_RANGE: PickerRange = { start: null, end: null };

/* ---------------- badge renderer ---------------- */

function SingleCarBadges({
  rawBadges,
  dataSource,
  currency,
  t,
  onDrawerOpenChange,
}: {
  rawBadges: Array<{ key: string; label: string; type: "noDeposit" | "default" }>;
  dataSource: any;
  currency: string;
  t: any;
  onDrawerOpenChange?: (isOpen: boolean) => void;
}) {
  if (!rawBadges.length) return null;

  const badgeCount = rawBadges.length;

  const sizeClass = (() => {
    if (badgeCount <= 2) return { badge: "px-3 py-2 text-[10px] sm:px-2.5 sm:py-1.5", icon: "size-3.5", gap: "gap-2", innerGap: "gap-1" };
    if (badgeCount === 3) return { badge: "px-2.5 py-1.5 text-[9.5px] sm:px-2 sm:py-1", icon: "size-3.5", gap: "gap-1.5", innerGap: "gap-[5px]" };
    if (badgeCount === 4) return { badge: "px-2 py-1.5 text-[9px] sm:px-1.5 sm:py-1", icon: "size-3", gap: "gap-1", innerGap: "gap-[4px]" };
    return { badge: "px-2 py-1 text-[8.5px] sm:px-1.5 sm:py-1", icon: "size-3", gap: "gap-1", innerGap: "gap-[4px]" };
  })();

  const wrapperClass = [
    "flex w-full items-center overflow-x-auto overflow-y-hidden whitespace-nowrap",
    "hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    "max-w-full",
    sizeClass.gap,
  ].join(" ");

  const getBadgeClass = (isNoDeposit: boolean) =>
    [
      "shrink-0 inline-flex items-center justify-center rounded-full border font-bold",
      "max-w-max appearance-none outline-none ring-0 shadow-none",
      "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0",
      sizeClass.badge,
      isNoDeposit
        ? "border-[#eafaee] bg-[#eafaee] text-[#1e7b33]"
        : "border-white bg-[#e2e6e9] text-[#4b5259]",
    ].join(" ");

  const contentClass = ["inline-flex items-center whitespace-nowrap leading-none", sizeClass.innerGap].join(" ");

  return (
    <div
      className="absolute top-2 start-2 z-20 w-[calc(100%-16px)]"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
    >
      <div className={`${wrapperClass} pointer-events-auto`}>
        {rawBadges.map((badge) => {
          const drawerConfig = getBadgeDrawerConfig(badge.key, dataSource, currency);
          const isNoDeposit = badge.key === "noDeposit";

          return (
            <AppDrawer
              key={badge.key}
              kind={drawerConfig.kind}
              data={drawerConfig.data}
              onOpenChange={onDrawerOpenChange}
              trigger={({ open }) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={getBadgeClass(isNoDeposit)}
                  aria-label={String(t(badge.label))}
                >
                  <span className={contentClass}>
                    <span className={`inline-flex shrink-0 items-center justify-center ${sizeClass.icon}`}>
                      <IconInfoCircle />
                    </span>
                    <span className="whitespace-nowrap leading-none">{t(badge.label)}</span>
                  </span>
                </button>
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- main component ---------------- */

export default function SingleCar({
  data,
  noBtn = false,
  currency = "",
  rateToRial,
  onMobileReserve,
  branchId,
  noDateMode = false,
  forceWhatsappNoDate = false,
  sharedCalendar,
  onSharedCalendarChange,
  calendarHydrated = true,
}: {
  data: any;
  noBtn?: boolean;
  currency?: string;
  rateToRial?: number | null;
  onMobileReserve?: (carData: any) => void;
  branchId?: number | null;
  noDateMode?: boolean;
  forceWhatsappNoDate?: boolean;
  sharedCalendar?: { range: PickerRange; deliveryTime: string; returnTime: string };
  onSharedCalendarChange?: (v: { range: PickerRange; deliveryTime: string; returnTime: string }) => void;
  calendarHydrated?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openSheet } = useMobileSheet();
  // ✅ اضافه شد
  const loader = useTopLoader();

  const carDates = useSearchPageStore((s) => s.carDates);
  const deliveryTimeStore = useSearchPageStore((s) => s.deliveryTime);
  const returnTimeStore = useSearchPageStore((s) => s.returnTime);

  const setSelectedCarId = useSearchPageStore((s: any) => s.setSelectedCarId);
  const setRoadMapStep = useSearchPageStore((s: any) => s.setRoadMapStep);
  const setBranchIdStore = useSearchPageStore((s: any) => s.setBranchId);
  const setCarDatesStore = useSearchPageStore((s: any) => s.setCarDates);
  const setDeliveryTimeStore2 = useSearchPageStore((s: any) => s.setDeliveryTime);
  const setReturnTimeStore2 = useSearchPageStore((s: any) => s.setReturnTime);
  const setIsAnySheetOpen = useSearchPageStore((s: any) => s.setIsAnySheetOpen);
  const setReserveDraft = useSearchPageStore((s: any) => s.setReserveDraft);
  const resetReserveDraft = useSearchPageStore((s: any) => s.resetReserveDraft);

  const [isHovering, setIsHovering] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerJustClosedRef = useRef(false);
  const drawerJustClosedTimerRef = useRef<any>(null);

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      drawerJustClosedRef.current = true;
      if (drawerJustClosedTimerRef.current) clearTimeout(drawerJustClosedTimerRef.current);
      drawerJustClosedTimerRef.current = setTimeout(() => {
        drawerJustClosedRef.current = false;
        drawerJustClosedTimerRef.current = null;
      }, 400);
    }
  }, []);

  const car = useMemo(() => {
    const alreadyCardModel =
      data &&
      typeof data === "object" &&
      (Array.isArray((data as any).images) ||
        (data as any).priceList ||
        Array.isArray((data as any).photo) ||
        Array.isArray((data as any).prices) ||
        Array.isArray((data as any).dailyPrices) ||
        typeof (data as any).final_price !== "undefined" ||
        typeof (data as any).rent_price !== "undefined");
    return alreadyCardModel ? data : adaptCarData(data);
  }, [data]);

  const images = useMemo(() => {
    const arr = normalizeImages((car as any)?.images || (car as any)?.photo);
    return uniqStrings(arr);
  }, [car]);

  const carHref = useMemo(() => {
    const carId = Number((car as any)?.id);
    if (!Number.isFinite(carId) || carId <= 0) return `/cars`;
    return `/cars/${carId}`;
  }, [car, locale]);

  const rawBadges = useMemo(() => buildBadgesFromApi(data ?? car), [data, car]);

  const localRange = sharedCalendar?.range ?? EMPTY_RANGE;
  const localDeliveryTime = String(sharedCalendar?.deliveryTime || "10:00");
  const localReturnTime = String(sharedCalendar?.returnTime || "10:00");
  const hasSavedLocal = Boolean(localRange?.start && localRange?.end);

  const persistSharedSelection = useCallback(
    (v: { start: Date; end: Date; deliveryTime: string; returnTime: string }) => {
      onSharedCalendarChange?.({ range: { start: v.start, end: v.end }, deliveryTime: v.deliveryTime, returnTime: v.returnTime });
    },
    [onSharedCalendarChange],
  );

  const clearSharedSelection = useCallback(() => {
    onSharedCalendarChange?.({ range: EMPTY_RANGE, deliveryTime: "10:00", returnTime: "10:00" });
  }, [onSharedCalendarChange]);

  const hydrateReserveStore = useCallback(
    (args: { branchId: number; carId: number; from: string; to: string; dt: string; rt: string }) => {
      setSelectedCarId(args.carId);
      setBranchIdStore(args.branchId);
      setCarDatesStore([args.from, args.to]);
      setDeliveryTimeStore2(args.dt);
      setReturnTimeStore2(args.rt);
      setRoadMapStep(3);
      if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(true);
      if (typeof setReserveDraft === "function") {
        setReserveDraft({
          branch_id: args.branchId, car_id: args.carId,
          from: args.from, to: args.to, dt: args.dt, rt: args.rt,
          sort: null, search_title: null, categories: [], min_p: null, max_p: null,
        });
      }
    },
    [setSelectedCarId, setBranchIdStore, setCarDatesStore, setDeliveryTimeStore2, setReturnTimeStore2, setRoadMapStep, setIsAnySheetOpen, setReserveDraft],
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
              <SheetClose><ArrowRight className="size-8 px-2" /></SheetClose>
              <SearchHeader stepSecond />
            </div>
            <StepRent step={3} />
            <ReserveInformation key={hydrateKey} />
          </div>
        ),
        onClose: () => {
          setRoadMapStep(2);
          if (typeof setIsAnySheetOpen === "function") setIsAnySheetOpen(false);
          if (typeof setSelectedCarId === "function") setSelectedCarId(null);
          if (typeof resetReserveDraft === "function") resetReserveDraft();
        },
      });
    },
    [openSheet, setRoadMapStep, setIsAnySheetOpen, setSelectedCarId, resetReserveDraft],
  );

  const goReserveFromNoDate = useCallback(
    (args: { start?: Date | null; end?: Date | null; dt?: string | null; rt?: string | null }) => {
      const carId = getCarIdSafe(car, data);
      const bId = Number(branchId || 0);
      const safeBranchId = Number.isFinite(bId) && bId > 0 ? bId : 0;
      if (!carId || !safeBranchId) return;

      const safeStart = args.start ?? localRange?.start ?? null;
      const safeEnd = args.end ?? localRange?.end ?? null;
      if (!safeStart || !safeEnd) return;

      const dt = normalizeTime(args.dt ?? localDeliveryTime) || "10:00";
      const rt = normalizeTime(args.rt ?? localReturnTime) || "10:00";
      const from = formatJalaliDate(safeStart);
      const to = formatJalaliDate(safeEnd);
      if (!from || !to || !dt || !rt) return;

      const payload = { branchId: safeBranchId, carId, from, to, dt, rt };
      const hydrateKey = [safeBranchId, carId, from, to, dt, rt].join("|");
      hydrateReserveStore(payload);

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        openReserveSheetMobile(hydrateKey);
        return;
      }
      // ✅ لودر شروع میشه قبل از push دسکتاپ
      loader.start();
      router.push(`/reserve?${buildReserveSearchParams(payload).toString()}`, { scroll: true });
    },
    [car, data, branchId, localRange?.start, localRange?.end, localDeliveryTime, localReturnTime, hydrateReserveStore, buildReserveSearchParams, router, openReserveSheetMobile, loader],
  );

  // ✅ goReserve با loader.start
  const goReserve = useCallback(() => {
    if (noDateMode) return;
    if (isDrawerOpen) return;
    if (drawerJustClosedRef.current) return;

    const carId = Number((car as any)?.id);
    if (!Number.isFinite(carId) || carId <= 0) return;

    // موبایل: sheet باز میشه، لودر نمیخواد
    if (onMobileReserve && typeof window !== "undefined" && window.innerWidth < 768) {
      onMobileReserve(car);
      return;
    }

    // ✅ لودر شروع میشه قبل از push دسکتاپ
    loader.start();

    const params = new URLSearchParams(searchParams.toString());
    params.set("car_id", String(carId));
    params.delete("step");
    params.set("dt", normalizeTime(deliveryTimeStore) || "10:00");
    params.set("rt", normalizeTime(returnTimeStore) || "10:00");
    router.push(`/reserve?${params.toString()}`, { scroll: true });
  }, [noDateMode, isDrawerOpen, car, onMobileReserve, searchParams, deliveryTimeStore, returnTimeStore, router, loader]);

  if (!car) return null;
  if (noDateMode && !calendarHydrated) return null;

  return (
    <div
      className={`${isHovering ? "z-10" : ""} flex w-full flex-col justify-between rounded-2xl border border-[#0000001f] bg-white p-2.5 text-xs shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] transition-all max-md:pl-0 md:text-sm`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={(e) => {
        if (noDateMode || isDrawerOpen || drawerJustClosedRef.current) return;
        goReserve();
      }}
      role={noDateMode ? undefined : "button"}
      tabIndex={noDateMode ? undefined : 0}
      onKeyDown={
        noDateMode
          ? undefined
          : (e) => {
              if (isDrawerOpen || drawerJustClosedRef.current) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goReserve();
              }
            }
      }
    >
      <SingleCarGallery
        imageList={images}
        carHref={carHref}
        drawerJustClosedRef={drawerJustClosedRef}
        isDrawerOpen={isDrawerOpen}
        goReserve={goReserve}
        noDateMode={noDateMode}
      >
        <SingleCarBadges
          rawBadges={rawBadges}
          dataSource={data ?? car}
          currency={currency}
          t={t}
          onDrawerOpenChange={handleDrawerOpenChange}
        />

        {Number((car as any).discountPercent || (car as any).discount || (car as any).off || 0) > 0 && (
          <div
            className="absolute bottom-2 end-2 z-20 pointer-events-auto"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            <div className="flex items-center gap-1 rounded-lg bg-[#e1ff00] px-2.5 py-1.5 text-[#3b3d40] opacity-85">
              <IconDiscount size="20" />
              {Number((car as any).discountPercent || (car as any).discount || (car as any).off || 0)}%{" "}
              {t("discount")}
            </div>
          </div>
        )}
      </SingleCarGallery>

      <div className="flex flex-col pl-2.5">
        <div className="flex items-center justify-between">
          <span
            className="size-6 text-[#333333]"
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
          >
            <IconHeart active={undefined} />
          </span>
          <div className="my-2 text-left text-lg font-bold">
            {(car as any).title}
          </div>
        </div>

        <SingleCarOptions car={car} />

        <SingleCarPriceList
          priceList={(car as any).priceList || (car as any).dailyPrices || (car as any).prices}
          defaultPrice={toNumberSafe((car as any).final_price) || toNumberSafe((car as any).currentPrice) || toNumberSafe((car as any).price) || 0}
          oldPrice={toNumberSafe((car as any).rent_price) || toNumberSafe((car as any).previousPrice) || toNumberSafe((car as any).oldPrice) || 0}
          discountPercent={Number((car as any).discountPercent ?? (car as any).discount ?? (car as any).off ?? 0)}
          carDates={carDates}
          deliveryTime={deliveryTimeStore}
          returnTime={returnTimeStore}
          currency={currency}
          rateToRial={rateToRial}
          noDateMode={noDateMode}
        />

        {!noBtn && (
          <SingleCarButtons
            car={car}
            carDates={carDates}
            deliveryTime={deliveryTimeStore}
            returnTime={returnTimeStore}
            reserveOnClick={goReserve}
            noDateMode={noDateMode}
            forceWhatsappNoDate={forceWhatsappNoDate}
            localRange={localRange}
            localDeliveryTime={localDeliveryTime}
            localReturnTime={localReturnTime}
            onNoDateReserveConfirm={(v) => {
              persistSharedSelection(v);
              goReserveFromNoDate({ start: v.start, end: v.end, dt: v.deliveryTime, rt: v.returnTime });
            }}
            onNoDateClear={clearSharedSelection}
            hasSavedLocal={hasSavedLocal}
          />
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
  drawerJustClosedRef,
  isDrawerOpen = false,
  goReserve,
  noDateMode = false,
}: {
  children?: React.ReactNode;
  imageList?: any[];
  carHref?: string;
  drawerJustClosedRef?: React.MutableRefObject<boolean>;
  isDrawerOpen?: boolean;
  goReserve?: () => void;
  noDateMode?: boolean;
}) {
  const t = useTranslations();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"];

  return (
    <div className="relative z-10 flex w-full rounded-lg lg:h-55 h-[220px]">
      {!firstImageLoaded && (
        <>
          <style>{`
            @keyframes shimmer-slide {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(200%);  }
            }
          `}</style>
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gray-200" />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                animation: "shimmer-slide 1.6s infinite",
              }}
            />
          </div>
        </>
      )}

      <Link
        href={carHref || "#"}
        tabIndex={-1}
        className="absolute inset-0 z-10 cursor-pointer max-md:overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => {
          if (isDrawerOpen || drawerJustClosedRef?.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (!noDateMode && goReserve) {
            goReserve();
          }
        }}
      >
        <div className="md:absolute max-md:flex w-full h-full top-0 right-0 rounded-lg max-md:gap-2">
          {safeImageList.map((src: any, index: number) => (
            <Image
              key={`${String(src)}-${index}`}
              className={`
                md:rounded-lg
                max-md:first:rounded-r-lg max-md:last-of-type:rounded-l-lg
                max-md:shrink-0 max-md:w-[calc(100vw-80px)] max-md:snap-center
                w-full h-full object-cover md:absolute
                ${index === activeImageIndex ? "md:z-10 md:opacity-100" : "md:opacity-0"}
                md:transition-opacity md:duration-200 md:ease-out
              `}
              src={toStorageUrl(src)}
              width={395}
              height={253}
              alt={`Car image ${index + 1}`}
              loading="eager"
              onLoad={index === 0 ? () => setFirstImageLoaded(true) : undefined}
              onError={index === 0 ? () => setFirstImageLoaded(true) : undefined}
            />
          ))}

          {safeImageList.length > 1 && (
            <div
              className="relative z-20 flex md:hidden flex-col items-center justify-center gap-2 px-4 font-bold text-black text-nowrap cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (carHref && carHref !== "#") {
                  window.location.href = carHref;
                }
              }}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#F1F1F1]">
                <ChevronLeft className="size-4" />
              </span>
              {t("moredetail")}
            </div>
          )}

          <div
            className={`${
              activeImageIndex === safeImageList.length - 1 ? "z-10" : "pointer-events-none"
            } rounded-lg w-full h-full max-md:hidden md:absolute`}
          >
            <div
              className={`absolute w-full h-full rounded-lg ${
                activeImageIndex === safeImageList.length - 1 ? "z-20" : ""
              } bg-[#000000aa] text-white flex flex-col items-center justify-center md:transition-opacity md:duration-200 md:ease-out cursor-pointer`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isDrawerOpen || drawerJustClosedRef?.current) return;
                if (carHref && carHref !== "#") window.location.href = carHref;
              }}
            >
              <span className="flex items-center justify-center border-2 border-white rounded-full size-16">
                <ArrowRight className="size-6" />
              </span>
              {t("moredetail")}
            </div>

            <Image
              className={`${
                activeImageIndex === safeImageList.length - 1 ? "z-10" : ""
              } rounded-lg w-full h-full object-cover md:absolute`}
              src={toStorageUrl(safeImageList[safeImageList.length - 1])}
              width={395}
              height={253}
              alt="Car image last"
            />
          </div>
        </div>

        <div
          className="absolute w-full h-full md:flex items-end flex-row-reverse p-2 cursor-pointer transition-all opacity-0 hover:opacity-100 hidden z-20"
          onMouseLeave={() => setActiveImageIndex(0)}
        >
          {safeImageList.map((_: any, index: number) => {
            const isLast = index === safeImageList.length - 1;
            return (
              <div
                key={index}
                onMouseEnter={() => setActiveImageIndex(index)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isDrawerOpen || drawerJustClosedRef?.current) return;
                  if (isLast) {
                    if (carHref && carHref !== "#") window.location.href = carHref;
                  } else {
                    if (!noDateMode && goReserve) goReserve();
                  }
                }}
                className="w-full h-full flex items-end group px-1"
              >
                <span className="w-full h-1 rounded-2xl bg-[#00000070] group-hover:bg-white transition-all" />
              </div>
            );
          })}
        </div>
      </Link>

      <div className="absolute inset-0 z-20 pointer-events-none">
        {children}
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
    <div className={`mt-1 mb-4 grid grid-cols-4 gap-1 border-y p-2 text-[#787878] text-nowrap ${textSize}`}>
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
        <span className="text-xs">{(car.baggage ?? car.suitcase ?? 0) || 0} {t("suitCase")}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}><IconPerson /></span>
        <span className="text-xs">{(car.passengers ?? car.person ?? 0) || 0} {t("people")}</span>
      </div>
    </div>
  );
}

/* ---------------- price list ---------------- */

export function SingleCarPriceList({
  priceList,
  defaultPrice,
  oldPrice,
  discountPercent = 0,
  carDates,
  deliveryTime,
  returnTime,
  currency,
  noDateMode = false,
}: {
  priceList: any;
  defaultPrice?: number | null;
  oldPrice?: number | null;
  discountPercent?: number;
  carDates: [string | null, string | null] | null;
  deliveryTime: string | null;
  returnTime: string | null;
  currency: string;
  rateToRial?: number | null;
  noDateMode?: boolean;
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

  const currencyLabel = useMemo(() => {
    const code = String(currency || "").trim().toUpperCase();
    if (!code) return "";
    const translated = t(code);
    return translated && translated !== code ? translated : code;
  }, [currency, t]);

  const pricesArray = useMemo(() => {
    const arr = normalizePriceList(priceList);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }, [priceList]);

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
      if (b >= 9999) {
        if (locale === "fa") return <span className="inline-flex items-center gap-1"><span>{aTxt}</span><span>تا</span><InfinityIcon className="size-4 translate-y-[1px]" /><span>روز</span></span>;
        if (locale === "ar") return <span className="inline-flex items-center gap-1"><span>{aTxt}</span><span>إلى</span><InfinityIcon className="size-4 translate-y-[1px]" /><span>يوم</span></span>;
        if (locale === "tr") return <span className="inline-flex items-center gap-1"><span>{aTxt}</span><span>-</span><InfinityIcon className="size-4 translate-y-[1px]" /><span>gün</span></span>;
        return <span className="inline-flex items-center gap-1"><span>{aTxt}</span><span>to</span><InfinityIcon className="size-4 translate-y-[1px]" /><span>days</span></span>;
      }
      const bTxt = numberFmt.format(b);
      if (locale === "fa") return `${aTxt} تا ${bTxt} روز`;
      if (locale === "ar") return `${aTxt} إلى ${bTxt} يوم`;
      if (locale === "tr") return `${aTxt} - ${bTxt} gün`;
      return `${aTxt} to ${bTxt} days`;
    },
    [locale, numberFmt],
  );

  const days = useMemo(() => calcDaysWithGraceSafe({ carDates, deliveryTime, returnTime }), [carDates, deliveryTime, returnTime]);

  const daily = useMemo(() => {
    const directFinal = Number(defaultPrice ?? 0);
    if (directFinal > 0) return directFinal;
    const list = normalizePriceList(priceList);
    const first: any = list?.[0];
    return toNumberSafe(first?.final_price) || toNumberSafe(first?.currentPrice) || toNumberSafe(first?.price) || 0;
  }, [defaultPrice, priceList]);

  const dailyOld = useMemo(() => {
    const directOld = Number(oldPrice ?? 0);
    if (directOld > 0 && directOld >= daily) return directOld;
    const list = normalizePriceList(priceList);
    const first: any = list?.[0];
    const fromList = toNumberSafe(first?.base_price) || toNumberSafe(first?.previousPrice) || 0;
    if (fromList > 0 && fromList >= daily) return fromList;
    const pct = Number(discountPercent ?? 0);
    if (pct > 0 && pct < 100 && daily > 0) return Math.round(daily / (1 - pct / 100));
    return 0;
  }, [oldPrice, priceList, daily, discountPercent]);

  const total = useMemo(() => Number(daily || 0) * Number(days || 1), [daily, days]);
  const totalOld = useMemo(() => (dailyOld > 0 ? Number(dailyOld || 0) * Number(days || 1) : 0), [dailyOld, days]);
  const daysText = String(days || 1);

  if (noDateMode) {
    if (!pricesArray.length) return null;
    return (
      <div className="mb-4 flex flex-col gap-2 border-[#0000001f]">
        {pricesArray.map((row: any, idx: number) => {
          const rangeRaw = String(row?.range ?? "").trim();
          const rangeDaily = toNumberSafe(row?.final_price) || toNumberSafe(row?.currentPrice) || toNumberSafe(row?.price) || 0;
          const rangeDailyOld = toNumberSafe(row?.base_price) || toNumberSafe(row?.previousPrice) || 0;
          return (
            <div key={`${rangeRaw || "range"}-${idx}`} className="flex items-center justify-between text-sm font-bold">
              <span className="text-[#4b5259]">{formatRangeLabel(rangeRaw)} :</span>
              <div className="flex items-center gap-2">
                {rangeDailyOld > rangeDaily && <span className="text-xs text-[#A7A7A7] line-through">{formatNum(rangeDailyOld)}</span>}
                <span className="font-bold text-[#3B82F6]">{formatNum(rangeDaily)}</span>
                {!!currencyLabel && <span>{currencyLabel}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2 border-[#0000001f]">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{t("BSPrice")} {daysText} {t("day")} :</span>
        <div className="flex items-center gap-2">
          {dailyOld > daily && <span className="text-xs text-[#A7A7A7] line-through">{formatNum(dailyOld)}</span>}
          <span className="font-bold text-[#3B82F6]">{formatNum(daily)}</span>
          {!!currencyLabel && <span>{currencyLabel}</span>}
        </div>
      </div>
      <div className="flex items-center justify-between text-[#4b5259]">
        <span>{t("sum")} {daysText} {t("dayres")} :</span>
        <div className="flex items-center gap-2">
          {totalOld > total && <span className="text-xs text-[#A7A7A7] line-through">{formatNum(totalOld)}</span>}
          <span>{formatNum(total)}</span>
          {!!currencyLabel && <span>{currencyLabel}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- buttons ---------------- */

export function SingleCarButtons({
  car,
  carDates,
  deliveryTime,
  returnTime,
  reserveOnClick,
  noDateMode = false,
  forceWhatsappNoDate = false,
  localRange,
  localDeliveryTime,
  localReturnTime,
  onNoDateReserveConfirm,
  onNoDateClear,
  hasSavedLocal = false,
}: {
  car: any;
  carDates: [string | null, string | null] | null;
  deliveryTime: string | null;
  returnTime: string | null;
  reserveOnClick: () => void;
  noDateMode?: boolean;
  forceWhatsappNoDate?: boolean;
  localRange?: PickerRange;
  localDeliveryTime?: string;
  localReturnTime?: string;
  onNoDateReserveConfirm?: (v: { start: Date; end: Date; deliveryTime: string; returnTime: string }) => void;
  onNoDateClear?: () => void;
  hasSavedLocal?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const loc = useMemo(() => String(locale || "en").toLowerCase().split("-")[0], [locale]);

  const carId = useMemo(() => {
    const v = car?.id ?? car?.car_id ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [car]);

  const carUrl = useMemo(() => {
    if (!carId) return "https://palmrentcar.com";
    if (loc === "fa") return `https://palmrentcar.com/cars/${carId}`;
    return `https://palmrentcar.com/${loc}/cars/${carId}`;
  }, [carId, loc]);

  const city = useMemo(() => (loc === "fa" ? "دبی" : "Dubai"), [loc]);
  const hasDates = !!(carDates?.[0] && carDates?.[1]) && !forceWhatsappNoDate;

  const days = useMemo(() => {
    if (!hasDates) return 0;
    try { return calcDaysWithGraceSafe({ carDates, deliveryTime, returnTime }); }
    catch { return 0; }
  }, [hasDates, carDates, deliveryTime, returnTime]);

  const whatsappText = useMemo(() => {
    const carTitle = String(car?.title || car?.name || "");
    if (!hasDates) return t("whatsappMessage.reserve", { car: carTitle, city, url: carUrl });
    return t("whatsappMessage.reserveWithDate", {
      car: carTitle, city, url: carUrl,
      from: String(carDates![0] || ""), to: String(carDates![1] || ""),
      dt: normalizeTime(deliveryTime) || "10:00", rt: normalizeTime(returnTime) || "10:00",
      days: String(days || ""),
    });
  }, [t, car, hasDates, carDates, deliveryTime, returnTime, city, carUrl, days]);

  const whatsappHref = useMemo(() => `https://wa.me/971556061134?text=${encodeURIComponent(whatsappText)}`, [whatsappText]);

  if (noDateMode) {
    return (
      <div className="flex w-full gap-2" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <DateRangePickerPopover
          initialRange={localRange ?? EMPTY_RANGE}
          defaultIsJalali={true}
          initialTimes={{ deliveryTime: String(localDeliveryTime || "10:00"), returnTime: String(localReturnTime || "10:00") }}
          noDefaultSelectionOnFirstOpen={!hasSavedLocal}
          onConfirm={(v) => onNoDateReserveConfirm?.(v)}
          onClear={onNoDateClear}
          trigger={
            <button type="button" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0077db] py-1 text-base font-bold text-white">
              رزرو آنلاین
            </button>
          }
        />
        <Link
          href={whatsappHref}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          className="flex w-fit cursor-pointer items-center justify-center gap-2 text-nowrap rounded-xl border border-[#10B98180] bg-[#10B9811A] px-2 py-1 text-[#10B981]"
        >
          <IconWhatsapp className={undefined} />
          {t("whatsapp")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); reserveOnClick(); }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0077db] py-1 text-base font-bold text-white"
      >
        {t("chooseCar")}
      </button>
      <Link
        href={whatsappHref}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        className="flex w-fit cursor-pointer items-center justify-center gap-2 text-nowrap rounded-xl border border-[#10B98180] bg-[#10B9811A] px-2 py-1 text-[#10B981]"
      >
        <IconWhatsapp className={undefined} />
        {t("whatsapp")}
      </Link>
    </div>
  );
}