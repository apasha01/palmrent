/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useDispatch, useSelector } from "react-redux"

import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"

import { ArrowUpRight, ChevronLeft, Heart, Play } from "lucide-react"
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
import { dateDifference } from "@/lib/getDateDiffrence"
import { getLangUrl } from "@/lib/getLangUrl"
import { STORAGE_URL } from "@/lib/apiClient"

// ✅ zustand
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

// ❗️اگر هنوز adaptCarData نیاز داری نگه دار، ولی ما "دو بار adapt" رو کنترل می‌کنیم
import { adaptCarData } from "@/lib/adapters"

/* ---------------- helpers ---------------- */

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

function normalizePriceList(list: any) {
  if (!list) return []
  if (Array.isArray(list)) return list
  return Object.entries(list).map(([key, value]: any) => ({
    range: key,
    ...(value as any),
  }))
}

function parseRange(range: any) {
  const nums = String(range || "").match(/\d+/g)
  if (!nums || nums.length < 1) return null
  const min = parseInt(nums[0], 10)
  const max = nums[1] ? parseInt(nums[1], 10) : 9999
  if (!Number.isFinite(min)) return null
  return { min, max: Number.isFinite(max) ? max : 9999 }
}

/**
 * ✅ بهترین رنج:
 * - days داخلش باشد
 * - بزرگترین min را ترجیح بده (دقیق‌ترین)
 * - اگر مساوی: کوچک‌ترین max
 */
function pickBestMatch(pricesArray: any[], days: number) {
  const candidates = pricesArray
    .map((item) => {
      const r = parseRange(item?.range)
      if (!r) return null
      return { ...item, __min: r.min, __max: r.max }
    })
    .filter(Boolean)
    .filter((x: any) => days >= x.__min && days <= x.__max)
    .sort((a: any, b: any) => b.__min - a.__min || a.__max - b.__max)

  return candidates[0] || null
}

/* ---------------- main component ---------------- */

