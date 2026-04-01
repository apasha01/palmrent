/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { CalendarGrid } from "./calendar-grid";
import { NativeTimeSelect } from "./native-time-select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getJalaliParts,
  formatJalaliDate,
  formatGregorianDate,
  getRangeDaysCount,
  weekDaysJalali,
  weekDaysGregorian,
} from "@/lib/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale, useTranslations } from "next-intl";
import CalendarArrow from "./CalenderArrowIcon";

export type Range = { start: Date | null; end: Date | null };

type Props = {
  initialRange?: Range;
  defaultIsJalali?: boolean;
  initialTimes?: { deliveryTime?: string; returnTime?: string };
  onConfirm?: (range: {
    start: Date;
    end: Date;
    deliveryTime: string;
    returnTime: string;
  }) => void;
  trigger: React.ReactNode;
  noDefaultSelectionOnFirstOpen?: boolean;

  /**
   * دیفالت false
   * یعنی روزهای گذشته غیرفعال هستند
   */
  allowPastDates?: boolean;
};

const EMPTY: Range = { start: null, end: null };

const RTL_LOCALES = new Set(["fa", "ar"]);

// ✅ فقط fa مجاز به استفاده از تقویم جلالی است
const JALALI_ALLOWED_LOCALE = "fa";

