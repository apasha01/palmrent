'use client';

import {
  getDaysInMonth,
  jalaliMonthNames,
  persianNumbers,
  weekDaysJalali,
  weekDaysGregorian,
  jalaliToDate,
} from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import type { Range } from "./date-range-picker"

type CalendarGridProps = {
  year: number
  month: number
  range: Range
  onSelect: (date: Date) => void
  isJalali: boolean
}

export function CalendarGrid({ year, month, range, onSelect, isJalali }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month, isJalali ? "jalali" : "gregorian")
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // ✅ برای محاسبه اول ماه هم باید تاریخ درست ساخته بشه
  const monthStartDate = isJalali ? jalaliToDate(year, month, 1) : new Date(year, month, 1)
  const firstDay = monthStartDate.getDay()

  const blanksCount = isJalali ? (firstDay + 1) % 7 : firstDay
  const blanks = Array.from({ length: blanksCount })

  const isSameDay = (a?: Date | null, b?: Date | null) => a && b && a.toDateString() === b.toDateString()
  const weekDays = isJalali ? weekDaysJalali : weekDaysGregorian

  return (
    <div className="w-full">
      <h3 className="text-center font-bold text-lg mb-4">
        {isJalali
          ? `${jalaliMonthNames[month]} ${persianNumbers(year)}`
          : new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" })}
      </h3>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="text-xs text-muted-foreground py-2 font-medium">
            {day}
          </div>
        ))}

        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          // ✅ این خط مهم‌ترین اصلاحه
          const date = isJalali ? jalaliToDate(year, month, day) : new Date(year, month, day)

          const isStart = isSameDay(range.start, date)
          const isEnd = isSameDay(range.end, date)
          const inRange = range.start && range.end && date > range.start && date < range.end

          return (
            <button
              key={day}
              onClick={() => onSelect(date)}
 className={cn(
  "relative h-10 w-full flex items-center justify-center text-sm transition-all",
  isStart && "bg-orange-400 dark:bg-orange-400 text-black font-bold rounded-r-xl z-10",
  isEnd && "bg-orange-400 dark:bg-orange-400 text-black font-bold rounded-l-xl z-10",
  inRange && "bg-orange-300/30 dark:bg-orange-300/20",
  !isStart && !isEnd && !inRange && "hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl",
)}

            >
              {isJalali ? persianNumbers(day) : day}

              {isStart && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                  تاریخ رفت
                </div>
              )}

              {isEnd && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                  تاریخ برگشت
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
