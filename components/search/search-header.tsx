/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"
import { CalendarDays, Clock, Search } from "lucide-react"
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker"
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { BranchById } from "@/helpers/BranchNameHelper"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
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

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

/** ✅ خروجی قطعی: YYYY/MM/DD */
function normalizeJalaliParam(input?: string | null) {
  if (!input) return null
  const clean = toEnglishDigits(String(input)).replace(/-/g, "/").trim()
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return `${y}/${pad2(m)}/${pad2(d)}`
}

function toPersianDigits(input: string) {
  const en = "0123456789"
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  return String(input).replace(/[0-9]/g, (d) => fa[en.indexOf(d)])
}

function parseJalaliToDateNoon(s?: string | null) {
  const norm = normalizeJalaliParam(s)
  if (!norm) return null
  const [y, m, d] = norm.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  const date = jalaliToDate(y, m - 1, d)
  if (!date) return null
  date.setHours(12, 0, 0, 0)
  return date
}

function VDivider() {
  return <span className="mx-3 h-6 w-px bg-gray-200 dark:bg-white/10 shrink-0" />
}

function getJalaliMonthNames(t: any): string[] {
  return [
    t("months.1"),
    t("months.2"),
    t("months.3"),
    t("months.4"),
    t("months.5"),
    t("months.6"),
    t("months.7"),
    t("months.8"),
    t("months.9"),
    t("months.10"),
    t("months.11"),
    t("months.12"),
  ]
}

/** ✅ همیشه خروجی معتبر بده */
function safeTime(input: any, fallback: string) {
  const n = normalizeTime(input)
  // اگر normalizeTime یک چیز عجیب برگردوند یا خالی شد:
  if (!n || typeof n !== "string" || n.length < 4) return fallback
  return n
}