function normalizeTimeLocal(t?: string | null) {
  const s = String(t ?? "").trim();
  if (!s) return "10:00";

  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "10:00";

  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));

  const roundedMinutes = mm < 15 ? 0 : mm < 45 ? 30 : 0;
  const adjustedHour = mm >= 45 ? Math.min(23, hh + 1) : hh;

  return `${String(adjustedHour).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
}

const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const normalizeRange = (r?: Range | null): Range => {
  if (!r) return EMPTY;
  return {
    start: r.start ? atNoon(r.start) : null,
    end: r.end ? atNoon(r.end) : null,
  };
};

export function DateRangePickerPopover({
  initialRange = EMPTY,
  defaultIsJalali,
  initialTimes,
  onConfirm,
  trigger,
  noDefaultSelectionOnFirstOpen = false,
  allowPastDates = false,
}: Props) {
  const isMobile = useIsMobile();

  const locale = useLocale();
  const t = useTranslations("dateRangePicker");

  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  // ✅ فقط locale === "fa" مجاز است — ar و بقیه میلادی می‌گیرند
  const canUseJalali = locale === JALALI_ALLOWED_LOCALE;

  const computedDefaultIsJalali =
    typeof defaultIsJalali === "boolean" ? defaultIsJalali : canUseJalali;

  const [isJalali, setIsJalali] = React.useState(computedDefaultIsJalali);
  const [isOpen, setIsOpen] = React.useState(false);

  const [range, setRange] = React.useState<Range>(() =>
    normalizeRange(initialRange),
  );

  const [deliveryTime, setDeliveryTime] = React.useState<string>(
    normalizeTimeLocal(initialTimes?.deliveryTime),
  );
  const [returnTime, setReturnTime] = React.useState<string>(
    normalizeTimeLocal(initialTimes?.returnTime),
  );

  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  const firstOpenRef = React.useRef(true);
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    if (noDefaultSelectionOnFirstOpen && firstOpenRef.current) {
      setRange(EMPTY);
      setDeliveryTime(normalizeTimeLocal(initialTimes?.deliveryTime));
      setReturnTime(normalizeTimeLocal(initialTimes?.returnTime));
      setHoverDate(null);

      firstOpenRef.current = false;
      return;
    }

    setRange(normalizeRange(initialRange ?? EMPTY));
    setDeliveryTime(normalizeTimeLocal(initialTimes?.deliveryTime));
    setReturnTime(normalizeTimeLocal(initialTimes?.returnTime));
    setHoverDate(null);

    firstOpenRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    initialRange,
    initialTimes?.deliveryTime,
    initialTimes?.returnTime,
    noDefaultSelectionOnFirstOpen,
  ]);

  const jToday = getJalaliParts(new Date());
  const [viewDate, setViewDate] = React.useState(() => {
    if (computedDefaultIsJalali)
      return { year: jToday.year, month: jToday.month };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  React.useEffect(() => {
    if (!canUseJalali) {
      // ✅ اگر locale جلالی مجاز نیست، مستقیم به میلادی برو
      setIsJalali(false);
      const now = new Date();
      setViewDate({ year: now.getFullYear(), month: now.getMonth() });
      return;
    }

    if (isJalali) {
      const currentJalali = getJalaliParts(new Date());
      setViewDate({ year: currentJalali.year, month: currentJalali.month });
    } else {
      const now = new Date();
      setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    }
  }, [isJalali, canUseJalali]);

  React.useEffect(() => {
    if (typeof defaultIsJalali === "boolean") return;
    // ✅ وقتی locale عوض میشه، جلالی بودن رو بر اساس canUseJalali (فقط fa) تنظیم کن
    setIsJalali(canUseJalali);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const handleSelect = (date: Date) => {
    const d = atNoon(date);

    if (!range.start || range.end) {
      setRange({ start: d, end: null });
      setHoverDate(null);
      return;
    }

    const s = atNoon(range.start);

    if (d.getTime() < s.getTime()) {
      setRange({ start: d, end: null });
      setHoverDate(null);
      return;
    }

    setRange({ start: s, end: d });
    setHoverDate(null);
  };

  const navigate = (dirStep: number) => {
    let newMonth = viewDate.month + dirStep;
    let newYear = viewDate.year;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    setViewDate({ year: newYear, month: newMonth });
  };

  const goToToday = () => {
    if (isJalali && canUseJalali) {
      const currentJalali = getJalaliParts(new Date());
      setViewDate({ year: currentJalali.year, month: currentJalali.month });
    } else {
      const now = new Date();
      setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    }

    if (isMobile && mobileScrollRef.current) {
      requestAnimationFrame(() => {
        mobileScrollRef.current?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }
  };

  const formatDate = (date: Date) =>
    isJalali ? formatJalaliDate(date) : formatGregorianDate(date);

  const isComplete = Boolean(range.start && range.end);
  const displayText = isComplete
    ? `${formatDate(range.start!)} | ${formatDate(range.end!)}`
    : "";
  const daysCount = isComplete
    ? getRangeDaysCount(range.start!, range.end!)
    : 0;

  const confirm = () => {
    if (!range.start || !range.end) return;

    const dt = normalizeTimeLocal(deliveryTime);
    const rt = normalizeTimeLocal(returnTime);

    onConfirm?.({
      start: atNoon(range.start),
      end: atNoon(range.end),
      deliveryTime: dt,
      returnTime: rt,
    });

    setIsOpen(false);
  };

  const toggleCalendarType = () => {
    if (!canUseJalali) return;
    setIsJalali((p) => !p);
  };

  const toggleLabel = isJalali ? t("switchToGregorian") : t("switchToJalali");

  const confirmButtonText = isComplete
    ? `${t("confirm")} (${daysCount} ${t("days")})`
    : t("confirm");
  const confirmAndSearchText = isComplete
    ? `${t("confirmAndSearch")} (${daysCount} ${t("days")})`
    : t("confirmAndSearch");

  const mobileWeekDays = isJalali ? weekDaysJalali : weekDaysGregorian;

  const calendarContent = (
    <div
      className={cn(
        "overflow-hidden",
        !isMobile &&
          "rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl",
        "bg-white dark:bg-background",
      )}
      dir={dir}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={goToToday}
          className="text-blue-600 dark:text-blue-400 text-sm font-semibold"
        >
          {t("goToToday")}
        </button>

        {/* ✅ دکمه تغییر تقویم فقط برای fa نشان داده میشه */}
        {canUseJalali && (
          <button
            type="button"
            onClick={toggleCalendarType}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold"
          >
            <Calendar className="h-4 w-4" />
            {toggleLabel}
          </button>
        )}
      </div>

      <div className={cn("relative", isMobile ? "px-2 py-4" : "p-4 md:p-6")}>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full z-10"
          aria-label="next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full z-10"
          aria-label="prev"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className={cn(
            "grid gap-4 px-8",
            isMobile ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          <CalendarGrid
            year={viewDate.year}
            month={viewDate.month}
            range={range}
            onSelect={handleSelect}
            isJalali={isJalali}
            hoverDate={hoverDate}
            onHover={(d) => setHoverDate(d ? atNoon(d) : null)}
            isMobile={isMobile}
            allowPastDates={allowPastDates}
          />

          {!isMobile && (
            <CalendarGrid
              year={viewDate.month === 11 ? viewDate.year + 1 : viewDate.year}
              month={(viewDate.month + 1) % 12}
              range={range}
              onSelect={handleSelect}
              isJalali={isJalali}
              hoverDate={hoverDate}
              onHover={(d) => setHoverDate(d ? atNoon(d) : null)}
              isMobile={isMobile}
              allowPastDates={allowPastDates}
            />
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
        <div
          className={cn(
            "flex gap-3",
            isMobile ? "flex-col" : "flex-row items-center justify-between",
          )}
        >
          <div className="text-sm">
            {isComplete ? (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {displayText}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  {daysCount} {t("days")}
                </span>
              </div>
            ) : range.start ? (
              <span className="text-gray-500 dark:text-gray-300">
                {t("selectEnd")}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-300">
                {t("selectStart")}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex gap-2",
              isMobile ? "flex-col" : "flex-row items-center",
            )}
          >
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4" />
                {t("deliveryTime")}
              </span>

              <NativeTimeSelect
                value={deliveryTime}
                onChange={(value) => setDeliveryTime(normalizeTimeLocal(value))}
                className={cn("h-9")}
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4" />
                {t("returnTime")}
              </span>

              <NativeTimeSelect
                value={returnTime}
                onChange={(value) => setReturnTime(normalizeTimeLocal(value))}
                className={cn("h-9")}
              />
            </label>

            <Button
              onClick={confirm}
              disabled={!isComplete}
              className={cn("h-9 px-5", isMobile && "w-full mt-2")}
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const generateScrollableMonths = () => {
    const months: React.ReactNode[] = [];
    let currentYear = viewDate.year;
    let currentMonth = viewDate.month;

    for (let i = 0; i < 6; i++) {
      months.push(
        <CalendarGrid
          key={`${currentYear}-${currentMonth}`}
          year={currentYear}
          month={currentMonth}
          range={range}
          onSelect={handleSelect}
          isJalali={isJalali}
          hoverDate={hoverDate}
          onHover={(d) => setHoverDate(d ? atNoon(d) : null)}
          hideWeekDays
          isMobile
          allowPastDates={allowPastDates}
        />,
      );

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return months;
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{trigger as any}</SheetTrigger>

        <SheetContent
          disableSpacingAndShadow
          side="right"
          className="p-0! w-full h-full flex flex-col bg-white text-black border-0 [&>button]:hidden"
        >
          <div
            className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white"
            dir={dir}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-gray-800 font-semibold"
            >
              <ArrowRight className="h-5 w-5" />
              {t("mobileTitle")}
            </button>

            <div className="flex items-center gap-3">
              {/* ✅ دکمه تغییر تقویم فقط برای fa */}
              {canUseJalali && (
                <button
                  type="button"
                  onClick={toggleCalendarType}
                  className="flex items-center gap-2 text-blue-600 text-sm font-semibold"
                >
                  <Calendar className="h-4 w-4" />
                  {toggleLabel}
                </button>
              )}
            </div>
          </div>

          <div className="px-4  pb-2 bg-gray-50" dir={dir}>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {mobileWeekDays.map((day) => (
                <div
                  key={day}
                  className="text-xs text-muted-foreground py-2 font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div
            ref={mobileScrollRef}
            className="flex-1 overflow-y-auto px-4 mt-2 pb-4 bg-white"
            dir={dir}
          >
            <div className="flex flex-col gap-4">
              {generateScrollableMonths()}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-4" dir={dir}>
            <div className="rounded-lg border border-gray-200 bg-white py-2 mb-4 ">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="px-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 ">
                      <CalendarArrow
                        direction="left"
                        className="text-gray-600 size-4"
                      />
                      <span className="text-xs font-semibold text-gray-600">
                        {t("deliveryTime")}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-blue-600">
                        {range.start ? formatDate(range.start) : t("pick")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center  gap-3">
                    <NativeTimeSelect
                      value={deliveryTime}
                      onChange={(value) =>
                        setDeliveryTime(normalizeTimeLocal(value))
                      }
                      className="h-9 min-w-24 border-0 px-2 text-sm font-bold shadow-none"
                    />
                  </div>
                </div>

                <div className="px-2">
                   <div className="flex justify-between items-center">

                  <div className="flex items-center gap-1">
                    <CalendarArrow
                      direction="right"
                      className="text-gray-600 size-4"
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      {t("returnTime")}
                    </span>
                  </div>


                    <div>

                    <span className="text-xs font-semibold text-blue-600">
                      {range.end ? formatDate(range.end) : t("pick")}
                    </span>
                    </div>

                   </div>

                  <div className="flex items-center justify-between gap-3">


                    <NativeTimeSelect
                      value={returnTime}
                      onChange={(value) =>
                        setReturnTime(normalizeTimeLocal(value))
                      }
                      className="h-9 min-w-24 border-0 px-2 text-sm font-bold shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={confirm}
              disabled={!isComplete}
              className="w-full h-14 text-lg font-semibold rounded-lg"
            >
              {confirmAndSearchText}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger as any}</DialogTrigger>
      <DialogContent showCloseButton={false} className={cn("p-0! min-w-210")}>
        {calendarContent}
      </DialogContent>
    </Dialog>
  );
}