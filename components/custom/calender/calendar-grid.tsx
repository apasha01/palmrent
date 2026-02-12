'use client';

import {
  getDaysInMonth,
  jalaliMonthNames,
  persianNumbers,
  weekDaysJalali,
  weekDaysGregorian,
  jalaliToDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Range } from "./date-range-picker";

type CalendarGridProps = {
  year: number;
  month: number; // 0..11
  range: Range;
  onSelect: (date: Date) => void;
  isJalali: boolean;

  // hover support
  hoverDate?: Date | null;
  onHover?: (date: Date | null) => void;
};

/** ✅ جلوگیری از باگ timezone/DST: همه تاریخ‌ها را به 12 ظهر تبدیل می‌کنیم */
const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const isSameDaySafe = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;
  const A = atNoon(a);
  const B = atNoon(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDate() === B.getDate()
  );
};

const isGteDay = (a: Date, b: Date) => atNoon(a).getTime() >= atNoon(b).getTime();

const isBetween = (d: Date, start: Date, end: Date) => {
  const t = atNoon(d).getTime();
  return t > atNoon(start).getTime() && t < atNoon(end).getTime();
};

export function CalendarGrid({
  year,
  month,
  range,
  onSelect,
  isJalali,
  hoverDate,
  onHover,
}: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month, isJalali ? "jalali" : "gregorian");
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthStartDateRaw = isJalali ? jalaliToDate(year, month, 1) : new Date(year, month, 1);
  const monthStartDate = atNoon(monthStartDateRaw);
  const firstDay = monthStartDate.getDay();

  const blanksCount = isJalali ? (firstDay + 1) % 7 : firstDay;
  const blanks = Array.from({ length: blanksCount });

  const weekDays = isJalali ? weekDaysJalali : weekDaysGregorian;

  // ✅ end موثر: فقط وقتی end واقعی داریم یا hover معتبر داریم
  const effectiveEnd =
    range.start
      ? range.end
        ? atNoon(range.end)
        : hoverDate && isGteDay(hoverDate, range.start)
          ? atNoon(hoverDate)
          : null
      : null;

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
          const dateRaw = isJalali ? jalaliToDate(year, month, day) : new Date(year, month, day);
          const date = atNoon(dateRaw);

          const isStart = isSameDaySafe(range.start, date);

          // ✅ end واقعی
          const isEndReal = isSameDaySafe(range.end, date);

          // ✅ end موقت hover (فقط وقتی end هنوز انتخاب نشده)
          const isEndHover =
            !range.end &&
            !!range.start &&
            !!hoverDate &&
            isGteDay(hoverDate, range.start) &&
            isSameDaySafe(hoverDate, date);

          // ✅ دیگه end پیش‌فرض نداریم
          const isEnd = isEndReal || isEndHover;

          // ✅ فقط وقتی effectiveEnd داریم، رنج روشن میشه
          const inRange =
            range.start && effectiveEnd ? isBetween(date, range.start, effectiveEnd) : false;

          return (
            <button
              key={day}
              onClick={() => onSelect(dateRaw)}
              onMouseEnter={() => onHover?.(dateRaw)}
              onMouseLeave={() => onHover?.(null)}
              className={cn(
                "relative h-10 w-full flex items-center justify-center text-sm transition-all",

                // start
                isStart && "bg-orange-400 dark:bg-orange-400 text-black font-bold rounded-r-xl z-10",

                // end (real/hover)
                isEnd && "bg-orange-400 dark:bg-orange-400 text-black font-bold rounded-l-xl z-10",

                // range (فقط با hover یا end واقعی)
                inRange && "bg-orange-300/30 dark:bg-orange-300/20",

                // hover style for normal days
                !isStart && !isEnd && !inRange && "hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"
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
          );
        })}
      </div>
    </div>
  );
}