export default function SingleCar({ data, noBtn = false }: { data: any; noBtn?: boolean }) {
  const t = useTranslations()
  const locale = useLocale()
  const dispatch = useDispatch()

  // ✅ optionList هنوز از redux
  const optionList = useSelector((state: any) => state.carList.optionList)

  // ✅ تاریخ/تایم از zustand
  const carDates = useSearchPageStore((s) => s.carDates)
  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const returnTime = useSearchPageStore((s) => s.returnTime)

  const setRoadMapStep = useSearchPageStore((s) => s.setRoadMapStep)
  const setSelectedCarId = useSearchPageStore((s) => s.setSelectedCarId)
  const setReelActive = useSearchPageStore((s) => s.setReelActive)
  const addReelItemStore = useSearchPageStore((s) => s.addReelItem)

  const [isHovering, setIsHovering] = useState(false)

  /**
   * ✅ ضد دوبار-adapt
   * اگر data از zustand normalize شده باشد (priceList/images/...) دیگر adapt نکن
   */
  const car = useMemo(() => {
    const alreadyCardModel =
      data && typeof data === "object" && (Array.isArray(data.images) || data.priceList)

    return alreadyCardModel ? data : adaptCarData(data)
  }, [data])

  const { id, title, video, price } = car || {}

  /**
   * ✅ مهم‌ترین fix برای دوبار شدن عکس‌ها:
   * 1) normalize
   * 2) uniq (dedupe)
   */
  const images = useMemo(() => {
    const arr = normalizeImages(car?.images || car?.photo)
    return uniqStrings(arr)
  }, [car?.images, car?.photo])

  /**
   * ✅ ریل: فقط یک بار برای هر id اضافه کن
   */
  useEffect(() => {
    if (!video || !id) return
    const videoData = { id, title, video, price }
    addReelItemStore(videoData)
  }, [id, title, video, price, addReelItemStore])

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
    >
      <CardContent className="p-0 px-1 m-0">
        <SingleCarGallery imageList={images} hasVideo={!!car.video} noBtn={noBtn}>
          {/* ✅ Badges Overlay */}
          <div className="absolute top-2 rtl:right-2 ltr:left-2 z-40 w-full flex flex-wrap gap-2 max-[380px]:gap-1 text-nowrap pointer-events-none">
            {(car.rawOptions || car.options || []).map((item: any, index: number) => {
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

          {/* ✅ Discount Badge */}
          {Number(car.discountPercent || car.discount || 0) > 0 && (
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none bg-[#e1ff00] py-1.5 px-2.5 text-[#3b3d40] opacity-85 rounded-lg flex items-center gap-1">
              <IconDiscount size="20" />
              {car.discountPercent || car.discount}% {t("discount")}
            </div>
          )}
        </SingleCarGallery>

        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mt-1.5 mb-2">
            <span className="size-5 text-[#888] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <Heart className="size-5" />
            </span>

            <h3 className="text-lg">
              {locale === "fa"
                ? toFaDigits(capitalizeWords(car.title))
                : capitalizeWords(car.title)}
            </h3>
          </div>

          <SingleCarOptions car={car} />

          <SingleCarPriceList
            priceList={car.priceList || car.dailyPrices}
            defaultPrice={car.price ?? 0}
            oldPrice={car.oldPrice ?? 0}
            carDates={carDates}
          />

          {!noBtn && (
            <SingleCarButtons
              car={car}
              carDates={carDates}
              deliveryTime={deliveryTime}
              returnTime={returnTime}
              onChoose={() => {
                setSelectedCarId(Number(car.id))
                setRoadMapStep(2)
              }}
              onOpenReel={() => setReelActive(true)}
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
  noBtn,
  imageList,
  hasVideo,
}: {
  children?: React.ReactNode
  noBtn?: boolean
  imageList?: any[]
  hasVideo?: boolean
}) {
  const t = useTranslations()
  const setReelActive = useSearchPageStore((s) => s.setReelActive)

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const safeImageList =
    Array.isArray(imageList) && imageList.length > 0 ? imageList : ["/images/placeholder.png"]

  const handleMouseMove = (index: number) => setActiveImageIndex(index)
  const handleMouseLeave = () => setActiveImageIndex(0)

  const openVideoReel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReelActive(true)
  }

  return (
    <div className="relative w-full z-10 overflow-hidden rounded-none md:rounded-lg group">
      {/* ✅ Mobile */}
      <div
        className="
          md:hidden flex w-full h-[230px]
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
            <Button size="icon" variant="outline" className="rounded-full border-none">
              <ChevronLeft className="size-6" />
            </Button>
            <span className="text-xs text-black">{t("moredetail")}</span>
          </div>
        )}
      </div>

      {/* ✅ Desktop */}
      <div className="hidden md:block w-full aspect-[16/10] relative rounded-lg overflow-hidden">
        {safeImageList.map((src: any, index: number) => (
          <div
            key={`${String(src)}-${index}`}
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

        {/* ✅ Hover zones */}
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

/* ---------------- price list (Zustand) ---------------- */

export function SingleCarPriceList({
  priceList,
  defaultPrice,
  oldPrice,
  carDates,
}: {
  priceList: any
  defaultPrice?: number | null
  oldPrice?: number | null
  carDates: [string | null, string | null] | null
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const locale = useLocale()
  const langUrl = getLangUrl(locale)

  const isInSearchPage = pathname === (langUrl ? `${langUrl}/search` : "/search")

  const numberFmt = useMemo(() => {
    if (locale === "fa") return new Intl.NumberFormat("fa-IR")
    if (locale === "ar") return new Intl.NumberFormat("ar")
    if (locale === "tr") return new Intl.NumberFormat("tr-TR")
    return new Intl.NumberFormat("en-US")
  }, [locale])

  const formatNum = useCallback((n: number) => numberFmt.format(Math.round(Number(n) || 0)), [numberFmt])

  const pricesArray = useMemo(() => normalizePriceList(priceList), [priceList])

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

    const match = pickBestMatch(pricesArray, days)

    let activePrice = defaultPrice ?? 0
    let activeOldPrice = oldPrice ?? 0

    if (match) {
      activePrice = Number.parseFloat(match.final_price || match.currentPrice || activePrice) || activePrice
      activeOldPrice =
        Number.parseFloat(match.base_price || match.previousPrice || activeOldPrice) || activeOldPrice
    } else if (pricesArray.length > 0) {
      const first: any = pricesArray[0]
      activePrice = Number.parseFloat(first.final_price || first.currentPrice || activePrice) || activePrice
      activeOldPrice =
        Number.parseFloat(first.base_price || first.previousPrice || activeOldPrice) || activeOldPrice
    }

    return { days, price: activePrice, oldPrice: activeOldPrice }
  }, [carDates, pricesArray, defaultPrice, oldPrice])

  const currencyLabel = t("AED")

  return (
    <Card className="p-0 shadow-none border-0 bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-1 my-3 mt-auto pt-1 dark:border-gray-700">
          {isInSearchPage ? (
            (() => {
              const days = displayInfo.days || 1
              const daily = Number(displayInfo.price || 0)
              const dailyOld = Number(displayInfo.oldPrice || 0)

              const total = daily * days
              const totalOld = dailyOld * days

              const daysText = locale === "fa" ? toFaDigits(String(days)) : String(days)

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[#4b5259] dark:text-gray-300 text-xs sm:text-sm">
                      {t("dailyPriceFor")} {daysText} {t("day")} :
                    </span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-base text-[#4b5259] font-bold dark:text-gray-300">
                        {currencyLabel}
                      </span>

                      <span className="text-[#3B82F6] dark:text-blue-400 text-base">{formatNum(daily)}</span>

                      {dailyOld > daily && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(dailyOld)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#6b7280] dark:text-gray-400 text-xs sm:text-sm">
                      {t("totalFor")} {daysText} {t("day")} {t("reserve")} :
                    </span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-base text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#111827] dark:text-gray-100 text-base">{formatNum(total)}</span>

                      {totalOld > total && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through text-xs sm:text-sm decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(totalOld)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="flex flex-col gap-1">
              {pricesArray.slice(0, 4).map((item: any, index: number) => {
                const current = parseFloat(item.final_price || item.currentPrice || 0)
                const previous = parseFloat(item.base_price || item.previousPrice || 0)

                let rangeText = item.range
                const nums = String(item.range || "").match(/\d+/g)
                if (nums && nums.length > 0) {
                  if (nums.length >= 2) rangeText = `${t("from")} ${nums[0]} ${t("to")} ${nums[1]} ${t("day")}`
                  else rangeText = `${t("moreThan")} ${nums[0]} ${t("day")}`
                }

                return (
                  <div key={index} className="flex justify-between items-center text-[10px] sm:text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{rangeText}</span>

                    <div dir="ltr" className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-[#4b5259] dark:text-gray-300">{currencyLabel}</span>

                      <span className="text-[#3B82F6] dark:text-blue-400">{formatNum(current)}</span>

                      {previous > current && (
                        <span className="text-[#A7A7A7] dark:text-gray-500 line-through decoration-gray-400 dark:decoration-gray-600">
                          {formatNum(previous)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------- buttons (Zustand) ---------------- */

export function SingleCarButtons({
  car,
  carDates,
  deliveryTime,
  returnTime,
  onChoose,
  onOpenReel,
}: {
  car: any
  carDates: [string | null, string | null] | null
  deliveryTime: string | null
  returnTime: string | null
  onChoose: () => void
  onOpenReel: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()

  const whatsappText = useMemo(() => {
    if (carDates && carDates.length >= 2 && carDates[0] && carDates[1]) {
      try {
        const days = dateDifference(carDates[0], carDates[1]).days || 1
        return `سلام، مایل هستم خودروی ${car.title} را در دبی از تاریخ ${carDates[0]} (${deliveryTime || "10:00"}) تا ${carDates[1]} (${returnTime || "10:00"}) به مدت ${days} روز رزرو کنم.`
      } catch {
        return `Hello, I am interested in ${car.title}.`
      }
    }
    return `Hello, I am interested in ${car.title}.`
  }, [carDates, deliveryTime, returnTime, car.title])

  const handleBooking = () => {
    onChoose()

    // ✅ URL هم sync بشه
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("step", "2")
    currentParams.set("car_id", String(car.id))

    if (carDates?.[0]) currentParams.set("from", carDates[0])
    if (carDates?.[1]) currentParams.set("to", carDates[1])

    router.push(`/${locale}/search?${currentParams.toString()}`)
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
  )
}
