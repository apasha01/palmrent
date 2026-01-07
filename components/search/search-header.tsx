/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Clock, Search } from "lucide-react";
import { DateRangePickerPopover } from "@/components/custom/calender/date-range-picker";
import { jalaliToDate, formatJalaliDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import {
  changeCarDates,
  changeDeliveryTime,
  changeReturnTime,
} from "@/redux/slices/globalSlice";

function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return input
    .split("")
    .map((ch) => {
      const faIndex = fa.indexOf(ch);
      if (faIndex !== -1) return String(faIndex);
      const arIndex = ar.indexOf(ch);
      if (arIndex !== -1) return String(arIndex);
      return ch;
    })
    .join("");
}

function toPersianDigits(input: string) {
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return input.replace(/[0-9]/g, (d) => fa[en.indexOf(d)]);
}

function parseJalaliToDate(s?: string | null) {
  if (!s) return null;
  const clean = toEnglishDigits(s).replace(/-/g, "/");
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return jalaliToDate(y, m - 1, d);
}

function formatJalaliShort(dateString?: string | null) {
  if (!dateString) return "---";
  const clean = toEnglishDigits(dateString).replace(/-/g, "/");
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return "---";

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
  ];

  return `${toPersianDigits(String(d))} ${monthNames[m - 1]}`;
}

function safeTime(t?: string | null) {
  return t && t.trim() ? t : "10:00";
}

function VDivider() {
  return (
    <span className="mx-3 h-6 w-px bg-gray-200 dark:bg-white/10 shrink-0" />
  );
}

