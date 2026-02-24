/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { CalendarGrid } from "./calendar-grid";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, ChevronLeft, ChevronRight, X, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { getJalaliParts, formatJalaliDate, formatGregorianDate } from "@/lib/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale, useTranslations } from "next-intl";

export type Range = { start: Date | null; end: Date | null };

type Props = {
  initialRange?: Range;

  /**
   * اگر پاس بدی، همین اولویت داره.
   * اگر پاس ندی => بر اساس locale تصمیم می‌گیریم:
   * fa/ar => jalali true
   * en/tr => jalali false
   */
  defaultIsJalali?: boolean;

  initialTimes?: { deliveryTime?: string; returnTime?: string };
  onConfirm?: (range: { start: Date; end: Date; deliveryTime: string; returnTime: string }) => void;
  onClear?: () => void;
  trigger: React.ReactNode;

  /**
   * ✅ فقط بار اول که باز میشه (در همین mount)
   * اگر true باشد => هیچ انتخاب پیش‌فرضی نشان نده
   * دفعات بعد (همین صفحه) از initialRange استفاده می‌کند
   */
  noDefaultSelectionOnFirstOpen?: boolean;
};

const EMPTY: Range = { start: null, end: null };

const RTL_LOCALES = new Set(["fa", "ar"]);
const JALALI_DEFAULT_LOCALES = new Set(["fa", "ar"]); // فقط fa/ar پیش‌فرض شمسی

