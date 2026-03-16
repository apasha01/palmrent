/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { ChevronLeft, ArrowRight, ChevronDown } from "lucide-react";

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
import {
  AppDrawer,
  type AppDrawerData,
  type AppDrawerKind,
} from "@/components/common/AppDrawer";

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { useRouter } from "next/navigation";

/* ---------------- helpers ---------------- */

const toStorageUrl = (p: unknown) => {
  if (!p) return "";
  if (
    typeof p === "string" &&
    (p.startsWith("http://") || p.startsWith("https://"))
  ) {
    return p;
  }
  return `${STORAGE_URL}${String(p)}`;
};

const normalizeImages = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return (input as unknown[]).filter(Boolean).map(String);
  }
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

type PickerRange = NonNullable<
  React.ComponentProps<typeof DateRangePickerPopover>["initialRange"]
>;

const EMPTY_RANGE: PickerRange = { start: null, end: null };

function getCarIdSafe(car: any, data: any): number {
  const v = car?.id ?? car?.car_id ?? data?.id ?? data?.car_id ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildBadgesFromRaw(car: any): Array<{
  key: string;
  label: string;
  type: "noDeposit" | "default";
}> {
  const badges: Array<{
    key: string;
    label: string;
    type: "noDeposit" | "default";
  }> = [];

  // بدون دپوزیت = وقتی deposit برابر "no" یا null یا خالی است
  const deposit = car?.deposit ?? car?.deposit_val ?? null;
  if (!deposit || deposit === "no") {
    badges.push({
      key: "noDeposit",
      label: "noDeposite",
      type: "noDeposit",
    });
  }

  const km = car?.km ?? car?.km_val ?? null;
  if (km === "yes") {
    badges.push({
      key: "freeKm",
      label: "unlimitedKilometers",
      type: "default",
    });
  }

  const insurance = car?.insurance ?? car?.insurance_val ?? null;
  if (insurance === "yes") {
    badges.push({
      key: "insurance",
      label: "freeinsurance",
      type: "default",
    });
  }

  const freeDelivery = car?.free_delivery ?? null;
  if (freeDelivery === "yes") {
    badges.push({
      key: "freeDelivery",
      label: "freeDelivery",
      type: "default",
    });
  }

  return badges;
}

function getRawBadgeDrawerConfig(
  badgeKey: string,
  car: any,
  currency: string,
): {
  kind: AppDrawerKind;
  data: AppDrawerData;
} {
  switch (badgeKey) {
    case "noDeposit":
      return {
        kind: "no_deposit",
        data: {
          currency,
          deposit: car?.deposit_amount ?? car?.deposit_value ?? 0,
        },
      };

    case "freeKm":
      return {
        kind: "km",
        data: {
          km: "yes",
        },
      };

    case "insurance":
      return {
        kind: "insurance",
        data: {
          insurance: "yes",
        },
      };

    case "freeDelivery":
      return {
        kind: "delivery",
        data: {
          free_delivery: "yes",
        },
      };

    default:
      return {
        kind: "extra_option",
        data: {
          optionTitle: "جزئیات",
          optionDescriptionFromApi:
            "برای این مورد توضیحی ثبت نشده است. برای اطلاعات بیشتر با پشتیبانی هماهنگ کنید.",
        },
      };
  }
}

/* ---------------- badge renderer ---------------- */

function BranchCarBadges({
  rawBadges,
  rawOptions,
  optionList,
  dataSource,
  currency,
  t,
  onImage = false,
}: {
  rawBadges: Array<{
    key: string;
    label: string;
    type: "noDeposit" | "default";
  }>;
  rawOptions: any[];
  optionList: any;
  dataSource: any;
  currency: string;
  t: any;
  onImage?: boolean;
}) {
  const hasRawBadges = rawBadges.length > 0;

  if (!hasRawBadges && (!rawOptions || rawOptions.length === 0)) return null;

  const badgeCount = hasRawBadges ? rawBadges.length : rawOptions.length;

  const sizeClass = (() => {
    if (onImage) {
      if (badgeCount <= 2) {
        return {
          badge: "px-3 py-2 text-[10px] sm:px-2.5 sm:py-1.5",
          icon: "size-3.5",
          gap: "gap-2",
          innerGap: "gap-1",
        };
      }
      if (badgeCount === 3) {
        return {
          badge: "px-2.5 py-1.5 text-[9.5px] sm:px-2 sm:py-1",
          icon: "size-3.5",
          gap: "gap-1.5",
          innerGap: "gap-[5px]",
        };
      }
      if (badgeCount === 4) {
        return {
          badge: "px-2 py-1.5 text-[9px] sm:px-1.5 sm:py-1",
          icon: "size-3",
          gap: "gap-1",
          innerGap: "gap-[4px]",
        };
      }
      return {
        badge: "px-2 py-1 text-[8.5px] sm:px-1.5 sm:py-1",
        icon: "size-3",
        gap: "gap-1",
        innerGap: "gap-[4px]",
      };
    }

    if (badgeCount <= 2) {
      return {
        badge: "px-2.5 py-1 text-xs",
        icon: "size-4",
        gap: "gap-1.5",
        innerGap: "gap-1",
      };
    }
    if (badgeCount === 3) {
      return {
        badge: "px-2 py-1 text-[11px]",
        icon: "size-3.5",
        gap: "gap-1.5",
        innerGap: "gap-[5px]",
      };
    }
    if (badgeCount === 4) {
      return {
        badge: "px-1 py-1 text-[9px]",
        icon: "size-3",
        gap: "gap-1",
        innerGap: "gap-[2px]",
      };
    }
    return {
      badge: "px-1.5 py-1 text-[10px]",
      icon: "size-3",
      gap: "gap-1",
      innerGap: "gap-[4px]",
    };
  })();

  const wrapperClass = [
    "flex w-full items-center overflow-x-auto overflow-y-hidden whitespace-nowrap",
    "hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    onImage ? "max-w-full" : "",
    sizeClass.gap,
  ].join(" ");

  const getBadgeClass = (isNoDeposit: boolean) => {
    if (onImage) {
      return [
        "shrink-0 inline-flex items-center justify-center rounded-full border font-bold transition-all",
        "max-w-max",
        "appearance-none outline-none ring-0 shadow-none",
        "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0",
        sizeClass.badge,
        isNoDeposit
          ? "border-[#eafaee] bg-[#eafaee] text-[#1e7b33]"
          : "border-white bg-[#e2e6e9] text-[#4b5259]",
      ].join(" ");
    }

    return [
      "shrink-0 inline-flex items-center justify-center rounded-full font-bold transition-all",
      "max-w-max",
      "appearance-none outline-none ring-0 shadow-none border-0",
      "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0",
      sizeClass.badge,
      isNoDeposit
        ? "bg-[#ecfdf5] text-[#059669]"
        : "bg-[#ecfdf5] text-[#059669]",
    ].join(" ");
  };

  const contentClass = [
    "inline-flex items-center whitespace-nowrap leading-none",
    sizeClass.innerGap,
  ].join(" ");

  const renderRawBadge = (badge: {
    key: string;
    label: string;
    type: "noDeposit" | "default";
  }) => {
    const drawerConfig = getRawBadgeDrawerConfig(
      badge.key,
      dataSource,
      currency,
    );

    const isNoDeposit = badge.key === "noDeposit";

    return (
      <AppDrawer
        key={badge.key}
        kind={drawerConfig.kind}
        data={drawerConfig.data}
        trigger={({ open }) => (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              open();
            }}
            className={getBadgeClass(isNoDeposit)}
            aria-label={String(t(badge.label))}
          >
            <span className={contentClass}>
              <span
                className={`inline-flex shrink-0 items-center justify-center ${sizeClass.icon}`}
              >
                <IconInfoCircle />
              </span>

              <span className="whitespace-nowrap leading-none">
                {t(badge.label)}
              </span>
            </span>
          </button>
        )}
      />
    );
  };

  const renderOptionBadge = (item: any, index: number) => {
    if (!optionList?.[item]) return null;

    const optionTitle = String(optionList[item]?.title || "");
    const optionDescription =
      optionList[item]?.description || optionList[item]?.desc || "";
    const optionId = Number(item);
    const isNoDeposit = optionTitle === "noDeposite";

    return (
      <AppDrawer
        key={`${item}-${index}`}
        kind="extra_option"
        data={{
          optionId,
          optionTitle: t(optionTitle),
          optionDescriptionFromApi: optionDescription
            ? t(optionDescription)
            : "",
        }}
        trigger={({ open }) => (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              open();
            }}
            className={getBadgeClass(isNoDeposit)}
            aria-label={String(t(optionTitle))}
          >
            <span className={contentClass}>
              <span
                className={`inline-flex shrink-0 items-center justify-center ${sizeClass.icon}`}
              >
                <IconInfoCircle />
              </span>

              <span className="whitespace-nowrap leading-none">
                {t(optionTitle)}
              </span>
            </span>
          </button>
        )}
      />
    );
  };

