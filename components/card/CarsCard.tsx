/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { useLocale, useTranslations } from "next-intl"
import { useSelector } from "react-redux"

import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"

import { ArrowUpRight, ChevronLeft, Heart } from "lucide-react"
import {
  IconBag,
  IconDiscount,
  IconGas,
  IconGearBox,
  IconInfoCircle,
  IconPerson,
  IconWhatsapp,
} from "../Icons"

import { capitalizeWords, toFaDigits } from "@/helpers/helper"
import { STORAGE_URL } from "@/lib/apiClient"
import { adaptCarData } from "@/lib/adapters"
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days"
import { jalaliToDate } from "@/lib/date-utils"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { useRouter, useSearchParams } from "next/navigation"

const toStorageUrl = (p: unknown) => {
  if (!p) return ""
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) return p
  return `${STORAGE_URL}${String(p)}`
}

const normalizeImages = (input: unknown): string[] => {
  if (!input) return []
  if (Array.isArray(input)) return (input as unknown[]).filter(Boolean).map(String)
  if (typeof input === "string") return input ? [input] : []
  return []
}

const uniqStrings = (arr: string[]) => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of arr) {
    const s = String(x || "").trim()
    if (!s) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

function calcDaysWithGraceSafe(opts: {
  carDates: [string | null, string | null] | null
  deliveryTime: string | null
  returnTime: string | null
}) {
  const { carDates, deliveryTime, returnTime } = opts
  if (!carDates?.[0] || !carDates?.[1]) return 1

  try {
    return calcRentDaysWithGrace({
      fromDateJalali: carDates[0],
      toDateJalali: carDates[1],
      deliveryTime: normalizeTime(deliveryTime),
      returnTime: normalizeTime(returnTime),
      graceMinutes: 90,
      jalaliToDate,
    })
  } catch {
    return 1
  }
}

/* ---------------- main component ---------------- */

export default function SingleCar({
  data,
  noBtn = false,
  currency = "",
  rateToRial,
  onMobileReserve,
}: {
  data: any
  noBtn?: boolean
  currency?: string
  rateToRial?: number | null

  onMobileReserve?: (carData: any) => void
}) {
  const t = useTranslations()
  const locale = useLocale()
  const optionList = useSelector((state: any) => state.carList.optionList)

  const router = useRouter()
  const searchParams = useSearchParams()

  // فقط برای محاسبه‌ی قیمت و متن واتساپ از store می‌خونیم (هیچ set انجام نمیدیم)
  const carDates = useSearchPageStore((s) => s.carDates)
  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const returnTime = useSearchPageStore((s) => s.returnTime)

  const [isHovering, setIsHovering] = useState(false)

  const car = useMemo(() => {
    const alreadyCardModel =
      data && typeof data === "object" && (Array.isArray((data as any).images) || (data as any).priceList)
    return alreadyCardModel ? data : adaptCarData(data)
  }, [data])

  const images = useMemo(() => {
    const arr = normalizeImages((car as any)?.images || (car as any)?.photo)
    return uniqStrings(arr)
  }, [car])

  // ✅ فقط یک کار: رفتن به رزرو (بدون دست زدن به store)
  // در موبایل اگر onMobileReserve وجود داشت → sheet باز میشه
  const goReserve = useCallback(() => {
    const carId = Number((car as any)?.id)
    if (!Number.isFinite(carId) || carId <= 0) return

    // اگر در موبایل هستیم و callback وجود داره → شیت باز کن
    if (onMobileReserve && typeof window !== "undefined" && window.innerWidth < 768) {
      onMobileReserve(car)
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    params.set("car_id", String(carId))
    params.delete("step")

    // همیشه dt/rt رو ست کن تا یکدست باشه
    params.set("dt", normalizeTime(deliveryTime) || "10:00")
    params.set("rt", normalizeTime(returnTime) || "10:00")

    router.push(`/${locale}/reserve?${params.toString()}`, { scroll: true })
  }, [car, searchParams, router, locale, deliveryTime, returnTime, onMobileReserve])

  if (!car) return null

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
      onClick={goReserve}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goReserve()
        }
      }}
    >
      <CardContent className="p-0 px-1 m-0">
        <SingleCarGallery imageList={images} noBtn={noBtn}>
          <div className="absolute top-2 rtl:right-2 ltr:left-2 z-40 w-full flex flex-wrap gap-2 max-[380px]:gap-1 text-nowrap pointer-events-none">
            {(((car as any).rawOptions || (car as any).options || []) as any[]).map((item: any, index: number) => {
              if (!optionList?.[item]) return null
              const isNoDeposit = optionList[item].title === "noDeposite"

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
              )
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
            >
              <Heart className="size-5" />
            </span>

            <h3 className="text-lg">
              {locale === "fa"
                ? toFaDigits(capitalizeWords((car as any).title))
                : capitalizeWords((car as any).title)}
            </h3>
          </div>

          <SingleCarOptions car={car} />

          <SingleCarPriceList
            priceList={(car as any).priceList || (car as any).dailyPrices}
            defaultPrice={(car as any).price ?? 0}
            oldPrice={(car as any).oldPrice ?? 0}
            carDates={carDates}
            deliveryTime={deliveryTime}
            returnTime={returnTime}
            currency={currency}
            rateToRial={rateToRial}
          />

          {!noBtn && (
            <SingleCarButtons
              car={car}
              carDates={carDates}
              deliveryTime={deliveryTime}
              returnTime={returnTime}
              reserveOnClick={goReserve}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------- gallery ---------------- */

export function SingleCarGallery({
  children,
  imageList,
}: {
  children?: React.ReactNode
  noBtn?: boolean
  imageList?: any[]
}) {
  const t = useTranslations()

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"]

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
        onClick={(e) => e.stopPropagation()}
      >
        {safeImageList.map((src: any, index: number) => {
          const isFirst = index === 0
          const isLast = index === safeImageList.length - 1
          const isSingle = safeImageList.length === 1

          return (
            <div
              key={`${String(src)}-${index}`}
              className={`
                shrink-0 h-full
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
          )
        })}

        {safeImageList.length > 1 && (
          <div className="shrink-0 h-full w-[26%] bg-transparent flex items-center justify-center flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-none"
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <span className="text-xs text-black">{t("moredetail")}</span>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block w-full aspect-16/10 relative rounded-lg overflow-hidden">
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
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === activeImageIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}

/* ---------------- options ---------------- */

export function SingleCarOptions({ car, bigFont = false }: { car: any; bigFont?: boolean }) {
  const t = useTranslations()
  if (!car) return null

  const textSize = bigFont ? "xl:text-base sm:text-sm text-xs" : "text-[10px] sm:text-xs"

  const fuel = car.fuel || car.gasType || "Petrol"
  const gearboxKey = String(car.gearbox || car.gearBox || "").toLowerCase()
  const gearbox = gearboxKey.includes("auto") || gearboxKey.includes("اتوماتیک") ? "automatic" : "geared"

  return (
    <div
      className={`grid grid-cols-4 gap-1 text-[#787878] dark:text-gray-400 dark:border-gray-700 mt-1 mb-4 ${textSize} border-y p-2 text-nowrap ${
        bigFont ? "xl:text-base sm:text-sm text-xs filter-[brightness(0.5)]" : "text-xs"
      }`}
    >
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
          {toFaDigits(car.baggage ?? car.suitcase ?? 0) || 0} {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : `size-4`}>
          <IconPerson />
        </span>
        <span className="text-xs">
          {toFaDigits(car.passengers ?? 0) || 0} {t("people")}
        </span>
      </div>
    </div>
  )
}

/* ---------------- price list ---------------- */

export function SingleCarPriceList({
  priceList,
  defaultPrice,
  oldPrice,
  carDates,
  deliveryTime,
  returnTime,
  currency,
}: {
  priceList: any
  defaultPrice?: number | null
  oldPrice?: number | null
  carDates: [string | null, string | null] | null
  deliveryTime: string | null
  returnTime: string | null
  currency: string
  rateToRial?: number | null
}) {
  const t = useTranslations()
  const locale = useLocale()

  const numberFmt = useMemo(() => {
    if (locale === "fa") return new Intl.NumberFormat("fa-IR")
    if (locale === "ar") return new Intl.NumberFormat("ar")
    if (locale === "tr") return new Intl.NumberFormat("tr-TR")
    return new Intl.NumberFormat("en-US")
  }, [locale])

  const formatNum = useCallback((n: number) => numberFmt.format(Math.round(Number(n) || 0)), [numberFmt])

  // ✅ فقط تعداد روز (بر اساس انتخاب کاربر)
  const days = useMemo(() => {
    return calcDaysWithGraceSafe({ carDates, deliveryTime, returnTime })
  }, [carDates, deliveryTime, returnTime])

  // ✅ قیمت روزانه: فقط از defaultPrice (car.price)
  // اگر defaultPrice نبود، فقط fallback ساده از اولین آیتم priceList (بدون رنج/گروه)
  const daily = useMemo(() => {
    const base = Number(defaultPrice ?? 0)
    if (base > 0) return base

    // fallback (اختیاری)
    const list = Array.isArray(priceList)
      ? priceList
      : priceList && typeof priceList === "object"
        ? Object.values(priceList)
        : []

    const first: any = list?.[0]
    const v = Number.parseFloat(first?.final_price ?? first?.currentPrice ?? first?.price ?? 0) || 0

    return v > 0 ? v : 0
  }, [defaultPrice, priceList])

  const dailyOld = useMemo(() => {
    const v = Number(oldPrice ?? 0)
    return v > 0 ? v : 0
  }, [oldPrice])

  const total = useMemo(() => Number(daily || 0) * Number(days || 1), [daily, days])
  const totalOld = useMemo(() => Number(dailyOld || 0) * Number(days || 1), [dailyOld, days])

  const currencyLabel = useMemo(() => {
    const code = String(currency || "").trim().toUpperCase()
    if (!code) return ""
    const translated = t(code)
    return translated && translated !== code ? translated : code
  }, [currency, t])

  const daysText = locale === "fa" ? toFaDigits(String(days || 1)) : String(days || 1)

  return (
    <Card className="p-0 shadow-none border-0 bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-1 my-3 mt-auto pt-1 dark:border-gray-700">
          <div className="flex flex-col gap-1">
            {/* ✅ فقط قیمت روزانه */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-[#4b5259] dark:text-gray-300 text-xs sm:text-sm">
                {t("dailyPriceFor")} {daysText} {t("day")} :
              </span>

              <div dir="ltr" className="flex items-center gap-2">
                {!!currencyLabel && (
                  <span className="text-base text-[#4b5259] font-bold dark:text-gray-300">{currencyLabel}</span>
                )}
                <span className="text-[#3B82F6] dark:text-blue-400 text-base">{formatNum(daily)}</span>
                {dailyOld > daily && (
                  <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm">
                    {formatNum(dailyOld)}
                  </span>
                )}
              </div>
            </div>

            {/* ✅ فقط جمع کل = روزانه * تعداد روز */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#6b7280] dark:text-gray-400 text-xs sm:text-sm">
                {t("totalFor")} {daysText} {t("day")} {t("reserve")} :
              </span>

              <div dir="ltr" className="flex items-center gap-2">
                {!!currencyLabel && (
                  <span className="text-base text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>
                )}
                <span className="text-[#111827] dark:text-gray-100 text-base">{formatNum(total)}</span>
                {totalOld > total && (
                  <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm">
                    {formatNum(totalOld)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------- buttons (فقط ناوبری + WhatsApp next-intl) ---------------- */

export function SingleCarButtons({
  car,
  carDates,
  deliveryTime,
  returnTime,
  reserveOnClick,
}: {
  car: any
  carDates: [string | null, string | null] | null
  deliveryTime: string | null
  returnTime: string | null
  reserveOnClick: () => void
}) {
  const t = useTranslations()
  const locale = useLocale()

  const loc = useMemo(() => String(locale || "en").toLowerCase().split("-")[0], [locale])

  const carId = useMemo(() => {
    const v = car?.id ?? car?.car_id ?? 0
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }, [car])

  const carUrl = useMemo(() => {
    if (!carId) return "https://palmrentcar.com"
    // ✅ fa بدون /fa
    if (loc === "fa") return `https://palmrentcar.com/cars/${carId}`
    return `https://palmrentcar.com/${loc}/cars/${carId}`
  }, [carId, loc])

  const city = useMemo(() => (loc === "fa" ? "دبی" : "Dubai"), [loc])

  const hasDates = !!(carDates?.[0] && carDates?.[1])

  const days = useMemo(() => {
    if (!hasDates) return 0
    try {
      return calcDaysWithGraceSafe({ carDates, deliveryTime, returnTime })
    } catch {
      return 0
    }
  }, [hasDates, carDates, deliveryTime, returnTime])

  const whatsappText = useMemo(() => {
    const carTitle = String(car?.title || car?.name || "")

    if (!hasDates) {
      return t("whatsappMessage.reserve", {
        car: carTitle,
        city,
        url: carUrl,
      })
    }

    const from = String(carDates![0] || "")
    const to = String(carDates![1] || "")

    const dt = normalizeTime(deliveryTime) || "10:00"
    const rt = normalizeTime(returnTime) || "10:00"

    return t("whatsappMessage.reserveWithDate", {
      car: carTitle,
      city,
      url: carUrl,
      from,
      to,
      dt,
      rt,
      days: String(days || ""), // اختیاری
    })
  }, [t, car, hasDates, carDates, deliveryTime, returnTime, city, carUrl, days])

  const whatsappHref = useMemo(() => {
    return `https://wa.me/971556061134?text=${encodeURIComponent(whatsappText)}`
  }, [whatsappText])

  return (
    <div className="flex w-full gap-2 mt-1">
      <Button
        type="button"
        onClick={() => {
          reserveOnClick()
        }}
        className="flex-1 p-4 rounded-md flex justify-center items-center gap-2 cursor-pointer font-bold text-sm transition-colors shadow-sm"
      >
        {t("chooseCar")}
      </Button>

      <Button
        asChild
        type="button"
        variant="outline"
        className="rounded-md p-4 flex justify-center items-center gap-2 cursor-pointer transition-all
          bg-[#10B9811A] border-[#10B98180] text-[#10B981] hover:bg-[#10B981] hover:text-white
          dark:bg-[#10B9811A] dark:border-[#10B98180] dark:text-[#10B981] dark:hover:bg-[#10B981] dark:hover:text-white"
      >
        <Link href={whatsappHref} target="_blank" onClick={(e) => e.stopPropagation()}>
          <IconWhatsapp className="size-5" />
          {t("whatsapp")}
        </Link>
      </Button>
    </div>
  )
}