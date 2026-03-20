/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarDays, Clock, HandHeartIcon, Search } from "lucide-react"
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker"
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { BranchById } from "@/helpers/BranchNameHelper"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days"
import { SheetClose } from "../ui/sheet"


function normalizeJalaliString(s: string) {
  return (s).replace(/-/g, "/").trim()
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function normalizeJalaliParam(input?: string | null) {
  if (!input) return null
  const clean = (String(input)).replace(/-/g, "/").trim()
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return `${y}/${pad2(m)}/${pad2(d)}`
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

function safeTime(input: any, fallback: string) {
  const n = normalizeTime(input)
  if (!n || typeof n !== "string" || n.length < 4) return fallback
  return n
}

// ─────────────────────────────────────────────
// NoDate Banner – shown when hasDates = false
// اگر URL فقط branch_id داشت و from/to نداشت:
// فقط در موبایل حالت ساده نمایش داده می‌شود
// بدون mt-4 / rounded / bg-white
// ─────────────────────────────────────────────
function NoDateBanner({
  onTrigger,
  t,
}: {
  onTrigger: React.ReactNode
  t: any
  mobileBranchOnlyMode?: boolean
}) {
  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="hidden md:flex w-full items-center justify-center gap-6 py-1 text-xs">
        <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
          <HandHeartIcon className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{t("noDate.title")}</span>
        </div>

        <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-600 dark:text-gray-400">
          <CalendarDays className="h-5 w-5 shrink-0" />
          <span>{t("noDate.subtitle")}</span>
        </div>

        <div className="shrink-0">{onTrigger}</div>
      </div>

      {/* ── MOBILE ── */}
      <div
        className={cn(
          "flex md:hidden w-full bg-white p-2 rounded-md shadow items-center justify-between",

        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarDays className="h-5 w-5 shrink-0" />
          <div className="flex flex-col rtl:text-right ltr:text-left min-w-0">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-[13px] leading-tight">
              {t("noDate.title")}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
              {t("noDate.subtitle")}
            </span>
          </div>
        </div>

        <div className="shrink-0 ltr:ml-6 rtl:mr-6">{onTrigger}</div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function SearchHeader({
  isSticky = false,
  timerValue,
  onTitleClick,
  stepSecond = false,
  stepSecondDesktopLikeSearch = false,
}: {
  isSticky?: boolean
  timerValue?: string
  onTitleClick?: () => void // ← اضافه کن
  stepSecond?: boolean
  stepSecondDesktopLikeSearch?: boolean
}) {
  const t = useTranslations("SearchHeader")
  const locale = useLocale()
  const searchParams = useSearchParams()

  const isHeaderClose = useSearchPageStore((s) => s.isHeaderClose)

  const carDates = useSearchPageStore((s) => s.carDates)
  const setCarDates = useSearchPageStore((s) => s.setCarDates)

  const deliveryTime = useSearchPageStore((s) => s.deliveryTime)
  const setDeliveryTime = useSearchPageStore((s) => s.setDeliveryTime)

  const returnTime = useSearchPageStore((s) => s.returnTime)
  const setReturnTime = useSearchPageStore((s) => s.setReturnTime)

  const dtFallback = useMemo(() => safeTime(deliveryTime, "10:00"), [deliveryTime])
  const rtFallback = useMemo(() => safeTime(returnTime, "10:00"), [returnTime])

  // آیا تاریخ داریم یا نه
  const hasDates = Boolean(carDates?.[0] && carDates?.[1])

  // فقط برای URL حالت branch-only
  const branchIdFromUrl = searchParams.get("branch_id")
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  // فقط وقتی branch_id هست و from/to نیست
  const isBranchOnlyMobileMode = Boolean(branchIdFromUrl && !fromParam && !toParam)

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

    if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) {
      return t("common.emptyDate")
    }

    const dayStr = locale === "fa" ? (String(d)) : String(d)
    return t("common.shortDate", { day: dayStr, month: monthNames[m - 1] })
  }

  const deliveryDateText = useMemo(
    () => formatJalaliShort(carDates?.[0] ?? null),
    [carDates?.[0], monthNames, locale]
  )

  const returnDateText = useMemo(
    () => formatJalaliShort(carDates?.[1] ?? null),
    [carDates?.[1], monthNames, locale]
  )

  function formatRangeMobile(opts: {
    startText: string
    endText: string
    deliveryTime: string
    returnTime: string
  }) {
    const dt = locale === "fa" ? (opts.deliveryTime) : opts.deliveryTime
    const rt = locale === "fa" ? (opts.returnTime) : opts.returnTime
    return t("formats.mobileRange", {
      start: opts.startText,
      end: opts.endText,
      dt,
      rt,
    })
  }

  function formatRangeStepSecond(opts: {
    startText: string
    endText: string
    deliveryTime: string
    returnTime: string
    dayCount: number
  }) {
    const dt = locale === "fa" ? (opts.deliveryTime) : opts.deliveryTime
    const rt = locale === "fa" ? (opts.returnTime) : opts.returnTime
    const days = locale === "fa" ? (String(opts.dayCount)) : String(opts.dayCount)

    return t("formats.stepSecondRange", {
      start: opts.startText,
      end: opts.endText,
      dt,
      rt,
      days,
    })
  }

  const handleConfirm = ({
    start,
    end,
    deliveryTime: dtRaw,
    returnTime: rtRaw,
  }: any) => {
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

    const safeDt = safeTime(dtRaw, dtFallback)
    const safeRt = safeTime(rtRaw, rtFallback)

    const curFrom = normalizeJalaliParam(carDates?.[0] ?? null)
    const curTo = normalizeJalaliParam(carDates?.[1] ?? null)

    if (curFrom !== fromStr || curTo !== toStr) {
      setCarDates([fromStr, toStr])
    }

    if (safeTime(deliveryTime, "10:00") !== safeDt) {
      setDeliveryTime(safeDt)
    }

    if (safeTime(returnTime, "10:00") !== safeRt) {
      setReturnTime(safeRt)
    }
  }

  const handleClear = () => {
    setCarDates([null, null])
    setDeliveryTime("10:00")
    setReturnTime("10:00")
  }

  const popoverKey = useMemo(() => {
    const f = normalizeJalaliParam(carDates?.[0] ?? "") ?? ""
    const to = normalizeJalaliParam(carDates?.[1] ?? "") ?? ""
    return `drp-${f}-${to}-${dtFallback}-${rtFallback}`
  }, [carDates?.[0], carDates?.[1], dtFallback, rtFallback])

  const dayCountText =
    locale === "fa" ? (String(carDayCount)) : String(carDayCount)

  const desktopActsLikeSearch = stepSecond && stepSecondDesktopLikeSearch

  // ── دکمه انتخاب تاریخ برای حالت no-date ──
  const noDateTriggerButton = (
    <DateRangePickerPopover
      key={`nodate-${popoverKey}`}
      initialRange={initialRange}
      defaultIsJalali={true}
      initialTimes={{ deliveryTime: dtFallback, returnTime: rtFallback }}
      onConfirm={handleConfirm}
      onClear={handleClear}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-2 py-2",
            "bg-blue-600 text-white font-bold text-sm",
            "hover:bg-blue-700 active:bg-blue-800",
            "transition-colors duration-150 cursor-pointer shadow-sm"
          )}
        >
          <span>{t("noDate.cta")}</span>
        </button>
      }
    />
  )

  // ── دکمه آیکون سرچ برای سایر حالت‌ها ──
  const searchButton = (
    <button
      type="button"
      className={cn(
        "shrink-0 h-9 w-9 rounded-full inline-flex items-center justify-center",
        stepSecond
          ? "bg-yellow-400 hover:bg-yellow-500 text-black"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      )}
      aria-label={t("actions.search")}
    >
      <Search className="h-4 w-4" />
    </button>
  )

  return (
<div
  className={cn(
    isSticky ? "sticky" : "",
    isHeaderClose ? "top-0" : "top-16",
    "z-40 w-full transition-all border-gray-200 dark:border-white/10",
    hasDates ? "bg-white dark:bg-background" : "bg-transparent md:bg-white dark:bg-transparent md:dark:bg-background"
  )}
>
      <div className="mx-auto max-w-6xl px-2 md:px-4 py-2">
        {/* ══════════════════════════════════════════════
            حالت: بدون تاریخ (no-date)
            فقط یک بار نمایش داده می‌شود
            اگر URL فقط branch_id داشت، فقط در موبایل حالت ساده می‌ماند
        ══════════════════════════════════════════════ */}
        {!hasDates && !stepSecond && (
          <NoDateBanner
            onTrigger={noDateTriggerButton}
            t={t}
            mobileBranchOnlyMode={isBranchOnlyMobileMode}
          />
        )}

        {/* ══════════════════════════════════════════════
            حالت: با تاریخ — MOBILE
        ══════════════════════════════════════════════ */}
        {hasDates && (
          <div className="md:hidden">
            {stepSecond ? (
              <div className="w-full hide-scrollbar">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col flex-1">


                <div
  className="font-bold text-gray-900 dark:text-gray-100 text-[13px] cursor-pointer"
  onClick={onTitleClick}
>
  {t("stepSecond.title")}

                    </div>
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
                    key={`mobile-step2-${popoverKey}`}
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
                      {t("rentalDuration.prefix")} {dayCountText}{" "}
                      {t("rentalDuration.daysSuffix")}{" "}
                      {t("rentalDuration.branchSuffix")} <BranchById />
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
        )}

        {/* ══════════════════════════════════════════════
            حالت: با تاریخ — DESKTOP
        ══════════════════════════════════════════════ */}
        {hasDates && (
          <div className="hidden md:block">
            {desktopActsLikeSearch ? (
              <div className="w-full overflow-x-auto hide-scrollbar">
                <div className="w-full md:min-w-0 flex justify-between items-center text-xs">
                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-semibold">{t("desktop.deliveryTitle")}</span>
                    <span>
                      {deliveryDateText} &nbsp; {t("desktop.hour")}{" "}
                      {locale === "fa" ? (dtFallback) : dtFallback}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-semibold">{t("desktop.returnTitle")}</span>
                    <span>
                      {returnDateText} &nbsp; {t("desktop.hour")}{" "}
                      {locale === "fa" ? (rtFallback) : rtFallback}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <Clock className="h-4 w-4" />
                    <span className="text-gray-700 dark:text-gray-200">
                      {t("rentalDuration.prefix")} {dayCountText}{" "}
                      {t("rentalDuration.daysSuffix")}{" "}
                      {t("rentalDuration.branchSuffix")} <BranchById />
                    </span>
                  </div>

                  <DateRangePickerPopover
                    key={`desktop-step2-${popoverKey}`}
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
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-base">
                   
                      {t("stepSecond.title")} 
                 
                    </div>
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
                    key={`desktop-step2-popover-${popoverKey}`}
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
                      {locale === "fa" ? (dtFallback) : dtFallback}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-semibold">{t("desktop.returnTitle")}</span>
                    <span>
                      {returnDateText} &nbsp; {t("desktop.hour")}{" "}
                      {locale === "fa" ? (rtFallback) : rtFallback}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                    <Clock className="h-4 w-4" />
                    <span className="text-gray-700 dark:text-gray-200">
                      {t("rentalDuration.prefix")} {dayCountText}{" "}
                      {t("rentalDuration.daysSuffix")}{" "}
                      {t("rentalDuration.branchSuffix")} <BranchById />
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
        )}
      </div>
    </div>
  )
}