"use client";

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
import { useLocale, useTranslations } from "next-intl";

type CalendarGridProps = {
  year: number;
  month: number; // 0..11
  range: Range;
  onSelect: (date: Date) => void;
  isJalali: boolean;

  hoverDate?: Date | null;
  onHover?: (date: Date | null) => void;
};

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

const RTL_LOCALES = new Set(["fa", "ar"]);

function formatGregorianMonthYear(year: number, month: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
      new Date(year, month, 1),
    );
  } catch {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
      new Date(year, month, 1),
    );
  }
}

export function CalendarGrid({
  year,
  month,
  range,
  onSelect,
  isJalali,
  hoverDate,
  onHover,
}: CalendarGridProps) {
  const locale = useLocale();
  const t = useTranslations("calendarGrid");

  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  // ✅ radius درست برای LTR/RTL
  const startRound = dir === "rtl" ? "rounded-r-xl" : "rounded-l-xl";
  const endRound = dir === "rtl" ? "rounded-l-xl" : "rounded-r-xl";

  const daysInMonth = getDaysInMonth(year, month, isJalali ? "jalali" : "gregorian");
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthStartDateRaw = isJalali ? jalaliToDate(year, month, 1) : new Date(year, month, 1);
  const monthStartDate = atNoon(monthStartDateRaw);
  const firstDay = monthStartDate.getDay();

  const blanksCount = isJalali ? (firstDay + 1) % 7 : firstDay;
  const blanks = Array.from({ length: blanksCount });

  const weekDays = isJalali ? weekDaysJalali : weekDaysGregorian;

  const effectiveEnd =
    range.start
      ? range.end
        ? atNoon(range.end)
        : hoverDate && isGteDay(hoverDate, range.start)
          ? atNoon(hoverDate)
          : null
      : null;

  const title = isJalali
    ? `${jalaliMonthNames[month]} ${persianNumbers(year)}`
    : formatGregorianMonthYear(year, month, locale);

  return (
    <div className="w-full" dir={dir}>
      <h3 className="text-center font-bold text-lg mb-4">{title}</h3>

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
          const isEndReal = isSameDaySafe(range.end, date);

          const isEndHover =
            !range.end &&
            !!range.start &&
            !!hoverDate &&
            isGteDay(hoverDate, range.start) &&
            isSameDaySafe(hoverDate, date);

          const isEnd = isEndReal || isEndHover;

          // ✅ اگر start و end یک روز باشند → کاملاً گرد
          const isSingleDay = isStart && isEndReal;

          const inRange =
            range.start && effectiveEnd ? isBetween(date, range.start, effectiveEnd) : false;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(dateRaw)}
              onMouseEnter={() => onHover?.(dateRaw)}
              onMouseLeave={() => onHover?.(null)}
              className={cn(
                "relative h-10 w-full flex items-center justify-center text-sm transition-all",

                // ✅ start
                isStart &&
                  cn(
                    "bg-orange-400 dark:bg-orange-400 text-black font-bold z-10",
                    isSingleDay ? "rounded-xl" : startRound,
                  ),

                // ✅ end
                isEnd &&
                  cn(
                    "bg-orange-400 dark:bg-orange-400 text-black font-bold z-10",
                    isSingleDay ? "rounded-xl" : endRound,
                  ),

                // range
                inRange && "bg-orange-300/30 dark:bg-orange-300/20",

                // hover
                !isStart &&
                  !isEnd &&
                  !inRange &&
                  "hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl",
              )}
              aria-label={isStart ? t("aria.start") : isEnd ? t("aria.end") : t("aria.day")}
            >
              {isJalali ? persianNumbers(day) : day}

              {isStart && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                  {t("tooltips.start")}
                </div>
              )}

              {isEnd && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                  {t("tooltips.end")}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}