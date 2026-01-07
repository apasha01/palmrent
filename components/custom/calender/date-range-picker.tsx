/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { CalendarGrid } from "./calendar-grid"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { getJalaliParts, formatJalaliDate, formatGregorianDate } from "@/lib/date-utils"

export type Range = { start: Date | null; end: Date | null }

type Props = {
  initialRange?: Range
  defaultIsJalali?: boolean
  initialTimes?: { deliveryTime?: string; returnTime?: string }
  onConfirm?: (range: { start: Date; end: Date; deliveryTime: string; returnTime: string }) => void
  onClear?: () => void
  trigger: React.ReactNode
}

const EMPTY: Range = { start: null, end: null }

function safeTime(t?: string) {
  if (!t) return "10:00"
  return t
}

export function DateRangePickerPopover({
  initialRange = EMPTY,
  defaultIsJalali = true,
  initialTimes,
  onConfirm,
  onClear,
  trigger,
}: Props) {
  const isMobile = useIsMobile()

  const [isJalali, setIsJalali] = React.useState(defaultIsJalali)
  const [isOpen, setIsOpen] = React.useState(false)

  const [range, setRange] = React.useState<Range>(initialRange ?? EMPTY)
  const [deliveryTime, setDeliveryTime] = React.useState<string>(safeTime(initialTimes?.deliveryTime))
  const [returnTime, setReturnTime] = React.useState<string>(safeTime(initialTimes?.returnTime))

  // ✅ هر بار باز شد از بیرون sync کن
  React.useEffect(() => {
    if (!isOpen) return
    setRange(initialRange ?? EMPTY)
    setDeliveryTime(safeTime(initialTimes?.deliveryTime))
    setReturnTime(safeTime(initialTimes?.returnTime))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialRange?.start, initialRange?.end])

  // ویو اولیه
  const jToday = getJalaliParts(new Date())
  const [viewDate, setViewDate] = React.useState({ year: jToday.year, month: jToday.month })

  React.useEffect(() => {
    if (isJalali) {
      const currentJalali = getJalaliParts(new Date())
      setViewDate({ year: currentJalali.year, month: currentJalali.month })
    } else {
      const now = new Date()
      setViewDate({ year: now.getFullYear(), month: now.getMonth() })
    }
  }, [isJalali])

  const handleSelect = (date: Date) => {
    if (!range.start || range.end) {
      setRange({ start: date, end: null })
      return
    }
    if (date < range.start) return
    setRange({ start: range.start, end: date })
  }

  const navigate = (dir: number) => {
    let newMonth = viewDate.month + dir
    let newYear = viewDate.year

    if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    } else if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    }

    setViewDate({ year: newYear, month: newMonth })
  }

  const goToToday = () => {
    if (isJalali) {
      const currentJalali = getJalaliParts(new Date())
      setViewDate({ year: currentJalali.year, month: currentJalali.month })
    } else {
      const now = new Date()
      setViewDate({ year: now.getFullYear(), month: now.getMonth() })
    }
  }

  const formatDate = (date: Date) => (isJalali ? formatJalaliDate(date) : formatGregorianDate(date))

  const isComplete = Boolean(range.start && range.end)
  const displayText = isComplete ? `${formatDate(range.start!)} | ${formatDate(range.end!)}` : ""

  const clearRange = () => {
    setRange({ start: null, end: null })
    setDeliveryTime("10:00")
    setReturnTime("10:00")
    onClear?.()
  }

  const confirm = () => {
    if (!range.start || !range.end) return
    onConfirm?.({
      start: range.start,
      end: range.end,
      deliveryTime,
      returnTime,
    })
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger as any}</PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        className="p-0 border-0 bg-transparent shadow-none"
      >
        <div
          className={cn(
            "w-[92vw] max-w-[820px] overflow-hidden rounded-2xl",
            "border border-gray-200 dark:border-white/10",
            "bg-white dark:bg-background",
            "shadow-2xl"
          )}
          dir="rtl"
        >
          {/* Top controls */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={clearRange}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-300 text-sm font-semibold"
            >
              <X className="h-4 w-4" />
              پاک کردن
            </button>

            <button
              type="button"
              onClick={() => setIsJalali((p) => !p)}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold"
            >
              <Calendar className="h-4 w-4" />
              {isJalali ? "تقویم میلادی" : "تقویم شمسی"}
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="text-blue-600 dark:text-blue-400 text-sm font-semibold"
            >
              برو به امروز
            </button>
          </div>

          {/* Calendar area */}
          <div className="relative p-4 md:p-6">
            <button
              type="button"
              onClick={() => navigate(1)}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className={cn("grid gap-8 md:gap-12", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <CalendarGrid
                year={viewDate.year}
                month={viewDate.month}
                range={range}
                onSelect={handleSelect}
                isJalali={isJalali}
              />

              {!isMobile && (
                <CalendarGrid
                  year={viewDate.month === 11 ? viewDate.year + 1 : viewDate.year}
                  month={(viewDate.month + 1) % 12}
                  range={range}
                  onSelect={handleSelect}
                  isJalali={isJalali}
                />
              )}
            </div>
          </div>

          {/* Footer: dates + time inputs */}
          <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm">
                {isComplete ? (
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{displayText}</span>
                ) : range.start ? (
                  <span className="text-gray-500 dark:text-gray-300">پایان را انتخاب کنید</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-300">شروع را انتخاب کنید</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Clock className="h-4 w-4" />
                    ساعت تحویل
                  </span>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className={cn(
                      "h-9 rounded-lg px-3",
                      "border border-gray-200 dark:border-white/10",
                      "bg-white dark:bg-background",
                      "text-gray-900 dark:text-gray-100"
                    )}
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Clock className="h-4 w-4" />
                    ساعت عودت
                  </span>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className={cn(
                      "h-9 rounded-lg px-3",
                      "border border-gray-200 dark:border-white/10",
                      "bg-white dark:bg-background",
                      "text-gray-900 dark:text-gray-100"
                    )}
                  />
                </label>

                <Button variant="primary" onClick={confirm} disabled={!isComplete} className="h-9 px-5">
                  تایید
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
