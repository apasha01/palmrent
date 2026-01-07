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
import { Badge } from "../ui/badge";
import {
  ArrowUpRight,
  BadgePercent,
  Heart,
  Info,
  Play,
  Fuel,
  Cog,
  Luggage,
  Users,
} from "lucide-react";
import { IconWhatsapp } from "../Icons";


const toStorageUrl = (p: unknown) => {
  if (!p) return "";
  if (
    typeof p === "string" &&
    (p.startsWith("http://") || p.startsWith("https://"))
  )
    return p;
  return `${STORAGE_URL}${String(p)}`;
};

const normalizeImages = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input))
    return (input as unknown[]).filter(Boolean).map(String);
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
  const optionList = useSelector((state: any) => state.carList.optionList);

  const car = adaptCarData(data);
  const [isHovering, setIsHovering] = useState(false);
  
  const { id, title, video, price } = car || {};

  const images = useMemo(() => normalizeImages(car?.images), [car?.images]);
  useEffect(() => {
    console.log(data)
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
        <SingleCarGallery
          imageList={images}
          hasVideo={!!car.video}
          noBtn={noBtn}
        >
          {/* Badges Overlay */}
          <div className="flex text-[10px] absolute gap-2 max-[380px]:gap-1 text-nowrap flex-wrap top-2 rtl:right-2 ltr:left-2 w-full z-20 pointer-events-none">
            {car.rawOptions &&
              car.rawOptions.map((item: any, index: number) => {
                if (!optionList?.[item]) return null;
                const isNoDeposit = optionList[item].title === "noDeposite";

                return (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`
                    pointer-events-none sm:py-1 py-2 px-2 rounded-4xl shadow-sm
                    ${
                      isNoDeposit
                        ? "bg-[#eafaee] border border-[#eafaee] dark:bg-emerald-900/30 dark:border-emerald-900/30"
                        : "bg-[#e2e6e9] dark:bg-gray-800"
                    }
                  `}
                  >
                    <span
                      className={`
                      font-bold flex items-center gap-1
                      ${
                        isNoDeposit
                          ? "text-[#1e7b33] dark:text-emerald-300"
                          : "text-[#4b5259] dark:text-gray-200"
                      }
                    `}
                    >
                      {t(optionList[item].title)}
                      {isNoDeposit && <Info size={12} />}
                    </span>
                  </Badge>
                );
              })}
          </div>

          {/* Discount Badge */}
          {car.discountPercent > 0 && (
            <Badge className="absolute bottom-2 left-2 z-20 bg-[#e1ff00] dark:bg-lime-400 py-1 px-2 text-[#3b3d40] dark:text-gray-900 font-bold text-[10px] rounded-lg flex items-center gap-1 shadow-sm opacity-90">
              <BadgePercent size={14} />
              {car.discountPercent}% {t("discount")}
            </Badge>
          )}
        </SingleCarGallery>

        <div className="flex flex-col flex-1 ">
          <div className="flex items-center justify-between my-2">
            <span className="size-5 text-[#888] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <Heart className="size-5" />
            </span>
            <h3 className="text-lg font-bold">{capitalizeWords(car.title)}</h3>
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
  const locale = useLocale();
  const dispatch = useDispatch();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0
      ? imageList
      : ["/images/placeholder.png"];

  // ✅ RTL/LTR اتومات از dir صفحه (در صورت نبودن، از locale حدس می‌زنیم)
  const [isRTL, setIsRTL] = useState(
    locale === "fa" || locale === "ar" || locale === "ur"
  );
  useEffect(() => {
    const dir =
      typeof document !== "undefined" ? document.documentElement.dir : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dir === "rtl") setIsRTL(true);
    else if (dir === "ltr") setIsRTL(false);
    else setIsRTL(locale === "fa" || locale === "ar" || locale === "ur");
  }, [locale]);

  const handleMouseMove = (index: number) => setActiveImageIndex(index);
  const handleMouseLeave = () => setActiveImageIndex(0);

  const openVideoReel = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(changeReelActive(true));
  };

  return (
    // ✅ موبایل بدون rounded | دسکتاپ rounded
    <div className="relative w-full z-10 overflow-hidden rounded-none md:rounded-lg group">
      {/* ✅ Mobile View */}
      <div
        className="
          md:hidden flex w-full h-[230px]
          overflow-x-auto overflow-y-hidden flex-nowrap gap-2
          hide-scrollbar
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {safeImageList.map((src: any, index: number) => (
          <div
            key={index}
            className={`
              shrink-0 h-full w-[85%]
              relative overflow-hidden
              rounded-none
              bg-white flex ${isRTL ? "justify-end" : "justify-start"}
            `}
          >
            <Image
              className={`w-full h-full object-contain ${
                isRTL ? "object-right" : "object-left"
              }`}
              src={toStorageUrl(src)}
              width={395}
              height={253}
              alt={`Car image ${index + 1}`}
              loading="lazy"
            />
            {index === safeImageList.length - 1 && safeImageList.length > 1 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                  {t("morePic")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ✅ Desktop View (rounded) */}
      <div className="hidden md:block w-full aspect-16/7 relative rounded-lg overflow-hidden">
        {safeImageList.map((src: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              index === activeImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              className="w-full h-full object-cover"
              src={toStorageUrl(src)}
              fill
              alt="Car image"
              priority={false}
            />

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

        <div
          className="absolute inset-0 z-20 flex"
          onMouseLeave={handleMouseLeave}
        >
          {safeImageList.map((_: any, index: number) => (
            <div
              key={index}
              className="flex-1 h-full"
              onMouseEnter={() => handleMouseMove(index)}
            />
          ))}
        </div>

        {/* ✅ Progress bars دسکتاپ */}
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

  const textSize = bigFont
    ? "xl:text-base sm:text-sm text-xs"
    : "text-[10px] sm:text-xs";

  const fuel = car.fuel || "Petrol";
  const gearboxKey = String(car.gearbox).toLowerCase();
  const gearbox =
    gearboxKey.includes("auto") || gearboxKey.includes("اتوماتیک")
      ? "automatic"
      : "geared";

  return (
    <div
      className={`grid grid-cols-4 gap-1 text-[#787878] dark:text-gray-400 border-[#0000001F] dark:border-gray-700 mt-1 mb-4  ${textSize}`}
    >
      <div className="flex items-center justify-center gap-1">
        <span className="">
          <Fuel className="size-5" />
        </span>
        <span className="text-xs">
          {t(String(fuel === "بنزین" ? "petrol" : fuel).toLowerCase())}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="">
          <Cog className="size-5" />
        </span>
        <span className="text-xs">{t(gearbox)}</span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="">
          <Luggage className="size-5" />
        </span>
        <span className="text-xs">
          {car.baggage || 0} {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className="">
          <Users className="size-5" />
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
  priceList: any
  defaultPrice?: number | null
  oldPrice?: number | null
}) {
  const t = useTranslations()
  const carDates = useSelector((state: any) => state.global.carDates)
  const pathname = usePathname()
  const locale = useLocale()
  const langUrl = getLangUrl(locale)

  const isInSearchPage = pathname === (langUrl ? `${langUrl}/search` : "/search")

  // ✅ عددها مثل عکس: فارسی + جداکننده
  const numberFmt = useMemo(() => {
    // برای فارسی/عربی، خروجی خیلی شبیه عکس میشه
    if (locale === "fa") return new Intl.NumberFormat("fa-IR")
    if (locale === "ar") return new Intl.NumberFormat("ar")
    return new Intl.NumberFormat("en-US")
  }, [locale])

  const formatNum = useCallback(
    (n: number) => numberFmt.format(Math.round(Number(n) || 0)),
    [numberFmt],
  )

  const normalizePriceList = (list: any) => {
    if (!list) return []
    if (Array.isArray(list)) return list
    return Object.entries(list).map(([key, value]: any) => ({
      range: key,
      ...(value as any),
    }))
  }

  const displayInfo = useMemo(() => {
    let days = 1
    if (carDates && carDates.length >= 2 && carDates[0] && carDates[1]) {
      try {
        const diff = dateDifference(carDates[0], carDates[1])
        days = diff.days || 1
      } catch {
        days = 1
      }
    }

    const pricesArray = normalizePriceList(priceList)

    const match = pricesArray.find((item: any) => {
      const rangeStr = item.range || ""
      const nums = rangeStr.match(/\d+/g)
      if (!nums) return false
      const min = parseInt(nums[0])
      const max = nums[1] ? parseInt(nums[1]) : 9999
      return days >= min && days <= max
    })

    let activePrice = defaultPrice ?? 0
    let activeOldPrice = oldPrice ?? 0

    if (match) {
      activePrice =
        Number.parseFloat(match.final_price || match.currentPrice || activePrice) || activePrice
      activeOldPrice =
        Number.parseFloat(match.base_price || match.previousPrice || activeOldPrice) || activeOldPrice
    } else if (pricesArray.length > 0) {
      const first: any = pricesArray[0]
      activePrice =
        Number.parseFloat(first.final_price || first.currentPrice || activePrice) || activePrice
      activeOldPrice =
        Number.parseFloat(first.base_price || first.previousPrice || activeOldPrice) || activeOldPrice
    }

    return { days, price: activePrice, oldPrice: activeOldPrice }
  }, [carDates, priceList, defaultPrice, oldPrice])

  const pricesArray = useMemo(() => normalizePriceList(priceList), [priceList])

  // ✅ واحد پول مثل عکس (قبل عدد)
  // اگر تو ترجمه‌ات t("AED") = "درهم" باشه همونه.
  const currencyLabel = t("AED") // درهم

  return (
    <Card className="p-0 shadow-none border-0 bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-1 my-3 mt-auto border-t pt-2 border-[#0000001f] dark:border-gray-700">
          {isInSearchPage ? (
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-[#4b5259] dark:text-gray-300 text-xs sm:text-sm">
                {t("BSPrice")} {displayInfo.days} {t("day")}
              </span>

              {/* ✅ دقیق مثل عکس: "درهم ۱۱۲ ۱۴۹" (قدیمی خط خورده کنار قیمت) */}
              <div dir="ltr" className="flex items-center gap-2">
                <span className="text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                <span className="text-[#3B82F6] dark:text-blue-400 font-bold text-base sm:text-lg">
                  {formatNum(displayInfo.price)}
                </span>

                {displayInfo.oldPrice > displayInfo.price && (
                  <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm decoration-red-500">
                    {formatNum(displayInfo.oldPrice)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {pricesArray.map((item: any, index: number) => {
                if (index > 3) return null

                const current = parseFloat(item.final_price || item.currentPrice || 0)
                const previous = parseFloat(item.base_price || item.previousPrice || 0)

                let rangeText = item.range
                const nums = (item.range || "").match(/\d+/g)
                if (nums && nums.length > 0) {
                  if (nums.length === 2) rangeText = `${t("from")} ${nums[0]} ${t("to")} ${nums[1]} ${t("day")}`
                  else rangeText = `${t("moreThan")} ${nums[0]} ${t("day")}`
                }

                return (
                  <div key={index} className="flex justify-between items-center text-[10px] sm:text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{rangeText}</span>

                    {/* ✅ اینجا هم مثل عکس: "درهم ۷۸۴ ۱۰۴۳" */}
                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#3B82F6] dark:text-blue-400 font-bold">
                        {formatNum(current)}
                      </span>

                      {previous > current && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through decoration-red-500">
                          {formatNum(previous)}
                        </span>
                      )}
                    </div>
                  </div>
                )
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
  )
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

  // ✅ بدون setState داخل useEffect — متن واتساپ derived شد
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
        <Link
          href={`https://wa.me/971556061134?text=${encodeURIComponent(
            whatsappText
          )}`}
          target="_blank"
        >
          <IconWhatsapp className="size-5" />
          واتساپ
        </Link>
      </Button>
    </div>
  );
}
