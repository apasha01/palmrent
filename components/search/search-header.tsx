/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useMemo } from "react"
import { CalendarDays, Clock, Search } from "lucide-react"
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker"
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { BranchById } from "@/helpers/BranchNameHelper"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"

// ✅ rent days with grace (MUST export normalizeTime too)
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days"

function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  const ar = "٠١٢٣٤٥٦٧٨٩"
  return String(input)
    .split("")
    .map((ch) => {
      const faIndex = fa.indexOf(ch)
      if (faIndex !== -1) return String(faIndex)
      const arIndex = ar.indexOf(ch)
      if (arIndex !== -1) return String(arIndex)
      return ch
    })
    .join("")
}

function normalizeJalaliString(s: string) {
  return toEnglishDigits(s).replace(/-/g, "/").trim()
}

function toPersianDigits(input: string) {
  const en = "0123456789"
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  return String(input).replace(/[0-9]/g, (d) => fa[en.indexOf(d)])
}

function parseJalaliToDate(s?: string | null) {
  if (!s) return null
  const clean = toEnglishDigits(s).replace(/-/g, "/")
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return jalaliToDate(y, m - 1, d)
}

function formatJalaliShort(dateString?: string | null) {
  if (!dateString) return "---"
  const clean = toEnglishDigits(dateString).replace(/-/g, "/")
  const parts = clean.split("/")
  if (parts.length !== 3) return "---"

  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) return "---"

  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ]
  return `${toPersianDigits(String(d))} ${monthNames[m - 1]}`
}

function VDivider() {
  return <span className="mx-3 h-6 w-px bg-gray-200 dark:bg-white/10 shrink-0" />
}

