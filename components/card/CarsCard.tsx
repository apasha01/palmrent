/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useMemo, useState } from "react"
import Image from "next/image"

import { useLocale, useTranslations } from "next-intl"
import { useSelector } from "react-redux"

import { ArrowRight, ChevronLeft } from "lucide-react"
import {
  IconBag,
  IconDiscount,
  IconGas,
  IconHeart,
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
import { Link } from "@/i18n/navigation"

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

  const goReserve = useCallback(() => {
    const carId = Number((car as any)?.id)
    if (!Number.isFinite(carId) || carId <= 0) return

    if (onMobileReserve && typeof window !== "undefined" && window.innerWidth < 768) {
      onMobileReserve(car)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("car_id", String(carId))
    params.delete("step")
    params.set("dt", normalizeTime(deliveryTime) || "10:00")
    params.set("rt", normalizeTime(returnTime) || "10:00")

    router.push(`/reserve?${params.toString()}`, { scroll: true })
  }, [car, searchParams, router, locale, deliveryTime, returnTime, onMobileReserve])

  if (!car) return null

  return (
    <div
      className={`${isHovering ? "z-30" : ""} flex w-full flex-col bg-white cursor-pointer transition-all rounded-2xl md:text-sm text-xs border border-[#0000001f] shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] max-md:pl-0 p-2.5 h-full justify-between overflow-hidden`}
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
      <SingleCarGallery imageList={images}>
        {/* ── badges ── */}
        <div className="flex text-[#0B835C] text-[10px] absolute gap-2 max-[380px]:gap-1 text-nowrap top-2 rtl:right-2 ltr:left-2 w-full">
          {(((car as any).rawOptions || (car as any).options || []) as any[]).map((item: any, index: number) => {
            if (!optionList?.[item]) return null
            const isNoDeposit = optionList[item].title === "noDeposite"

            return (
              <div
                key={index}
                onClick={(e) => e.stopPropagation()}
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
            )
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
          <div className="text-left my-2 text-lg font-bold">
            {locale === "fa"
              ? toFaDigits(capitalizeWords((car as any).title))
              : capitalizeWords((car as any).title)}
          </div>
          <span
            className="size-6 text-[#333333]"
            onClick={(e) => e.stopPropagation()}
          >
            <IconHeart active={undefined} />
          </span>
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
    </div>
  )
}

/* ---------------- gallery ---------------- */

export function SingleCarGallery({
  children,
  imageList,
}: {
  children?: React.ReactNode
  imageList?: any[]
}) {
  const t = useTranslations()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"]

  return (
    <div className="flex relative z-10 w-full lg:h-[220px] h-[220px]">
      <div className="flex h-full max-md:overflow-x-auto max-md:z-10 hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* ── Mobile: horizontal scroll ── */}
        <div
          className="md:absolute max-md:flex w-full h-full top-0 right-0 rounded-lg -z-10 max-md:gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {safeImageList.map((src: any, index: number) => {
            const isFirst = index === 0
            const isLast = index === safeImageList.length - 1
            const isSingle = safeImageList.length === 1

            return (
              <Image
                key={`${String(src)}-${index}`}
                className={`
                  md:rounded-lg
                  max-md:first:rounded-r-lg max-md:last-of-type:rounded-l-lg
                  w-full h-full object-cover md:absolute
                  ${index === activeImageIndex ? "z-10" : ""}
                  ${index !== safeImageList.length - 1 ? "" : "md:hidden"}
                `}
                src={toStorageUrl(src)}
                width={395}
                height={253}
                alt={`Car image ${index + 1}`}
                loading="lazy"
              />
            )
          })}

          {safeImageList.length > 1 && (
            <div className="flex md:hidden flex-col items-center justify-center text-black text-nowrap relative gap-2 font-bold px-4">
              <span className="flex items-center justify-center bg-[#F1F1F1] rounded-full size-8">
                <ChevronLeft className="size-4" />
              </span>
              {t("moredetail")}
            </div>
          )}

          {/* Desktop: last image with overlay */}
          <div
            className={`${activeImageIndex === safeImageList.length - 1 ? "z-10" : ""} rounded-lg w-full h-full max-md:hidden md:absolute`}
          >
            <div
              className={`absolute w-full h-full rounded-lg ${activeImageIndex === safeImageList.length - 1 ? "z-20" : ""} bg-[#000000aa] text-white flex flex-col items-center justify-center`}
            >
              <span className="flex items-center justify-center border-2 border-white rounded-full size-16">
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
        <div className="absolute w-full h-full md:flex items-end flex-row-reverse p-2 cursor-pointer transition-all opacity-0 hover:opacity-100 hidden"
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
              <Link
                key={index}
                href={"test"}
                onMouseEnter={() => setActiveImageIndex(index)}
                className="w-full h-full flex items-end group px-1"
              >
                <span className="w-full h-1 rounded-2xl bg-[#00000070] group-hover:bg-white transition-all"></span>
              </Link>
            )
          ))}
        </div>
      </div>
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
      className={`grid grid-cols-4 gap-1 text-[#787878] mt-1 mb-4 ${textSize} border-y p-2 text-nowrap`}
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
          {toFaDigits(car.baggage ?? car.suitcase ?? 0) || 0} {t("suitCase")}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1">
        <span className={bigFont ? "xl:size-5 size-4" : "size-4"}>
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

  const days = useMemo(() => {
    return calcDaysWithGraceSafe({ carDates, deliveryTime, returnTime })
  }, [carDates, deliveryTime, returnTime])

  const daily = useMemo(() => {
    const base = Number(defaultPrice ?? 0)
    if (base > 0) return base

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
    <div className="flex flex-col gap-2 mb-4 border-[#0000001f]">
      <div className="flex justify-between items-center text-sm font-bold">
        <span>{t("BSPrice")} {daysText} {t("day")} :</span>
        <div className="flex gap-2">
          {dailyOld > daily && (
            <span className="text-[#A7A7A7] line-through">{formatNum(dailyOld)}</span>
          )}
          <span className="text-[#3B82F6] font-bold">{formatNum(daily)}</span>
          {!!currencyLabel && <span>{currencyLabel}</span>}
        </div>
      </div>

      <div className="flex justify-between items-center text-[#4b5259]">
        <span>{t("sum")} {daysText} {t("dayres")} :</span>
        <div className="flex gap-2">
          {totalOld > total && (
            <span className="text-[#A7A7A7] line-through">{formatNum(totalOld)}</span>
          )}
          <span>{formatNum(total)}</span>
          {!!currencyLabel && <span>{currencyLabel}</span>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- buttons ---------------- */

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
      return t("whatsappMessage.reserve", { car: carTitle, city, url: carUrl })
    }

    const from = String(carDates![0] || "")
    const to = String(carDates![1] || "")
    const dt = normalizeTime(deliveryTime) || "10:00"
    const rt = normalizeTime(returnTime) || "10:00"

    return t("whatsappMessage.reserveWithDate", {
      car: carTitle, city, url: carUrl, from, to, dt, rt, days: String(days || ""),
    })
  }, [t, car, hasDates, carDates, deliveryTime, returnTime, city, carUrl, days])

  const whatsappHref = useMemo(() => {
    return `https://wa.me/971556061134?text=${encodeURIComponent(whatsappText)}`
  }, [whatsappText])

  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          reserveOnClick()
        }}
        className="rounded-xl py-1 flex justify-center items-center gap-2 w-full cursor-pointer bg-[#0077db] text-white font-bold text-base"
      >
        {t("chooseCar")}
      </button>

      <Link
        href={whatsappHref}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl py-1 flex justify-center gap-2 w-fit items-center text-nowrap px-2 cursor-pointer bg-[#10B9811A] border border-[#10B98180] text-[#10B981]"
      >
        <IconWhatsapp className={undefined} />
        {t("whatsapp")}
      </Link>
    </div>
  )
}