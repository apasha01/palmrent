/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock3,
  CalendarDays,
  Hourglass,
  ChevronLeft,
} from "lucide-react";
import cardrive from "@/public/lottie/DriveCar.json";

type RentSummary = {
  car_name?: string | null;
  delivery?: {
    date_fa?: string | null;
    place_name?: string | null;
    address?: string | null;
  } | null;
  return?: {
    date_fa?: string | null;
    place_name?: string | null;
    address?: string | null;
  } | null;
  days?: number | null;
  total?: number | string | null;
  currency?: string | null;
};

type ProcessingCardProps = {
  rentData?: {
    summary?: RentSummary | null;
  } | null;
  initialSeconds?: number; // default 120
};

const toFaDigits = (input: string) => {
  const map: Record<string, string> = {
    "0": "۰",
    "1": "۱",
    "2": "۲",
    "3": "۳",
    "4": "۴",
    "5": "۵",
    "6": "۶",
    "7": "۷",
    "8": "۸",
    "9": "۹",
  };
  return input.replace(/[0-9]/g, (d) => map[d] ?? d);
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return toFaDigits(`${m}:${sec.toString().padStart(2, "0")}`);
};

const formatMoney = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);

  // اگر عدد اعشار داشت نگه دار، اگر نداشت بدون اعشار
  const hasDecimal = Math.abs(n % 1) > 0;
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(n);

  return formatted;
};

export function ProcessingCard({ rentData, initialSeconds = 120 }: ProcessingCardProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const summary = rentData?.summary;

  const carName = useMemo(() => summary?.car_name || "—", [summary]);
  const deliveryText = useMemo(() => {
    const d = summary?.delivery;
    const date = d?.date_fa || "";
    const place = d?.place_name || "";
    const address = d?.address ? ` • ${d.address}` : "";
    const main = [date, place].filter(Boolean).join(" • ");
    return main ? main + address : "—";
  }, [summary]);

  const returnText = useMemo(() => {
    const r = summary?.return;
    const date = r?.date_fa || "";
    const place = r?.place_name || "";
    const address = r?.address ? ` • ${r.address}` : "";
    const main = [date, place].filter(Boolean).join(" • ");
    return main ? main + address : "—";
  }, [summary]);

  const days = summary?.days ?? null;
  const total = summary?.total ?? null;
  const currency = summary?.currency ?? "";

  const totalLine = useMemo(() => {
    const d = typeof days === "number" && days > 0 ? days : null;
    const money = formatMoney(total);
    if (!d && !money) return "—";
    const daysText = d ? `جمع کل (${toFaDigits(String(d))} روز):` : "جمع کل:";
    const moneyText = money ? `${money} ${currency}` : `— ${currency}`;
    return { daysText, moneyText };
  }, [days, total, currency]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900" dir="rtl">
      <Card className="w-full relative overflow-hidden shadow-none bg-white dark:bg-gray-900 border-none">
        {/* ===== LOTTIE ===== */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto w-full">
            <div className="w-full h-[130px] sm:h-[150px] md:h-[300px] lg:h-[400px]">
              <Lottie animationData={cardrive} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="max-w-5xl md:max-w-6xl w-full mx-auto px-2 sm:px-4">
          <CardHeader className="p-0">
            <div className="w-full flex justify-center">
              <div className="text-center w-full max-w-3xl mx-auto">
                <CardTitle className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white p-0 m-0">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                    <span className="whitespace-normal sm:whitespace-nowrap">
                      درخواست رزرو شما ثبت شد
                    </span>
                  </span>
                </CardTitle>

                <p className="mt-3 text-base text-gray-700 dark:text-gray-200 leading-9 text-center">
                  تیم پالم رنت درحال بررسی و تایید نهایی رزرو شماست
                  <br />
                  <span className="whitespace-normal sm:whitespace-nowrap">
                    معمولا بررسی رزرو در کمتر از ۲ دقیقه انجام میشود .
                  </span>
                  <br />
                  <span className="whitespace-normal sm:whitespace-nowrap">
                    لطفا این صفحه را نبندید؛ نتیجه بررسی همینجا نمایش داده میشود.
                  </span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-7 p-0 m-0">
            {/* ===== STEPPER ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 md:p-4 overflow-hidden">
              <div className="flex justify-evenly items-center font-bold text-[11px] sm:text-xs md:text-sm">
                <div className="flex items-center justify-end gap-1 md:gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">ثبت درخواست</span>
                </div>

                <div className="flex justify-center">
                  <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center justify-center gap-1 md:gap-2 text-emerald-600">
                  <Hourglass className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">بررسی رزرو</span>
                </div>

                <div className="flex justify-center">
                  <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-gray-300 dark:text-gray-600 shrink-0" />
                </div>

                <div className="flex justify-start text-gray-300 dark:text-gray-600">
                  <span className="whitespace-nowrap">نمایش نتیجه</span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 dark:border-gray-700" />

              {/* ===== TIMER ===== */}
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-white font-black text-sm sm:text-base whitespace-nowrap">
                  <Clock3 className="h-5 w-5 animate-spin [animation-duration:3.5s] shrink-0" />
                  <span className="whitespace-nowrap">
                    زمان تقریبی تا اعلام نتیجه: {formatTime(seconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== SUMMARY ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="py-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-4">
                    <div className="h-10 rounded-l-lg bg-gray-700 w-2 md:hidden" />
                    <div className="flex items-center gap-2 md:px-4">
                      <CalendarDays className="h-8 w-8 text-gray-600 dark:text-gray-300 shrink-0" />
                      <span className="font-black text-xl text-gray-900 dark:text-white whitespace-nowrap">
                        خلاصه رزرو شما
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4 text-sm px-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">نام خودرو:</span>
                    <strong className="whitespace-nowrap">{carName}</strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">تحویل:</span>
                    <strong className="leading-7">{deliveryText}</strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">عودت:</span>
                    <strong className="leading-7">{returnText}</strong>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                      {typeof totalLine === "string" ? "جمع کل:" : totalLine.daysText}
                    </span>
                    <span className="text-lg sm:text-xl font-black whitespace-nowrap">
                      {typeof totalLine === "string" ? totalLine : totalLine.moneyText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
