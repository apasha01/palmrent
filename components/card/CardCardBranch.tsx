/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { ChevronLeft, ArrowRight, InfinityIcon } from "lucide-react";

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

import {
  capitalizeWords,
  toFaDigits as toFaDigitsHelper,
} from "@/helpers/helper";
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

  const deposit = car?.deposit ?? car?.deposit_val ?? null;
  if (deposit === "yes") {
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

  if (onImage) {
    return (
      <div
        className="absolute top-2 start-2 z-20 max-w-[calc(100%-16px)] pointer-events-none"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div className="flex flex-wrap gap-2 max-[380px]:gap-1 text-[10px] text-nowrap pointer-events-auto">
          {hasRawBadges
            ? rawBadges.map((badge) => {
                const drawerConfig = getRawBadgeDrawerConfig(
                  badge.key,
                  dataSource,
                  currency,
                );

                const isNoDeposit = badge.key === "noDeposit";

                return (
                  <div
                    key={badge.key}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative shrink-0 rounded-full border border-white px-3 py-2 font-bold transition-all hover:scale-[105%] sm:px-2 sm:py-1 max-[405px]:px-2 max-[405px]:text-[9px] ${
                      isNoDeposit
                        ? "border-[#eafaee] bg-[#eafaee]"
                        : "bg-[#e2e6e9]"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        isNoDeposit ? "text-[#1e7b33]" : "text-[#4b5259]"
                      }`}
                    >
                      {t(badge.label)}

                      <AppDrawer
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
                            className="inline-flex items-center justify-center"
                            aria-label="نمایش توضیحات"
                          >
                            <IconInfoCircle />
                          </button>
                        )}
                      />
                    </span>
                  </div>
                );
              })
            : rawOptions.map((item: any, index: number) => {
                if (!optionList?.[item]) return null;

                const optionTitle = String(optionList[item]?.title || "");
                const optionDescription =
                  optionList[item]?.description ||
                  optionList[item]?.desc ||
                  "";
                const optionId = Number(item);
                const isNoDeposit = optionTitle === "noDeposite";

                return (
                  <div
                    key={index}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative shrink-0 rounded-full border border-white px-3 py-2 font-bold transition-all hover:scale-[105%] sm:px-2 sm:py-1 max-[405px]:px-2 max-[405px]:text-[9px] ${
                      isNoDeposit
                        ? "border-[#eafaee] bg-[#eafaee]"
                        : "bg-[#e2e6e9]"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        isNoDeposit ? "text-[#1e7b33]" : "text-[#4b5259]"
                      }`}
                    >
                      {t(optionTitle)}

                      <AppDrawer
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
                            className="inline-flex items-center justify-center"
                            aria-label="نمایش توضیحات آپشن"
                          >
                            <IconInfoCircle />
                          </button>
                        )}
                      />
                    </span>
                  </div>
                );
              })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex min-h-[26px] flex-wrap items-start gap-1.5 text-[10px]">
      {hasRawBadges
        ? rawBadges.map((badge) => {
            const drawerConfig = getRawBadgeDrawerConfig(
              badge.key,
              dataSource,
              currency,
            );

            return (
              <div
                key={badge.key}
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[#ecfdf5] px-2 py-1 text-[#059669]"
              >
                <AppDrawer
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
                      className="flex items-center justify-center"
                      aria-label="نمایش توضیحات"
                    >
                      <IconInfoCircle />
                    </button>
                  )}
                />
                <span>{t(badge.label)}</span>
              </div>
            );
          })
        : rawOptions.map((item: any, index: number) => {
            if (!optionList?.[item]) return null;

            const optionTitle = String(optionList[item]?.title || "");
            const optionDescription =
              optionList[item]?.description || optionList[item]?.desc || "";
            const optionId = Number(item);

            return (
              <div
                key={index}
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[#ecfdf5] px-2 py-1 text-[#059669]"
              >
                <AppDrawer
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
                      className="flex items-center justify-center"
                      aria-label="نمایش توضیحات آپشن"
                    >
                      <IconInfoCircle />
                    </button>
                  )}
                />
                <span>{t(optionTitle)}</span>
              </div>
            );
          })}
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
      const from = toEnDigits(fromFa);
      const to = toEnDigits(toFa);
      const dt = toEnDigits(normalizeTime(args.dt ?? deliveryTime) || "10:00");
      const rt = toEnDigits(normalizeTime(args.rt ?? returnTime) || "10:00");

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
            className="absolute bottom-2 end-2 z-20"
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
              ? toFaDigitsHelper(capitalizeWords((car as any).title))
              : capitalizeWords((car as any).title)}
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
  const router = useRouter();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0
      ? imageList
      : ["/images/placeholder.png"];

  const goCar = useCallback(
    (e?: React.MouseEvent | React.MouseEvent<HTMLDivElement>) => {
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
    <div className="relative z-10 flex h-[220px] w-full overflow-hidden rounded-lg lg:h-[220px]">
      {!firstImageLoaded && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-lg bg-gray-200" />
      )}

      <div className="hide-scrollbar flex h-full w-full max-md:z-10 max-md:overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="top-0 right-0 h-full w-full rounded-lg max-md:flex max-md:gap-2 md:absolute md:-z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {safeImageList.map((src: any, index: number) => (
            <Image
              key={`${String(src)}-${index}`}
              className={`
                md:rounded-lg
                max-md:first:rounded-r-lg max-md:last-of-type:rounded-l-lg
                max-md:shrink-0 max-md:w-[calc(100vw-80px)] max-md:snap-center
                h-full w-full cursor-pointer object-cover md:absolute
                ${
                  index === activeImageIndex
                    ? "md:z-10 md:opacity-100"
                    : "md:opacity-0"
                }
                md:transition-opacity md:duration-200 md:ease-out
              `}
              src={toStorageUrl(src)}
              width={395}
              height={253}
              alt={`Car image ${index + 1}`}
              loading="eager"
              onClick={goCar}
              onLoad={index === 0 ? () => setFirstImageLoaded(true) : undefined}
              onError={
                index === 0 ? () => setFirstImageLoaded(true) : undefined
              }
            />
          ))}

          {safeImageList.length > 1 && (
            <div className="relative flex flex-col items-center justify-center gap-2 px-4 font-bold text-black text-nowrap md:hidden">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#F1F1F1]">
                <ChevronLeft className="size-4" />
              </span>
              {t("moredetail")}
            </div>
          )}

          <div
            className={`${
              activeImageIndex === safeImageList.length - 1 ? "z-10" : ""
            } h-full w-full rounded-lg max-md:hidden md:absolute`}
            onClick={goCar}
          >
            <div
              className={`absolute flex h-full w-full flex-col items-center justify-center rounded-lg bg-[#000000aa] text-white md:transition-opacity md:duration-200 md:ease-out ${
                activeImageIndex === safeImageList.length - 1 ? "z-20" : ""
              }`}
            >
              <span className="flex size-16 items-center justify-center rounded-full border-2 border-white">
                <ArrowRight className="size-6" />
              </span>
              {t("moredetail")}
            </div>

            <Image
              className={`h-full w-full rounded-lg object-cover md:absolute ${
                activeImageIndex === safeImageList.length - 1 ? "z-10" : ""
              }`}
              src={toStorageUrl(safeImageList[safeImageList.length - 1])}
              width={395}
              height={253}
              alt="Car image last"
            />
          </div>
        </div>

        <div className="z-20">{children}</div>

        <div
          className="absolute hidden h-full w-full cursor-pointer flex-row-reverse items-end p-2 opacity-0 transition-all hover:opacity-100 md:flex"
          onMouseLeave={() => setActiveImageIndex(0)}
        >
          {safeImageList.map((_: any, index: number) => (
            <div
              key={index}
              onMouseEnter={() => setActiveImageIndex(index)}
              onClick={goCar}
              className="group flex h-full w-full items-end px-1"
            >
              <span className="h-1 w-full rounded-2xl bg-[#00000070] transition-all group-hover:bg-white" />
            </div>
          ))}
        </div>
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
          {toFaDigitsHelper(car.baggage ?? car.suitcase ?? 0) || 0}{" "}
          {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconPerson />
        </span>
        <span className="text-xs">
          {toFaDigitsHelper(car.passengers ?? car.person ?? 0) || 0}{" "}
          {t("people")}
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
    <div className="mb-4 flex flex-col gap-2 border-[#0000001f]">
      {pricesArray.map((row: any, idx: number) => {
        const rangeRaw = String(row?.range ?? "").trim();
        const rangeText = formatRangeLabel(rangeRaw);

        const daily = Number(row?.final_price ?? row?.currentPrice ?? 0) || 0;
        const dailyOld =
          Number(row?.base_price ?? row?.previousPrice ?? 0) || 0;

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
              <span className="font-bold text-[#3B82F6]">
                {formatNum(daily)}
              </span>
              {!!currencyLabel && <span>{currencyLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}