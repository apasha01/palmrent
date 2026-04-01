"use client";

import * as React from "react";
import {
  getDaysInMonth,
  jalaliMonthNames,
  weekDaysJalali,
  weekDaysGregorian,
  jalaliToDate,
  isTodayDate,
  isPastDay,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Range } from "./date-range-picker";
import { useLocale, useTranslations } from "next-intl";

type CalendarGridProps = {
  year: number;
  month: number;
  range: Range;
  onSelect: (date: Date) => void;
  isJalali: boolean;
  hoverDate?: Date | null;
  onHover?: (date: Date | null) => void;
  hideWeekDays?: boolean;
  isMobile?: boolean;
  allowPastDates?: boolean;
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

function getGregorianDisplayLocale(locale: string) {
  switch (locale) {
    case "tr":
      return "tr-TR";
    case "ar":
      return "ar-SA";
    case "en":
      return "en-US";
    case "fa":
    default:
      return "en-US";
  }
}

function formatGregorianMonthYear(year: number, month: number, locale: string) {
  const displayLocale = getGregorianDisplayLocale(locale);

  try {
    return new Intl.DateTimeFormat(displayLocale, {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month, 1));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month, 1));
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
  hideWeekDays = false,
  isMobile = false,
  allowPastDates = false,
}: CalendarGridProps) {
  const locale = useLocale();
  const t = useTranslations("calendarGrid");

  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  const startRound = dir === "rtl" ? "rounded-r-2xl" : "rounded-l-2xl";
  const endRound = dir === "rtl" ? "rounded-l-2xl" : "rounded-r-2xl";

  const [hoveredDay, setHoveredDay] = React.useState<Date | null>(null);

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
    ? `${jalaliMonthNames[month]} ${year}`
    : formatGregorianMonthYear(year, month, locale);

  return (
    <div className="w-full" dir={dir}>
      <h3 className={cn("text-center font-bold mb-2", isMobile ? "text-sm" : "text-lg")}>
        {title}
      </h3>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {!hideWeekDays &&
          weekDays.map((day) => (
            <div key={day} className="text-xs text-muted-foreground py-1.5 font-medium">
              {day}
            </div>
          ))}

        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="h-11 w-full" />
        ))}

        {days.map((day) => {
          const dateRaw = isJalali ? jalaliToDate(year, month, day) : new Date(year, month, day);
          const date = atNoon(dateRaw);

          const disabledPast = !allowPastDates && isPastDay(date);

          const isToday = isTodayDate(date);
          const isStart = isSameDaySafe(range.start, date);
          const isEndReal = isSameDaySafe(range.end, date);

          const isEndHover =
            !range.end &&
            !!range.start &&
            !!hoverDate &&
            isGteDay(hoverDate, range.start) &&
            isSameDaySafe(hoverDate, date) &&
            !disabledPast;

          const isEnd = isEndReal || isEndHover;
          const isSingleDay = isStart && isEndReal;

          const inRange =
            range.start && effectiveEnd ? isBetween(date, range.start, effectiveEnd) : false;

          const isHovered = isSameDaySafe(hoveredDay, date);

          const showStartTooltip =
            !isMobile && isHovered && !!range.start && isSameDaySafe(range.start, date);

          const showEndTooltip =
            !isMobile && isHovered && !!range.end && isSameDaySafe(range.end, date);

          return (
            <div
              key={day}
              className={cn(
                "relative h-11 w-full flex items-center justify-center",
                inRange && "bg-blue-300/30 dark:bg-blue-300/20",
                isStart && !isSingleDay && cn("bg-blue-300/30 dark:bg-blue-300/20", startRound),
                isEnd && !isSingleDay && cn("bg-blue-300/30 dark:bg-blue-300/20", endRound),
              )}
            >
              <button
                type="button"
                disabled={disabledPast}
                onClick={() => {
                  if (disabledPast) return;
                  onSelect(dateRaw);
                }}
                onMouseEnter={() => {
                  if (disabledPast) return;
                  if (!isMobile) {
                    setHoveredDay(dateRaw);
                    onHover?.(dateRaw);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHoveredDay(null);
                    onHover?.(null);
                  }
                }}
                className={cn(
                  "relative z-10 flex items-center justify-center text-[15px] transition-all border border-transparent",
                  "h-11 min-w-11 px-2",

                  isToday && !isStart && !isEnd && "border-gray-200 rounded-md",

                  isStart &&
                    cn(
                      "bg-blue-400 dark:bg-blue-400 text-black font-bold",
                      isSingleDay ? "rounded-lg" : startRound,
                      !isSingleDay && "h-11 w-full",
                    ),

                  isEnd &&
                    cn(
                      "bg-blue-400 dark:bg-blue-400 text-black font-bold",
                      isSingleDay ? "rounded-lg" : endRound,
                      !isSingleDay && "h-11 w-full",
                    ),

                  !isStart &&
                    !isEnd &&
                    !inRange &&
                    !disabledPast &&
                    "hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer",

                  disabledPast &&
                    !isStart &&
                    !isEnd &&
                    "rounded-lg text-gray-600 dark:text-gray-600 cursor-not-allowed opacity-80",
                )}
                aria-label={isStart ? t("aria.start") : isEnd ? t("aria.end") : t("aria.day")}
              >
                <span className="relative inline-flex items-center justify-center">
                  {day}

                  {disabledPast && (
                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[175%] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] bg-gray-600 opacity-70" />
                  )}
                </span>

                {showStartTooltip && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                    {t("tooltips.start")}
                  </div>
                )}

                {showEndTooltip && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                    {t("tooltips.end")}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}