if (onImage) {
  return (
    <div
      className="absolute top-2 start-2 z-20 w-[calc(100%-16px)]"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
    >
      <div className={`${wrapperClass} pointer-events-auto`}>
        {hasRawBadges
          ? rawBadges.map(renderRawBadge)
          : rawOptions.map(renderOptionBadge)}
      </div>
    </div>
  );
}
  return (
    <div className="mb-3 min-h-[26px] w-full">
      <div className={wrapperClass}>
        {hasRawBadges
          ? rawBadges.map(renderRawBadge)
          : rawOptions.map(renderOptionBadge)}
      </div>
    </div>
  );
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
  badgesOnImage = false,
  // ─── پراپ جدید: اگر true باشد، قیمت‌ها با اکاردئون (۲ تا نشان داده می‌شود) ───
  accordionPriceList = false,
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
  badgesOnImage?: boolean;
  /** اگر true باشد فقط ۲ قیمت اول نشان داده می‌شود و بقیه در اکاردئون پنهان می‌شوند */
  accordionPriceList?: boolean;
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

  const discountPercent = useMemo(() => {
    const raw =
      data?.off ??
      data?.discountPercent ??
      data?.discount ??
      car?.off ??
      car?.discountPercent ??
      car?.discount ??
      0;

    return Number(raw) || 0;
  }, [data, car]);

  const rawBadges = useMemo(() => buildBadgesFromRaw(data ?? car), [data, car]);

  const rawOptions = useMemo(
    () => (((car as any).rawOptions || (car as any).options || []) as any[]),
    [car],
  );

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
    (v: {
      start: Date;
      end: Date;
      deliveryTime: string;
      returnTime: string;
    }) => {
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
  const setDeliveryTimeStore2 = useSearchPageStore(
    (s: any) => s.setDeliveryTime,
  );
  const setReturnTimeStore2 = useSearchPageStore((s: any) => s.setReturnTime);
  const setIsAnySheetOpen = useSearchPageStore(
    (s: any) => s.setIsAnySheetOpen,
  );

  const hydrateReserveStore = useCallback(
    (args: {
      branchId: number;
      carId: number;
      from: string;
      to: string;
      dt: string;
      rt: string;
    }) => {
      setSelectedCarId(args.carId);
      setBranchIdStore(args.branchId);
      setCarDatesStore([args.from, args.to]);
      setDeliveryTimeStore2(args.dt);
      setReturnTimeStore2(args.rt);
      setRoadMapStep(3);

      if (typeof setIsAnySheetOpen === "function") {
        setIsAnySheetOpen(true);
      }
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
          if (typeof setIsAnySheetOpen === "function") {
            setIsAnySheetOpen(false);
          }
        },
      });
    },
    [openSheet, setRoadMapStep, setIsAnySheetOpen],
  );

  const goReserve = useCallback(
    (args: {
      start?: Date | null;
      end?: Date | null;
      dt?: string | null;
      rt?: string | null;
    }) => {
      const carId = getCarIdSafe(car, data);
      const bId = Number(branchId || 0);
      const safeBranchId = Number.isFinite(bId) && bId > 0 ? bId : 0;
      if (!carId || !safeBranchId) return;

      const safeStart = args.start ?? range?.start ?? null;
      const safeEnd = args.end ?? range?.end ?? null;
      if (!safeStart || !safeEnd) return;

      const fromFa = formatJalaliDate(safeStart);
      const toFa = formatJalaliDate(safeEnd);
      const from = (fromFa);
      const to = (toFa);
      const dt = (normalizeTime(args.dt ?? deliveryTime) || "10:00");
      const rt = (normalizeTime(args.rt ?? returnTime) || "10:00");

      if (!from || !to || !dt || !rt) return;

      const payload = { branchId: safeBranchId, carId, from, to, dt, rt };
      const hydrateKey = [safeBranchId, carId, from, to, dt, rt].join("|");

      hydrateReserveStore(payload);

      const params = buildReserveSearchParams(payload);
      const reserveUrl = `/reserve?${params.toString()}`;
      const searchUrl = `${pathname}?${params.toString()}`;

      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 768;

      if (isMobile) {
        router.replace(searchUrl, { scroll: false });
        openReserveSheetMobile(hydrateKey);
        return;
      }

      router.push(reserveUrl, { scroll: true });
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
      openReserveSheetMobile,
    ],
  );

  if (!car) return null;
  if (!calendarHydrated) return null;

  return (
    <div
      className={`${isHovering ? "z-10" : ""} flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#0000001f] bg-white p-2.5 shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] transition-all max-md:pl-0 md:text-sm text-xs`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <SingleCarGallery imageList={images} carHref={carHref}>
        {badgesOnImage && (
          <BranchCarBadges
            rawBadges={rawBadges}
            rawOptions={rawOptions}
            optionList={optionList}
            dataSource={data ?? car}
            currency={currency}
            t={t}
            onImage
          />
        )}

        {discountPercent > 0 && (
          <div
            className="absolute bottom-2 end-2 z-20 pointer-events-auto"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            <div className="flex items-center gap-1 rounded-lg bg-[#e1ff00] px-2.5 py-1.5 text-[#3b3d40] opacity-85">
              <IconDiscount size="20" />
              {discountPercent}% {t("discount")}
            </div>
          </div>
        )}
      </SingleCarGallery>

      <div className="flex flex-col pl-2.5">
        <div className="flex items-center justify-between">
          <span className="size-6 text-[#333333]" role="button" tabIndex={0}>
            <IconHeart active={undefined} />
          </span>

          <div className="my-2 text-left text-lg font-bold">
            {locale === "fa"
              ? (((car as any).title))
              : ((car as any).title)}
          </div>
        </div>

        <SingleCarOptions car={car} />

        {!badgesOnImage && (
          <BranchCarBadges
            rawBadges={rawBadges}
            rawOptions={rawOptions}
            optionList={optionList}
            dataSource={data ?? car}
            currency={currency}
            t={t}
          />
        )}

        <SingleCarPriceList
          priceList={
            (car as any).priceList ||
            (car as any).dailyPrices ||
            (car as any).prices
          }
          defaultPrice={(car as any).price ?? (car as any).min_price_f ?? 0}
          oldPrice={(car as any).oldPrice ?? 0}
          carDates={carDates}
          deliveryTime={deliveryTimeStore}
          returnTime={returnTimeStore}
          currency={currency || ""}
          rateToRial={rateToRial}
          // ─── پراپ جدید به SingleCarPriceList پاس داده می‌شود ───
          accordionPriceList={accordionPriceList}
        />

        {!noBtn && (
          <div
            className="mt-auto flex w-full gap-2"
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
                goReserve({
                  start: v.start,
                  end: v.end,
                  dt: v.deliveryTime,
                  rt: v.returnTime,
                });
              }}
              onClear={clearSharedSelection}
              trigger={
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0077db] py-1 text-base font-bold text-white"
                >
                  رزرو آنلاین
                </button>
              }
            />

            <Link
              href={(() => {
                const loc = String(locale || "en")
                  .toLowerCase()
                  .split("-")[0];

                const carId = getCarIdSafe(car, data);

                const url =
                  carId > 0
                    ? loc === "fa"
                      ? `https://palmrentcar.com/cars/${carId}`
                      : `https://palmrentcar.com/${loc}/cars/${carId}`
                    : "https://palmrentcar.com";

                const city = loc === "fa" ? "دبی" : "Dubai";
                const hasDates =
                  !forceWhatsappNoDate && !!(carDates?.[0] && carDates?.[1]);

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

                return `https://wa.me/971556061134?text=${encodeURIComponent(
                  message,
                )}`;
              })()}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex w-fit cursor-pointer items-center justify-center gap-2 text-nowrap rounded-xl border border-[#10B98180] bg-[#10B9811A] px-2 py-1 text-[#10B981]"
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
  imageList?: any[];
  carHref?: string;
}) {
  const t = useTranslations();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0
      ? imageList
      : ["/images/placeholder.png"];

  return (
    /*
      outer div: relative container — Link فقط تصاویر را پوشش می‌دهد.
      children (badges / drawer) خارج از Link هستند تا overlay drawer
      بتواند بدون تداخل با navigate، drawer را ببندد.
    */
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
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                animation: "shimmer-slide 1.6s infinite",
              }}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg
                className="size-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h2l2-3h10l2 3h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
                />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <div className="h-2.5 w-24 rounded-full bg-gray-300" />
            </div>
          </div>
        </>
      )}

      {/* ─── Link: فقط ناحیه تصاویر را navigate می‌کند ─── */}
      <Link
        href={carHref || "#"}
        className="absolute inset-0 z-10 cursor-pointer max-md:overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
            <div className="relative z-20 flex md:hidden flex-col items-center justify-center gap-2 px-4 font-bold text-black text-nowrap">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#F1F1F1]">
                <ChevronLeft className="size-4" />
              </span>
              {t("moredetail")}
            </div>
          )}

          {/* لایه نمایش more detail در دسکتاپ */}
          <div
            className={`${
              activeImageIndex === safeImageList.length - 1 ? "z-10" : "pointer-events-none"
            } rounded-lg w-full h-full max-md:hidden md:absolute`}
          >
            <div
              className={`absolute w-full h-full rounded-lg ${
                activeImageIndex === safeImageList.length - 1 ? "z-20" : ""
              } bg-[#000000aa] text-white flex flex-col items-center justify-center md:transition-opacity md:duration-200 md:ease-out`}
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

        {/* ─── hover zones برای دسکتاپ ─── */}
        <div
          className="absolute w-full h-full md:flex items-end flex-row-reverse p-2 cursor-pointer transition-all opacity-0 hover:opacity-100 hidden z-20"
          onMouseLeave={() => setActiveImageIndex(0)}
          onClick={(e) => e.stopPropagation()}
        >
          {safeImageList.map((_: any, index: number) => (
            <div
              key={index}
              onMouseEnter={() => setActiveImageIndex(index)}
              className="w-full h-full flex items-end group px-1"
            >
              <span className="w-full h-1 rounded-2xl bg-[#00000070] group-hover:bg-white transition-all" />
            </div>
          ))}
        </div>
      </Link>

      {/*
        ─── children (badges / AppDrawer) کاملاً خارج از Link هستند ───
        این باعث می‌شود overlay drawer بتواند بدون تداخل با Link بسته شود.
        z-20 > z-10 (Link) تا badge روی عکس قرار بگیرد.
      */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

/* ---------------- options ---------------- */

export function SingleCarOptions({
  car,
  bigFont = false,
}: {
  car: any;
  bigFont?: boolean;
}) {
  const t = useTranslations();

  if (!car) return null;

  const textSize = bigFont
    ? "xl:text-base sm:text-sm text-xs"
    : "text-[10px] sm:text-xs";

  const fuel = car.fuel || car.gasType || "Petrol";
  const gearboxKey = String(car.gearbox || car.gearBox || "").toLowerCase();
  const gearbox =
    gearboxKey.includes("auto") || gearboxKey.includes("اتوماتیک")
      ? "automatic"
      : "geared";

  return (
    <div
      className={`mt-1 mb-2 grid grid-cols-4 gap-1 border-y p-2 text-[#787878] text-nowrap ${textSize}`}
    >
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconGas />
        </span>
        <span className="text-xs">
          {t(String(fuel === "بنزین" ? "petrol" : fuel).toLowerCase())}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconGearBox />
        </span>
        <span className="text-xs">{t(gearbox)}</span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconBag />
        </span>
        <span className="text-xs">
          {(car.baggage ?? car.suitcase ?? 0) || 0}{" "}
          {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconPerson />
        </span>
        <span className="text-xs">
          {(car.passengers ?? car.person ?? 0) || 0}{" "}
          {t("people")}
        </span>
      </div>
    </div>
  );
}

/* ---------------- price list (با اکاردئون اختیاری) ---------------- */

export function SingleCarPriceList({
  priceList,
  currency,
  // ─── پراپ جدید: کنترل رفتار اکاردئون ───
  accordionPriceList = false,
}: {
  priceList: any;
  defaultPrice?: number | null;
  oldPrice?: number | null;
  carDates: [string | null, string | null] | null;
  deliveryTime: string | null;
  returnTime: string | null;
  currency: string;
  rateToRial?: number | null;
  /**
   * اگر true باشد: فقط ۲ قیمت اول نمایش داده می‌شود و بقیه در اکاردئون پنهان می‌شوند
   * اگر false باشد (پیش‌فرض): تمام قیمت‌ها به‌صورت کامل نمایش داده می‌شوند
   */
  accordionPriceList?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();

  // ─── state اکاردئون (فقط زمانی که accordionPriceList=true استفاده می‌شود) ───
  const [expanded, setExpanded] = useState(false);

  const numberFmt = useMemo(() => {
    if (locale === "fa") return new Intl.NumberFormat("fa-IR");
    if (locale === "ar") return new Intl.NumberFormat("ar");
    if (locale === "tr") return new Intl.NumberFormat("tr-TR");
    return new Intl.NumberFormat("en-US");
  }, [locale]);

  const formatNum = useCallback(
    (n: number) => numberFmt.format(Math.round(Number(n) || 0)),
    [numberFmt],
  );

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

      if (b >= 9999) {
        if (locale === "fa") {
          return (
            <span className="inline-flex items-center gap-1">
              <span>بیشتر از</span>
              <span>{aTxt}</span>
              <span>روز</span>
            </span>
          );
        }
        if (locale === "ar") {
          return (
            <span className="inline-flex items-center gap-1">
              <span>أكثر من</span>
              <span>{aTxt}</span>
              <span>يوم</span>
            </span>
          );
        }
        if (locale === "tr") {
          return (
            <span className="inline-flex items-center gap-1">
              <span>{aTxt}</span>
              <span>günden fazla</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1">
            <span>More than</span>
            <span>{aTxt}</span>
            <span>days</span>
          </span>
        );
      }

      const bTxt = numberFmt.format(b);
      if (locale === "fa") return `${aTxt} تا ${bTxt} روز`;
      if (locale === "ar") return `${aTxt} إلى ${bTxt} يوم`;
      if (locale === "tr") return `${aTxt} - ${bTxt} gün`;
      return `${aTxt} to ${bTxt} days`;
    },
    [locale, numberFmt],
  );

  if (!pricesArray.length) return null;

  const renderRow = (row: any, idx: number) => {
    const rangeRaw = String(row?.range ?? "").trim();
    const rangeText = formatRangeLabel(rangeRaw);
    const daily = Number(row?.final_price ?? row?.currentPrice ?? 0) || 0;
    const dailyOld = Number(row?.base_price ?? row?.previousPrice ?? 0) || 0;

    return (
      <div
        key={`${rangeRaw || "range"}-${idx}`}
        className="flex items-center justify-between text-sm font-bold"
      >
        <span className="text-[#4b5259]">{rangeText} :</span>
        <div className="flex gap-2">
          {dailyOld > daily && (
            <span className="text-[#A7A7A7] line-through">
              {formatNum(dailyOld)}
            </span>
          )}
          <span className="font-bold text-[#3B82F6]">{formatNum(daily)}</span>
          {!!currencyLabel && <span>{currencyLabel}</span>}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════
     حالت بدون اکاردئون: همه قیمت‌ها نمایش داده می‌شوند
     ══════════════════════════════════════════════════ */
  if (!accordionPriceList) {
    return (
      <div className="mb-4 flex flex-col gap-2 border-[#0000001f]">
        {pricesArray.map((row, idx) => renderRow(row, idx))}
      </div>
    );
  }

  /* ═══════════════��══════════════════════════════════
     حالت اکاردئون: ۲ ردیف اول + بقیه در اکاردئون
     ══════════════════════════════════════════════════ */
  const ALWAYS_VISIBLE = 2;
  const visibleRows = pricesArray.slice(0, ALWAYS_VISIBLE);
  const hiddenRows = pricesArray.slice(ALWAYS_VISIBLE);
  const hasMore = hiddenRows.length > 0;

  return (
    <div className="mb-4 flex flex-col gap-2 border-[#0000001f]">
      {/* ─── ۲ ردیف اول (همیشه نمایش) ─── */}
      {visibleRows.map((row, idx) => renderRow(row, idx))}

      {/* ─── اکاردئون (فقط اگر بیشتر از ۲ ردیف وجود داشته باشد) ─── */}
      {hasMore && (
        <>
          {/* ─── محتوای پنهان با انیمیشن CSS grid ─── */}
          <div
            className={`
              grid transition-[grid-template-rows] duration-300 ease-in-out
              ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
            `}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-2 pt-1">
                {hiddenRows.map((row, idx) =>
                  renderRow(row, ALWAYS_VISIBLE + idx),
                )}
              </div>
            </div>
          </div>

          {/* ─── دکمه toggle اکاردئون ─── */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="
              mx-auto border p-1 w-full rounded-md justify-center flex items-center gap-1.5
              text-xs font-medium text-[#757678]
              transition-opacity hover:opacity-70
            "
          >
            <span>
              {expanded
                ? locale === "fa"
                  ? "بستن"
                  : locale === "ar"
                    ? "إغلاق"
                    : locale === "tr"
                      ? "Kapat"
                      : "Close"
                : locale === "fa"
                  ? "نمایش قیمت‌های بیشتر"
                  : locale === "ar"
                    ? "عرض المزيد من الأسعار"
                    : locale === "tr"
                      ? "Daha fazla fiyat"
                      : "Show more prices"}
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-300 ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </>
      )}
    </div>
  );
}