export default function SearchHeader({
  isSticky = false,
  timerValue,
  stepSecond = false,
  stepSecondDesktopLikeSearch = false,
}: {
  isSticky?: boolean
  timerValue?: string
  stepSecond?: boolean
  stepSecondDesktopLikeSearch?: boolean
}) {
  const t = useTranslations("SearchHeader")
  const locale = useLocale()

  const isHeaderClose = useSearchPageStore((s) => s.isHeaderClose)

  const carDates = useSearchPageStore((s) => s.carDates)
  const setCarDates = useSearchPageStore((s) => s.setCarDates)

  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const setDeliveryTime = useSearchPageStore((s) => s.setDeliveryTime)

  const returnTime = useSearchPageStore((s) => s.returnTime)
  const setReturnTime = useSearchPageStore((s) => s.setReturnTime)

  // ✅ fallback قطعی
  const dtFallback = useMemo(() => safeTime(deliveryTime, "10:00"), [deliveryTime])
  const rtFallback = useMemo(() => safeTime(returnTime, "10:00"), [returnTime])

  const carDayCount = useMemo(() => {
    return calcRentDaysWithGrace({
      fromDateJalali: carDates?.[0] ?? null,
      toDateJalali: carDates?.[1] ?? null,
      deliveryTime: dtFallback,
      returnTime: rtFallback,
      graceMinutes: 90,
      jalaliToDate,
    })
  }, [carDates?.[0], carDates?.[1], dtFallback, rtFallback])

  const initialRange = useMemo(() => {
    const start = parseJalaliToDateNoon(carDates?.[0] ?? null)
    const end = parseJalaliToDateNoon(carDates?.[1] ?? null)
    return { start, end }
  }, [carDates?.[0], carDates?.[1]])

  const monthNames = useMemo(() => getJalaliMonthNames(t), [t])

  function formatJalaliShort(dateString?: string | null) {
    const norm = normalizeJalaliParam(dateString)
    if (!norm) return t("common.emptyDate")

    const parts = norm.split("/")
    if (parts.length !== 3) return t("common.emptyDate")

    const m = Number(parts[1])
    const d = Number(parts[2])
    if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) return t("common.emptyDate")

    const dayStr = locale === "fa" ? toPersianDigits(String(d)) : String(d)
    return t("common.shortDate", { day: dayStr, month: monthNames[m - 1] })
  }

  const deliveryDateText = useMemo(() => formatJalaliShort(carDates?.[0] ?? null), [carDates?.[0], monthNames, locale])
  const returnDateText = useMemo(() => formatJalaliShort(carDates?.[1] ?? null), [carDates?.[1], monthNames, locale])

  function formatRangeMobile(opts: { startText: string; endText: string; deliveryTime: string; returnTime: string }) {
    const dt = locale === "fa" ? toPersianDigits(opts.deliveryTime) : opts.deliveryTime
    const rt = locale === "fa" ? toPersianDigits(opts.returnTime) : opts.returnTime
    return t("formats.mobileRange", { start: opts.startText, end: opts.endText, dt, rt })
  }

  function formatRangeStepSecond(opts: {
    startText: string
    endText: string
    deliveryTime: string
    returnTime: string
    dayCount: number
  }) {
    const dt = locale === "fa" ? toPersianDigits(opts.deliveryTime) : opts.deliveryTime
    const rt = locale === "fa" ? toPersianDigits(opts.returnTime) : opts.returnTime
    const days = locale === "fa" ? toPersianDigits(String(opts.dayCount)) : String(opts.dayCount)
    return t("formats.stepSecondRange", { start: opts.startText, end: opts.endText, dt, rt, days })
  }

  // ✅✅✅ اینجا فیکس اصلیه: هیچوقت null/undefined نذاریم بره داخل store
  const handleConfirm = ({ start, end, deliveryTime: dtRaw, returnTime: rtRaw }: any) => {
    if (!start || !end) return

    const s = new Date(start)
    const e = new Date(end)
    s.setHours(12, 0, 0, 0)
    e.setHours(12, 0, 0, 0)

    const fromRaw = normalizeJalaliString(formatJalaliDate(s))
    const toRaw = normalizeJalaliString(formatJalaliDate(e))

    const fromStr = normalizeJalaliParam(fromRaw)
    const toStr = normalizeJalaliParam(toRaw)
    if (!fromStr || !toStr) return

    // ✅ fallback قطعی
    const safeDt = safeTime(dtRaw, dtFallback)
    const safeRt = safeTime(rtRaw, rtFallback)

    const curFrom = normalizeJalaliParam(carDates?.[0] ?? null)
    const curTo = normalizeJalaliParam(carDates?.[1] ?? null)

    if (curFrom !== fromStr || curTo !== toStr) setCarDates([fromStr, toStr])

    // ✅ اینجا دیگه هیچوقت null نمی‌ره تو store
    if (safeTime(deliveryTime, "10:00") !== safeDt) setDeliveryTime(safeDt)
    if (safeTime(returnTime, "10:00") !== safeRt) setReturnTime(safeRt)
  }

  const handleClear = () => {
    setCarDates([null, null])
    // ✅ پاک کردن زمان رو نکن! چون رزرو/سرچ ممکنه با null بترکه
    // اگر واقعاً خواستی clear کنی، باید در همه جا fallback داشته باشی
    setDeliveryTime("10:00")
    setReturnTime("10:00")
  }

  const popoverKey = useMemo(() => {
    const f = normalizeJalaliParam(carDates?.[0] ?? "") ?? ""
    const to = normalizeJalaliParam(carDates?.[1] ?? "") ?? ""
    return `drp-${f}-${to}-${dtFallback}-${rtFallback}`
  }, [carDates?.[0], carDates?.[1], dtFallback, rtFallback])

  const searchButton = (
    <button
      type="button"
      className={cn(
        "shrink-0 h-9 w-9 rounded-full inline-flex items-center justify-center",
        stepSecond ? "bg-yellow-400 hover:bg-yellow-500 text-black" : "bg-blue-600 hover:bg-blue-700 text-white"
      )}
      aria-label={t("actions.search")}
    >
      <Search className="h-4 w-4" />
    </button>
  )

  const dayCountText = locale === "fa" ? toPersianDigits(String(carDayCount)) : String(carDayCount)
  const desktopActsLikeSearch = stepSecond && stepSecondDesktopLikeSearch

  return (
    <div
      className={cn(
        isSticky ? "sticky" : "",
        isHeaderClose ? "top-0" : "top-16",
        "z-40 w-full transition-all bg-white dark:bg-background border-b border-gray-200 dark:border-white/10"
      )}
    >
      <div className="mx-auto max-w-6xl px-2 md:px-4 py-2">
        {/* ===================== MOBILE ===================== */}
        <div className="md:hidden">
          {stepSecond ? (
            <div className="w-full hide-scrollbar">
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-col flex-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">{t("stepSecond.title")}</div>
                  <div className="mt-1 text-gray-500 dark:text-gray-400 text-[12px]">
                    {formatRangeStepSecond({
                      startText: deliveryDateText,
                      endText: returnDateText,
                      deliveryTime: dtFallback,
                      returnTime: rtFallback,
                      dayCount: Number(carDayCount) || 0,
                    })}
                  </div>
                </div>

                <DateRangePickerPopover
                  key={`mobile-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={searchButton}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="flex flex-row-reverse items-center justify-between whitespace-nowrap text-[11px] px-1">
                  <DateRangePickerPopover
                    key={`mobile-${popoverKey}`}
                    initialRange={initialRange}
                    defaultIsJalali={true}
                    initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
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
                        deliveryTime: dtFallback,
                        returnTime: rtFallback,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 px-1 flex flex-col gap-1">
                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100 text-[11px]">
                  <Clock className="h-4 w-4" />
                  <span>
                    {t("rentalDuration.prefix")} {dayCountText} {t("rentalDuration.daysSuffix")} {t("rentalDuration.branchSuffix")}{" "}
                    <BranchById />
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
          {desktopActsLikeSearch ? (
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="w-full md:min-w-0 flex justify-between items-center text-xs">
                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-semibold">{t("desktop.deliveryTitle")}</span>
                  <span>
                    {deliveryDateText} &nbsp; {t("desktop.hour")}{" "}
                    {locale === "fa" ? toPersianDigits(dtFallback) : dtFallback}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-semibold">{t("desktop.returnTitle")}</span>
                  <span>
                    {returnDateText} &nbsp; {t("desktop.hour")}{" "}
                    {locale === "fa" ? toPersianDigits(rtFallback) : rtFallback}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <Clock className="h-4 w-4" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("rentalDuration.prefix")} {dayCountText} {t("rentalDuration.daysSuffix")} {t("rentalDuration.branchSuffix")}{" "}
                    <BranchById />
                  </span>
                </div>

                <DateRangePickerPopover
                  key={`desktop-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
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
          ) : stepSecond ? (
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="font-bold text-gray-900 dark:text-gray-100 text-base">{t("stepSecond.title")}</div>
                  <div className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                    {formatRangeStepSecond({
                      startText: deliveryDateText,
                      endText: returnDateText,
                      deliveryTime: dtFallback,
                      returnTime: rtFallback,
                      dayCount: Number(carDayCount) || 0,
                    })}
                  </div>
                </div>

                <DateRangePickerPopover
                  key={`desktop-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
                  onConfirm={handleConfirm}
                  onClear={handleClear}
                  trigger={searchButton}
                />
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="w-full md:min-w-0 flex justify-between items-center text-xs">
                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-semibold">{t("desktop.deliveryTitle")}</span>
                  <span>
                    {deliveryDateText} &nbsp; {t("desktop.hour")}{" "}
                    {locale === "fa" ? toPersianDigits(dtFallback) : dtFallback}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-semibold">{t("desktop.returnTitle")}</span>
                  <span>
                    {returnDateText} &nbsp; {t("desktop.hour")}{" "}
                    {locale === "fa" ? toPersianDigits(rtFallback) : rtFallback}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                  <Clock className="h-4 w-4" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {t("rentalDuration.prefix")} {dayCountText} {t("rentalDuration.daysSuffix")} {t("rentalDuration.branchSuffix")}{" "}
                    <BranchById />
                  </span>
                </div>

                <DateRangePickerPopover
                  key={`desktop-${popoverKey}`}
                  initialRange={initialRange}
                  defaultIsJalali={true}
                  initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
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
          )}
        </div>
      </div>
    </div>
  )
}