export default function SearchHeader({
  isSticky = false,
  timerValue,
  stepSecond = false, // ✅ NEW PROP
}: {
  isSticky?: boolean
  timerValue?: string
  stepSecond?: boolean
}) {
  const isHeaderClose = useSearchPageStore((s) => s.isHeaderClose)

  const carDates = useSearchPageStore((s) => s.carDates)
  const setCarDates = useSearchPageStore((s) => s.setCarDates)

  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const setDeliveryTime = useSearchPageStore((s) => s.setDeliveryTime)

  const returnTime = useSearchPageStore((s) => s.returnTime)
  const setReturnTime = useSearchPageStore((s) => s.setReturnTime)

  const carDayCount = useMemo(() => {
    return calcRentDaysWithGrace({
      fromDateJalali: carDates?.[0] ?? null,
      toDateJalali: carDates?.[1] ?? null,
      deliveryTime: normalizeTime(deliveryTime),
      returnTime: normalizeTime(returnTime),
      graceMinutes: 90,
      jalaliToDate,
    })
  }, [carDates?.[0], carDates?.[1], deliveryTime, returnTime])

  const initialRange = useMemo(() => {
    const start = parseJalaliToDate(carDates?.[0] ?? null)
    const end = parseJalaliToDate(carDates?.[1] ?? null)
    return { start, end }
  }, [carDates?.[0], carDates?.[1]])

  const deliveryDateText = useMemo(() => formatJalaliShort(carDates?.[0] ?? null), [carDates?.[0]])
  const returnDateText = useMemo(() => formatJalaliShort(carDates?.[1] ?? null), [carDates?.[1]])

  function formatRangeMobile(opts: {
    startText: string
    endText: string
    deliveryTime: string
    returnTime: string
  }) {
    return `از ${opts.startText} ساعت ${toPersianDigits(opts.deliveryTime)} تا ${opts.endText} ساعت ${toPersianDigits(
      opts.returnTime
    )}`
  }

  // ✅ new: stepSecond format (مثل عکس اول)
  function formatRangeStepSecond(opts: {
    startText: string
    endText: string
    deliveryTime: string
    returnTime: string
    dayCount: number
  }) {
    const dt = toPersianDigits(opts.deliveryTime)
    const rt = toPersianDigits(opts.returnTime)
    const days = toPersianDigits(String(opts.dayCount))
    return `${opts.startText} ${dt} - ${opts.endText} ${rt} (${days} روز)`
  }

  // ✅ مهم: فقط store را آپدیت کن. URL را دست نزن.
  const handleConfirm = ({ start, end, deliveryTime: dt, returnTime: rt }: any) => {
    const fromStr = normalizeJalaliString(formatJalaliDate(start))
    const toStr = normalizeJalaliString(formatJalaliDate(end))

    const safeDt = normalizeTime(dt ?? null)
    const safeRt = normalizeTime(rt ?? null)

    setCarDates([fromStr, toStr])
    setDeliveryTime(safeDt)
    setReturnTime(safeRt)
  }

  const handleClear = () => {
    setCarDates([null, null])
    setDeliveryTime(null)
    setReturnTime(null)
  }

  // ✅ key برای reset درست popover وقتی بیرون تغییر میکنه
  const popoverKey = useMemo(() => {
    return `drp-${carDates?.[0] ?? ""}-${carDates?.[1] ?? ""}-${normalizeTime(deliveryTime)}-${normalizeTime(returnTime)}`
  }, [carDates?.[0], carDates?.[1], deliveryTime, returnTime])

  const searchButton = (
    <button
      type="button"
      className={cn(
        "shrink-0 h-9 w-9 rounded-full",
        stepSecond ? "bg-yellow-400 hover:bg-yellow-500 text-black" : "bg-blue-600 hover:bg-blue-700 text-white",
        "inline-flex items-center justify-center"
      )}
      aria-label="جستجو"
    >
      <Search className="h-4 w-4" />
    </button>
  )

  return (
    <div
      className={cn(
        isSticky ? "sticky" : "",
        isHeaderClose ? "top-0" : "top-16",
        "z-40 w-full transition-all",
        "bg-white dark:bg-background",
        "border-b border-gray-200 dark:border-white/10",
        "shadow-none"
      )}
    >
      <div className="mx-auto max-w-6xl px-2 md:px-4 py-2">
        {/* ===================== MOBILE ===================== */}
        <div className="md:hidden">
          {/* ✅ stepSecond MOBILE (مثل عکس اول) */}
          {stepSecond ? (
            <div className="w-full  hide-scrollbar">
              <div className="flex w-full items-center justify-between ">
                <div className="flex flex-col   flex-1 ">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">
                    ثبت اطلاعات و نهایی سازی رزرو
                  </div>
                  <div className="mt-1 text-gray-500 dark:text-gray-400 text-[12px]">
                    {formatRangeStepSecond({
                      startText: deliveryDateText,
                      endText: returnDateText,
                      deliveryTime: normalizeTime(deliveryTime),
                      returnTime: normalizeTime(returnTime),
                      dayCount: Number(carDayCount) || 0,
                    })}
                  </div>
                </div>

                <DateRangePickerPopover
                  key={`mobile-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{
                    deliveryTime: normalizeTime(deliveryTime),
                    returnTime: normalizeTime(returnTime),
                  }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={searchButton}
                />
              </div>
            </div>
          ) : (
            <>
              {/* ✅ حالت قبلی موبایل (عکس دوم) */}
              <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="flex flex-row-reverse items-center justify-between whitespace-nowrap text-[11px] px-1">
                  <DateRangePickerPopover
                    key={`mobile-${popoverKey}`}
                    initialRange={initialRange}
                    defaultIsJalali={true}
                    initialTimes={{
                      deliveryTime: normalizeTime(deliveryTime),
                      returnTime: normalizeTime(returnTime),
                    }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={searchButton}
                  />

                  <div className="inline-flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 shrink-0">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-bold">
                      {formatRangeMobile({
                        startText: deliveryDateText,
                        endText: returnDateText,
                        deliveryTime: normalizeTime(deliveryTime),
                        returnTime: normalizeTime(returnTime),
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 px-1 flex flex-col gap-1">
                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100 text-[11px]">
                  <Clock className="h-4 w-4" />
                  <span>
                    مدت زمان اجاره : {toPersianDigits(String(carDayCount))} روز فراموش نشدی در <BranchById />
                  </span>
                </div>

                {timerValue && (
                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-red-500 font-bold text-[11px]">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">{timerValue}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===================== DESKTOP ===================== */}
        <div className="hidden md:block">
          {/* ✅ stepSecond DESKTOP (مثل عکس اول) */}
          {stepSecond ? (
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-base">
                    ثبت اطلاعات و نهایی سازی رزرو
                  </div>
                  <div className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                    {formatRangeStepSecond({
                      startText: deliveryDateText,
                      endText: returnDateText,
                      deliveryTime: normalizeTime(deliveryTime),
                      returnTime: normalizeTime(returnTime),
                      dayCount: Number(carDayCount) || 0,
                    })}
                  </div>
                </div>

                <DateRangePickerPopover
                  key={`desktop-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{
                    deliveryTime: normalizeTime(deliveryTime),
                    returnTime: normalizeTime(returnTime),
                  }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={searchButton}
                />
              </div>
            </div>
          ) : (
            <>
              {/* ✅ حالت قبلی دسکتاپ */}
              <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="w-full md:min-w-0 flex justify-between items-center text-xs">


                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4 " />
                    <span className="font-semibold">تاریخ و زمان تحویل</span>
                    <span>
                      {deliveryDateText} &nbsp; ساعت {toPersianDigits(normalizeTime(deliveryTime))}
                    </span>
                  </div>


                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4 " />
                    <span className="font-semibold">تاریخ و زمان عودت</span>
                    <span>
                      {returnDateText} &nbsp; ساعت {toPersianDigits(normalizeTime(returnTime))}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <Clock className="h-4 w-4 " />
                    <span className="text-gray-700 dark:text-gray-200">
                      مدت زمان اجاره : {toPersianDigits(String(carDayCount))} روز فراموش نشدی در <BranchById />
                    </span>
                  </div>

                  <DateRangePickerPopover
                    key={`desktop-${popoverKey}`}
                    initialRange={initialRange}
                    defaultIsJalali={true}
                    initialTimes={{
                      deliveryTime: normalizeTime(deliveryTime),
                      returnTime: normalizeTime(returnTime),
                    }}
                    onConfirm={handleConfirm}
                    onClear={handleClear}
                    trigger={searchButton}
                  />

                  {timerValue && (
                    <>
                      <VDivider />
                      <div className="inline-flex items-center gap-2 whitespace-nowrap text-red-500">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-bold">{timerValue}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