/** همیشه HH:mm */
function normalizeTimeLocal(t?: string | null) {
  const s = String(t ?? "").trim();
  if (!s) return "10:00";

  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "10:00";

  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** ضد DST/Timezone: تاریخ‌ها روی 12:00 قفل */
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
  onClear,
  trigger,
  noDefaultSelectionOnFirstOpen = false,
}: Props) {
  const isMobile = useIsMobile();

  const locale = useLocale();
  const t = useTranslations("dateRangePicker");

  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  const computedDefaultIsJalali =
    typeof defaultIsJalali === "boolean" ? defaultIsJalali : JALALI_DEFAULT_LOCALES.has(locale);

  const [isJalali, setIsJalali] = React.useState(computedDefaultIsJalali);
  const [isOpen, setIsOpen] = React.useState(false);

  const [range, setRange] = React.useState<Range>(() => normalizeRange(initialRange));

  const [deliveryTime, setDeliveryTime] = React.useState<string>(
    normalizeTimeLocal(initialTimes?.deliveryTime),
  );
  const [returnTime, setReturnTime] = React.useState<string>(normalizeTimeLocal(initialTimes?.returnTime));

  // hover برای انتخاب end موقت
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  // فقط بار اول خالی
  const firstOpenRef = React.useRef(true);

  React.useEffect(() => {
    if (!isOpen) return;

    // ✅ بار اول باز شدن: خالی
    if (noDefaultSelectionOnFirstOpen && firstOpenRef.current) {
      setRange(EMPTY);
      setDeliveryTime(normalizeTimeLocal(initialTimes?.deliveryTime));
      setReturnTime(normalizeTimeLocal(initialTimes?.returnTime));
      setHoverDate(null);

      firstOpenRef.current = false;
      return;
    }

    // دفعات بعد: از prop ها hydrate
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

  // view اولیه
  const jToday = getJalaliParts(new Date());
  const [viewDate, setViewDate] = React.useState(() => {
    if (isJalali) return { year: jToday.year, month: jToday.month };
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  React.useEffect(() => {
    if (isJalali) {
      const currentJalali = getJalaliParts(new Date());
      setViewDate({ year: currentJalali.year, month: currentJalali.month });
    } else {
      const now = new Date();
      setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    }
  }, [isJalali]);

  // اگر زبان عوض شد و prop نداده بود => پیش‌فرض بر اساس locale
  React.useEffect(() => {
    if (typeof defaultIsJalali === "boolean") return;
    setIsJalali(JALALI_DEFAULT_LOCALES.has(locale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const handleSelect = (date: Date) => {
    const d = atNoon(date);

    // شروع جدید
    if (!range.start || range.end) {
      setRange({ start: d, end: null });
      setHoverDate(null);
      return;
    }

    const s = atNoon(range.start);

    // end باید بعد از start باشد
    if (d.getTime() < s.getTime()) return;

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
    if (isJalali) {
      const currentJalali = getJalaliParts(new Date());
      setViewDate({ year: currentJalali.year, month: currentJalali.month });
    } else {
      const now = new Date();
      setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    }
  };

  const formatDate = (date: Date) => (isJalali ? formatJalaliDate(date) : formatGregorianDate(date));

  const isComplete = Boolean(range.start && range.end);
  const displayText = isComplete ? `${formatDate(range.start!)} | ${formatDate(range.end!)}` : "";

  const clearRange = () => {
    setRange({ start: null, end: null });
    setDeliveryTime("10:00");
    setReturnTime("10:00");
    setHoverDate(null);
    onClear?.();
  };

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

  const toggleCalendarType = () => setIsJalali((p) => !p);
  const toggleLabel = isJalali ? t("switchToGregorian") : t("switchToJalali");

  const calendarContent = (
    <div
      className={cn(
        "overflow-hidden",
        !isMobile && "rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl",
        "bg-white dark:bg-background",
      )}
      dir={dir}
    >
      {/* Top controls */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={clearRange}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-300 text-sm font-semibold"
        >
          <X className="h-4 w-4" />
          {t("clear")}
        </button>

        <button
          type="button"
          onClick={toggleCalendarType}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold"
        >
          <Calendar className="h-4 w-4" />
          {toggleLabel}
        </button>

        <button type="button" onClick={goToToday} className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
          {t("goToToday")}
        </button>
      </div>

      {/* Calendar area */}
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

        <div className={cn("grid gap-8 md:gap-12 px-8", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <CalendarGrid
            year={viewDate.year}
            month={viewDate.month}
            range={range}
            onSelect={handleSelect}
            isJalali={isJalali}
            hoverDate={hoverDate}
            onHover={(d) => setHoverDate(d ? atNoon(d) : null)}
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
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
        <div className={cn("flex gap-3", isMobile ? "flex-col" : "flex-row items-center justify-between")}>
          <div className="text-sm">
            {isComplete ? (
              <span className="font-semibold text-gray-800 dark:text-gray-100">{displayText}</span>
            ) : range.start ? (
              <span className="text-gray-500 dark:text-gray-300">{t("selectEnd")}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-300">{t("selectStart")}</span>
            )}
          </div>

          <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-row items-center")}>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4" />
                {t("deliveryTime")}
              </span>
              <input
                type="time"
                value={normalizeTimeLocal(deliveryTime)}
                onChange={(e) => setDeliveryTime(normalizeTimeLocal(e.target.value))}
                className={cn(
                  "h-9 rounded-lg px-3",
                  "border border-gray-200 dark:border-white/10",
                  "bg-white dark:bg-background",
                  "text-gray-900 dark:text-gray-100",
                )}
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="h-4 w-4" />
                {t("returnTime")}
              </span>
              <input
                type="time"
                value={normalizeTimeLocal(returnTime)}
                onChange={(e) => setReturnTime(normalizeTimeLocal(e.target.value))}
                className={cn(
                  "h-9 rounded-lg px-3",
                  "border border-gray-200 dark:border-white/10",
                  "bg-white dark:bg-background",
                  "text-gray-900 dark:text-gray-100",
                )}
              />
            </label>

            <Button onClick={confirm} disabled={!isComplete} className={cn("h-9 px-5", isMobile && "w-full mt-2")}>
              {t("confirm")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // موبایل: 6 ماه اسکرولی
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

        <SheetContent side="right" className="p-0 w-full h-full flex flex-col [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/10" dir={dir}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-semibold"
            >
              <ArrowRight className="h-5 w-5" />
              {t("mobileTitle")}
            </button>

            <button
              type="button"
              onClick={toggleCalendarType}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold"
            >
              <Calendar className="h-4 w-4" />
              {toggleLabel}
            </button>
          </div>

          {/* Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4" dir={dir}>
            <div className="flex flex-col gap-8">{generateScrollableMonths()}</div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-background p-4" dir={dir}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t("delivery")}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {range.start ? formatDate(range.start) : t("pick")}
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    value={normalizeTimeLocal(deliveryTime)}
                    onChange={(e) => setDeliveryTime(normalizeTimeLocal(e.target.value))}
                    className={cn(
                      "h-9 w-full rounded-lg px-3 text-sm",
                      "border border-gray-200 dark:border-white/10",
                      "bg-white dark:bg-background",
                      "text-gray-900 dark:text-gray-100",
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t("return")}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {range.end ? formatDate(range.end) : t("pick")}
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    value={normalizeTimeLocal(returnTime)}
                    onChange={(e) => setReturnTime(normalizeTimeLocal(e.target.value))}
                    className={cn(
                      "h-9 w-full rounded-lg px-3 text-sm",
                      "border border-gray-200 dark:border-white/10",
                      "bg-white dark:bg-background",
                      "text-gray-900 dark:text-gray-100",
                    )}
                  />
                </div>
              </div>
            </div>

            <Button onClick={confirm} disabled={!isComplete} className="w-full h-12 text-base font-semibold rounded-xl">
              {t("confirmAndSearch")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // دسکتاپ
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger as any}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        className={cn(
          "p-0 border-0 bg-transparent shadow-none w-auto max-w-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        )}
      >
        <div className="w-[92vw] max-w-205">{calendarContent}</div>
      </PopoverContent>
    </Popover>
  );
}