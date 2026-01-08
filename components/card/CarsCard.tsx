/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectCar } from "@/redux/slices/carListSlice";
import { changeRoadMapStep } from "@/redux/slices/globalSlice";
import { addReelItem, changeReelActive } from "@/redux/slices/reelsSlice";

import { adaptCarData } from "@/lib/adapters";
import { capitalizeWords } from "@/lib/capitalizeFirstLetter";
import { dateDifference } from "@/lib/getDateDiffrence";
import { getLangUrl } from "@/lib/getLangUrl";
import { STORAGE_URL } from "@/lib/apiClient";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

import { ArrowUpRight, ChevronLeft, Heart, Play } from "lucide-react";
import {
  IconBag,
  IconDiscount,
  IconGas,
  IconGearBox,
  IconInfoCircle,
  IconPerson,
  IconWhatsapp,
} from "../Icons";

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

export default function SingleCar({
  data,
  noBtn = false,
}: {
  data: any;
  noBtn?: boolean;
}) {
  const t = useTranslations();
  const dispatch = useDispatch();
    const locale = useLocale(); // ✅ اینو اضافه کن

  const optionList = useSelector((state: any) => state.carList.optionList);

  const car = adaptCarData(data);
  const [isHovering, setIsHovering] = useState(false);

  const { id, title, video, price } = car || {};
  const images = useMemo(() => normalizeImages(car?.images), [car?.images]);

  useEffect(() => {
    if (video) {
      const videoData = { id, title, video, price };
      dispatch(addReelItem(videoData));
    }
  }, [id, title, video, price, dispatch]);

  if (!car) return null;

  return (
    <Card
      className={`
        flex w-full flex-col cursor-pointer transition-all duration-300
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
        <SingleCarGallery imageList={images} hasVideo={!!car.video} noBtn={noBtn}>
          {/* ✅ Badges Overlay — بدون Tooltip، ثابت، بدون پرش */}
          <div className="absolute top-2 rtl:right-2 ltr:left-2 z-40 w-full flex flex-wrap gap-2 max-[380px]:gap-1 text-nowrap pointer-events-none">
            {car.rawOptions?.map((item: any, index: number) => {
              if (!optionList?.[item]) return null;
              const isNoDeposit = optionList[item].title === "noDeposite";

              return (
                <div
                  key={index}
                  className={`sm:py-1 py-2 sm:px-2 px-3 max-[405px]:px-2 max-[405px]:text-[9px] font-bold rounded-4xl border border-white ${
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

          {/* ✅ Discount Badge — ثابت */}
          {car.discountPercent > 0 && (
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none bg-[#e1ff00] py-1.5 px-2.5 text-[#3b3d40] opacity-85 rounded-lg flex items-center gap-1">
              <IconDiscount size="20" />
              {data.discount}% {t("discount")}
            </div>
          )}
        </SingleCarGallery>

        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mt-1.5 mb-2">
            <span className="size-5 text-[#888] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <Heart className="size-5" />
            </span>
 <h3 className="text-lg">
  {locale === "fa" ? toFaDigits(capitalizeWords(car.title)) : capitalizeWords(car.title)}
</h3>
          </div>

          <SingleCarOptions car={car} />

          <SingleCarPriceList
            priceList={car.priceList || car.dailyPrices}
            defaultPrice={car.price ?? 0}
            oldPrice={car.oldPrice ?? 0}
          />

          {!noBtn && <SingleCarButtons car={car} />}
        </div>
      </CardContent>
    </Card>
  );
}

export function SingleCarGallery({
  children,
  noBtn,
  imageList,
  hasVideo,
}: {
  children?: React.ReactNode;
  noBtn?: boolean;
  imageList?: any[];
  hasVideo?: boolean;
}) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"];

  const handleMouseMove = (index: number) => setActiveImageIndex(index);
  const handleMouseLeave = () => setActiveImageIndex(0);

  const openVideoReel = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(changeReelActive(true));
  };

  return (
    <div className="relative w-full z-10 overflow-hidden rounded-none md:rounded-lg group">
      {/* ✅ Mobile */}
      <div
        className="
          md:hidden flex w-full h-[230px]
          overflow-x-auto overflow-y-hidden flex-nowrap gap-2
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
            <div
              key={index}
              className={`
                shrink-0 h-full w-[85%]
                relative overflow-hidden bg-white
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
            </div>
          );
        })}

        {safeImageList.length > 1 && (
          <div className="shrink-0 h-full w-[26%] bg-transparent flex items-center justify-center flex-col gap-2">
            <Button size="icon" variant="outline" className="rounded-full border-none">
              <ChevronLeft className="size-6" />
            </Button>
            <span className="text-xs text-black">{t("moredetail")}</span>
          </div>
        )}
      </div>

      {/* ✅ Desktop — برگشت به سایز قبلی (aspect-[16/10]) */}
      <div className="hidden md:block w-full aspect-[16/10] relative rounded-lg overflow-hidden">
        {safeImageList.map((src: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              index === activeImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image className="w-full h-full object-cover" src={toStorageUrl(src)} fill alt="Car image" />

            {index === safeImageList.length - 1 && safeImageList.length > 1 && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                <span className="flex items-center justify-center border-2 border-white rounded-full size-12 mb-2 -rotate-45">
                  <ArrowUpRight className="size-5" />
                </span>
                <span className="text-xs font-bold">{t("moredetail")}</span>
              </div>
            )}
          </div>
        ))}

        {/* ✅ Hover zones (فقط برای عوض شدن عکس) */}
        <div className="absolute inset-0 z-30 flex" onMouseLeave={handleMouseLeave}>
          {safeImageList.map((_: any, index: number) => (
            <div key={index} className="flex-1 h-full" onMouseEnter={() => handleMouseMove(index)} />
          ))}
        </div>

        {/* ✅ Progress bars */}
        <div className="absolute bottom-0 left-0 w-full flex p-1 gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          {safeImageList.map((_: any, index: number) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === activeImageIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {children}

      {!noBtn && hasVideo && (
        <Button
          type="button"
          onClick={openVideoReel}
          className="absolute right-2 bottom-2 z-30 rounded-full p-2 h-auto w-auto bg-black/50 hover:bg-black/70 text-white transition-all backdrop-blur-sm"
        >
          <Play className="size-4 md:size-5" />
        </Button>
      )}
    </div>
  );
}

export function SingleCarOptions({
  car,
  bigFont = false,
}: {
  car: any;
  bigFont?: boolean;
}) {
  const t = useTranslations();
  if (!car) return null;

  const textSize = bigFont ? "xl:text-base sm:text-sm text-xs" : "text-[10px] sm:text-xs";

  const fuel = car.fuel || "Petrol";
  const gearboxKey = String(car.gearbox).toLowerCase();
  const gearbox = gearboxKey.includes("auto") || gearboxKey.includes("اتوماتیک") ? "automatic" : "geared";

  return (
    <div
      className={`grid grid-cols-4 gap-1 text-[#787878] dark:text-gray-400 border-[#0000001F] dark:border-gray-700 mt-1 mb-4 ${textSize}`}
    >
      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconGas />
        </span>
        <span className="text-xs">{t(String(fuel === "بنزین" ? "petrol" : fuel).toLowerCase())}</span>
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
          {car.baggage || 0} {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
          <IconPerson />
        </span>
        <span className="text-xs">
          {car.passengers || 0} {t("people")}
        </span>
      </div>
    </div>
  );
}

export function SingleCarPriceList({
  priceList,
  defaultPrice,
  oldPrice,
}: {
  priceList: any;
  defaultPrice?: number | null;
  oldPrice?: number | null;
}) {
  const t = useTranslations();
  const carDates = useSelector((state: any) => state.global.carDates);
  const pathname = usePathname();
  const locale = useLocale();
  const langUrl = getLangUrl(locale);

  const isInSearchPage = pathname === (langUrl ? `${langUrl}/search` : "/search");

  // ✅ فقط برای عددهای قیمت (جداکننده و…)
  const numberFmt = useMemo(() => {
    if (locale === "fa") return new Intl.NumberFormat("fa-IR");
    if (locale === "ar") return new Intl.NumberFormat("ar");
    if (locale === "tr") return new Intl.NumberFormat("tr-TR");
    return new Intl.NumberFormat("en-US");
  }, [locale]);

  const formatNum = useCallback(
    (n: number) => numberFmt.format(Math.round(Number(n) || 0)),
    [numberFmt]
  );

  // ✅ تبدیل عدد روزها به فارسی بدون dir (حتی اگر کانتینر LTR باشه)
  const toPersianDigits = useCallback((input: string) => {
    const en = "0123456789";
    const fa = "۰۱۲۳۴۵۶۷۸۹";
    return input.replace(/[0-9]/g, (d) => fa[en.indexOf(d)]);
  }, []);

  const normalizePriceList = (list: any) => {
    if (!list) return [];
    if (Array.isArray(list)) return list;
    return Object.entries(list).map(([key, value]: any) => ({ range: key, ...(value as any) }));
  };

  const displayInfo = useMemo(() => {
    let days = 1;
    if (carDates && carDates.length >= 2 && carDates[0] && carDates[1]) {
      try {
        const diff = dateDifference(carDates[0], carDates[1]);
        days = diff.days || 1;
      } catch {
        days = 1;
      }
    }

    const pricesArray = normalizePriceList(priceList);

    const match = pricesArray.find((item: any) => {
      const rangeStr = item.range || "";
      const nums = rangeStr.match(/\d+/g);
      if (!nums) return false;
      const min = parseInt(nums[0]);
      const max = nums[1] ? parseInt(nums[1]) : 9999;
      return days >= min && days <= max;
    });

    let activePrice = defaultPrice ?? 0;
    let activeOldPrice = oldPrice ?? 0;

    if (match) {
      activePrice = Number.parseFloat(match.final_price || match.currentPrice || activePrice) || activePrice;
      activeOldPrice = Number.parseFloat(match.base_price || match.previousPrice || activeOldPrice) || activeOldPrice;
    } else if (pricesArray.length > 0) {
      const first: any = pricesArray[0];
      activePrice = Number.parseFloat(first.final_price || first.currentPrice || activePrice) || activePrice;
      activeOldPrice = Number.parseFloat(first.base_price || first.previousPrice || activeOldPrice) || activeOldPrice;
    }

    return { days, price: activePrice, oldPrice: activeOldPrice };
  }, [carDates, priceList, defaultPrice, oldPrice]);

  const pricesArray = useMemo(() => normalizePriceList(priceList), [priceList]);
  const currencyLabel = t("AED");

  return (
    <Card className="p-0 shadow-none border-0 bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-1 my-3 mt-auto border-t pt-2 border-[#0000001f] dark:border-gray-700">
          {isInSearchPage ? (
            (() => {
              const days = displayInfo.days || 1;
              const daily = Number(displayInfo.price || 0);
              const dailyOld = Number(displayInfo.oldPrice || 0);

              const total = daily * days;
              const totalOld = dailyOld * days;

              const daysText = locale === "fa" ? toPersianDigits(String(days)) : String(days);

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[#4b5259] dark:text-gray-300 text-xs sm:text-sm">
                      {t("dailyPriceFor")} {daysText} {t("day")} :
                    </span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#3B82F6] dark:text-blue-400 font-bold text-base sm:text-lg">
                        {formatNum(daily)}
                      </span>

                      {dailyOld > daily && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(dailyOld)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ردیف 2: مجموع */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6b7280] dark:text-gray-400 text-xs sm:text-sm">
                      {t("totalFor")} {daysText} {t("day")} {t("reserve")} :
                    </span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#111827] dark:text-gray-100 font-bold text-base sm:text-lg">
                        {formatNum(total)}
                      </span>

                      {totalOld > total && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(totalOld)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col gap-1">
              {pricesArray.map((item: any, index: number) => {
                if (index > 3) return null;

                const current = parseFloat(item.final_price || item.currentPrice || 0);
                const previous = parseFloat(item.base_price || item.previousPrice || 0);

                let rangeText = item.range;
                const nums = (item.range || "").match(/\d+/g);
                if (nums && nums.length > 0) {
                  if (nums.length === 2) rangeText = `${t("from")} ${nums[0]} ${t("to")} ${nums[1]} ${t("day")}`;
                  else rangeText = `${t("moreThan")} ${nums[0]} ${t("day")}`;
                }

                return (
                  <div key={index} className="flex justify-between items-center text-[10px] sm:text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{rangeText}</span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#3B82F6] dark:text-blue-400 font-bold">{formatNum(current)}</span>

                      {previous > current && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(previous)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isInSearchPage && (
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 px-1">
              <span>{t("daily")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function toFaDigits(input: unknown) {
  if (input === null || input === undefined) return "";
  const s = String(input);
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return s.replace(/\d/g, (d) => fa[en.indexOf(d)]);
}


export function SingleCarButtons({ car }: { car: any }) {
  const t = useTranslations();
  const router = useRouter();
  const dispatch = useDispatch();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const carDates = useSelector((state: any) => state.global.carDates);
  const deliveryTime = useSelector((state: any) => state.global.deliveryTime);
  const returnTime = useSelector((state: any) => state.global.returnTime);

  const whatsappText = useMemo(() => {
    if (carDates && carDates.length >= 2) {
      try {
        const days = dateDifference(carDates[0], carDates[1]).days || 1;
        return `سلام، مایل هستم خودروی ${car.title} را در دبی از تاریخ ${carDates[0]} (${deliveryTime}) تا ${carDates[1]} (${returnTime}) به مدت ${days} روز رزرو کنم.`;
      } catch {
        return `Hello, I am interested in ${car.title}.`;
      }
    }
    return `Hello, I am interested in ${car.title}.`;
  }, [carDates, deliveryTime, returnTime, car.title]);

  function handleBooking() {
    dispatch(selectCar(car.id));
    dispatch(changeRoadMapStep(2));

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("step", "2");
    currentParams.set("car_id", car.id);

    if (carDates?.[0]) currentParams.set("from", carDates[0]);
    if (carDates?.[1]) currentParams.set("to", carDates[1]);

    router.push(`/${locale}/search?${currentParams.toString()}`);
  }

  return (
    <div className="flex w-full gap-2 mt-1">
      <Button
        onClick={handleBooking}
        className="flex-1 p-4 rounded-md flex justify-center items-center gap-2 cursor-pointer font-bold text-sm transition-colors shadow-sm"
      >
        {t("chooseCar")}
      </Button>

      <Button
        asChild
        variant="outline"
        className="rounded-md p-4 flex justify-center items-center gap-2 cursor-pointer transition-all
          bg-[#10B9811A] border-[#10B98180] text-[#10B981] hover:bg-[#10B981] hover:text-white
          dark:bg-[#10B9811A] dark:border-[#10B98180] dark:text-[#10B981] dark:hover:bg-[#10B981] dark:hover:text-white"
      >
        <Link href={`https://wa.me/971556061134?text=${encodeURIComponent(whatsappText)}`} target="_blank">
          <IconWhatsapp className="size-5" />
          واتساپ
        </Link>
      </Button>
    </div>
  );
}