export default function SearchHeader({
  isSticky = false,
  timerValue,
}: {
  isSticky?: boolean;
  timerValue?: string;
}) {
  const dispatch = useDispatch();

  const isHeaderClose = useSelector((state: any) => state.global.isHeaderClose);
  const carDates = useSelector((state: any) => state.global.carDates) as
    | (string | null)[]
    | null;
  const returnTime = useSelector((state: any) => state.global.returnTime) as
    | string
    | null;
  const deliveryTime = useSelector(
    (state: any) => state.global.deliveryTime
  ) as string | null;

  const carDayCount = useMemo(() => {
    const s = parseJalaliToDate(carDates?.[0] ?? null);
    const e = parseJalaliToDate(carDates?.[1] ?? null);
    if (!s || !e) return 0;
    const startUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const endUTC = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
    return Math.max(0, Math.round((endUTC - startUTC) / 86400000));
  }, [carDates?.[0], carDates?.[1]]);

  const initialRange = useMemo(() => {
    const start = parseJalaliToDate(carDates?.[0] ?? null);
    const end = parseJalaliToDate(carDates?.[1] ?? null);
    return { start, end };
  }, [carDates?.[0], carDates?.[1]]);

  const deliveryDateText = useMemo(
    () => formatJalaliShort(carDates?.[0] ?? null),
    [carDates?.[0]]
  );
  const returnDateText = useMemo(
    () => formatJalaliShort(carDates?.[1] ?? null),
    [carDates?.[1]]
  );

  function formatRangeMobile(opts: {
  startText: string
  endText: string
  deliveryTime: string
  returnTime: string
}) {
  return `از ${opts.startText} ساعت ${toPersianDigits(opts.deliveryTime)} تا ${opts.endText} ساعت ${toPersianDigits(
    opts.returnTime,
  )}`
}

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
      <div className="mx-auto max-w-6xl px-3 md:px-4 py-2">
        {/* ===================== MOBILE ===================== */}
<div className="md:hidden">
  {/* Row 1: Search + Date Range (horizontal scroll) */}
  <div className="w-full overflow-x-auto hide-scrollbar">
    <div className="flex flex-row-reverse items-center justify-between whitespace-nowrap text-[11px] px-1">
      <DateRangePickerPopover
        initialRange={initialRange}
        defaultIsJalali={true}
        initialTimes={{
          deliveryTime: safeTime(deliveryTime),
          returnTime: safeTime(returnTime),
        }}
        onConfirm={({ start, end, deliveryTime: dt, returnTime: rt }) => {
          dispatch(
            changeCarDates([
              formatJalaliDate(start),
              formatJalaliDate(end),
            ] as any)
          )
          dispatch(changeDeliveryTime(dt as any))
          dispatch(changeReturnTime(rt as any))
        }}
        onClear={() => {
          dispatch(changeCarDates([null, null] as any))
          dispatch(changeDeliveryTime(null as any))
          dispatch(changeReturnTime(null as any))
        }}
        trigger={
          <button
            type="button"
            className={cn(
              "shrink-0 h-9 w-9 rounded-full",
              "bg-blue-600 hover:bg-blue-700 text-white",
              "inline-flex items-center justify-center"
            )}
            aria-label="جستجو"
          >
            <Search className="h-4 w-4" />
          </button>
        }
      />

      {/* 🔹 متن رنج تاریخ (جایگزین تحویل + عودت) */}
      <div className="inline-flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 shrink-0">
        <CalendarDays className="h-4 w-4" />
        <span className="font-bold">
          {formatRangeMobile({
            startText: deliveryDateText,
            endText: returnDateText,
            deliveryTime: safeTime(deliveryTime),
            returnTime: safeTime(returnTime),
          })}
        </span>
      </div>
    </div>
  </div>

  {/* Row 2: Rent days + Timer */}
  <div className="mt-2 px-1 flex flex-col gap-1">
    <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100 font-bold text-[11px]">
      <Clock className="h-4 w-4" />
      <span>
        مدت زمان اجاره : {toPersianDigits(String(carDayCount))} روز
      </span>
    </div>

    {timerValue && (
      <div className="inline-flex items-center gap-2 whitespace-nowrap text-red-500 font-bold text-[11px]">
        <Clock className="h-4 w-4" />
        <span className="font-mono">{timerValue}</span>
      </div>
    )}
  </div>
</div>


        {/* ===================== DESKTOP (همون قبلی، دست نخورده) ===================== */}
        <div className="hidden md:block ">
          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="w-full md:min-w-0 flex flex-row-reverse justify-between items-center text-xs ">
              <DateRangePickerPopover
                initialRange={initialRange}
                defaultIsJalali={true}
                initialTimes={{
                  deliveryTime: safeTime(deliveryTime),
                  returnTime: safeTime(returnTime),
                }}
                onConfirm={({
                  start,
                  end,
                  deliveryTime: dt,
                  returnTime: rt,
                }) => {
                  dispatch(
                    changeCarDates([
                      formatJalaliDate(start),
                      formatJalaliDate(end),
                    ] as any)
                  );
                  dispatch(changeDeliveryTime(dt as any));
                  dispatch(changeReturnTime(rt as any));
                }}
                onClear={() => {
                  dispatch(changeCarDates([null, null] as any));
                  dispatch(changeDeliveryTime(null as any));
                  dispatch(changeReturnTime(null as any));
                }}
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "shrink-0",
                      "h-9 w-9 rounded-full",
                      "bg-blue-600 hover:bg-blue-700 text-white",
                      "inline-flex items-center justify-center"
                    )}
                    aria-label="جستجو"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                }
              />

              <div>



              <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                <Clock className="h-4 w-4 " />
                <span className="text-gray-700 dark:text-gray-200">
                  مدت زمان اجاره : {toPersianDigits(String(carDayCount))} روز
                </span>
              </div>

              <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                <CalendarDays className="h-4 w-4 " />
                <span className="font-semibold">تاریخ و زمان عودت</span>
                <span>
                  {returnDateText} &nbsp; ساعت{" "}
                  {toPersianDigits(safeTime(returnTime))}
                </span>
              </div>
              </div>

              <div className="inline-flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-gray-100">
                <CalendarDays className="h-4 w-4 " />
                <span className="font-semibold">تاریخ و زمان تحویل</span>
                <span>
                  {deliveryDateText} &nbsp; ساعت{" "}
                  {toPersianDigits(safeTime(deliveryTime))}
                </span>
              </div>

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
        </div>
      </div>
    </div>
  );
}
