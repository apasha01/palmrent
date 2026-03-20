/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Lottie from "lottie-react";
import { CheckCircle2, Clock3, Hourglass, ChevronLeft } from "lucide-react";
import cardrive from "@/public/lottie/DriveCar.json";
import { Separator } from "../ui/separator";

const TIMER_END_KEY = (code: string) => `palmrent_timer_end_${code}`;
const TIMER_EXPIRED_KEY = (code: string) => `palmrent_timer_expired_${code}`;
const DEFAULT_DURATION = 120;

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
  original_total?: number | string | null;
  currency?: string | null;
};

type ProcessingCardProps = {
  rentData?: {
    summary?: RentSummary | null;
    whatsapp?: string | null;
    rent_code?: string | null;
  } | null;
  initialSeconds?: number;
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const formatMoney = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  const hasDecimal = Math.abs(n % 1) > 0;
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(n);
};

// ─── timer helpers ────────────────────────────────────────────────────────────

function isAlreadyExpired(code: string): boolean {
  try {
    return localStorage.getItem(TIMER_EXPIRED_KEY(code)) === "1";
  } catch {
    return false;
  }
}

function markExpired(code: string) {
  try {
    localStorage.setItem(TIMER_EXPIRED_KEY(code), "1");
    localStorage.removeItem(TIMER_END_KEY(code));
  } catch {}
}

function getOrCreateEndTime(code: string, durationSeconds: number): number {
  try {
    const stored = localStorage.getItem(TIMER_END_KEY(code));
    if (stored) {
      const end = parseInt(stored, 10);
      if (!isNaN(end) && end > Date.now()) return end;
    }
  } catch {}
  const end = Date.now() + durationSeconds * 1000;
  try {
    localStorage.setItem(TIMER_END_KEY(code), String(end));
  } catch {}
  return end;
}

function getRemainingSeconds(endTime: number) {
  return Math.max(0, Math.round((endTime - Date.now()) / 1000));
}

// ─── init helper — فقط یه بار موقع mount اجرا میشه ───────────────────────────

function initTimerState(
  code: string,
  durationSeconds: number
): { expired: boolean; endTime: number; seconds: number } {
  if (isAlreadyExpired(code)) {
    return { expired: true, endTime: 0, seconds: 0 };
  }
  const endTime = getOrCreateEndTime(code, durationSeconds);
  const seconds = getRemainingSeconds(endTime);
  if (seconds <= 0) {
    markExpired(code);
    return { expired: true, endTime: 0, seconds: 0 };
  }
  return { expired: false, endTime, seconds };
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function ProcessingCard({
  rentData,
  initialSeconds = DEFAULT_DURATION,
}: ProcessingCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rentCode = rentData?.rent_code ?? "default";

  // lazy init — همه چیز یه بار محاسبه میشه، هیچ setState synchronous توی effect نداریم
  const [isExpired, setIsExpired] = useState<boolean>(
    () => initTimerState(rentCode, initialSeconds).expired
  );
  const [seconds, setSeconds] = useState<number>(
    () => initTimerState(rentCode, initialSeconds).seconds
  );
  const endTimeRef = useRef<number>(
    initTimerState(rentCode, initialSeconds).endTime
  );

  useEffect(() => {
    // اگه از اول expired بود یا endTime نداریم، interval نمیخوایم
    if (isExpired || endTimeRef.current === 0) return;

    const interval = setInterval(() => {
      const r = getRemainingSeconds(endTimeRef.current);
      setSeconds(r);
      if (r <= 0) {
        clearInterval(interval);
        markExpired(rentCode);
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentCode]);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const query = searchParams.toString();
    return `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const whatsappUrl = useMemo(() => {
    const raw = rentData?.whatsapp ?? null;
    if (!raw) return null;
    const number = raw.replace(/\D/g, "");
    if (!number) return null;
    const text = `سلام. رزرو من هنوز در مرحله بررسی است. لطفاً وضعیت را بررسی کنید. کد پیگیری: ${pageUrl}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }, [rentData, pageUrl]);

  const summary = rentData?.summary;

  const rentDescriptionLine1 = useMemo(() => {
    const d = summary?.delivery;
    const car = summary?.car_name || "";
    const fromDate = d?.date_fa || "";
    const parts: string[] = [];
    if (car) parts.push(`اجاره یک دستگاه ${car}`);
    if (fromDate) parts.push(`از ${fromDate}`);
    return parts.join(" ");
  }, [summary]);

  const rentDescriptionLine2 = useMemo(() => {
    const r = summary?.return;
    const toDate = r?.date_fa || "";
    const days = summary?.days;
    const parts: string[] = [];
    if (toDate) parts.push(`تا ${toDate}`);
    if (days) parts.push(`به مدت ${days} روز`);
    return parts.join(" ");
  }, [summary]);

  const days = summary?.days ?? null;
  const total = summary?.total ?? null;
  const originalTotal = summary?.original_total ?? null;
  const currency = summary?.currency ?? "";

  const formattedTotal = useMemo(() => formatMoney(total), [total]);
  const formattedOriginal = useMemo(() => formatMoney(originalTotal), [originalTotal]);

  const hasDiscount = useMemo(() => {
    if (!originalTotal || !total) return false;
    const orig = Number(originalTotal);
    const curr = Number(total);
    return !isNaN(orig) && !isNaN(curr) && orig > curr;
  }, [originalTotal, total]);

  const priceLabelLine = useMemo(() => {
    const car = summary?.car_name || "";
    const d = typeof days === "number" && days > 0 ? days : null;
    if (car && d) return `هزینه نهایی برای ${d} روز اجاره ${car}`;
    if (d) return `هزینه نهایی برای ${d} روز`;
    return "هزینه نهایی";
  }, [summary, days]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-gray-900">
      {/* LOTTIE */}
      <div className="w-full">
        <div className="mx-auto w-full">
          <div className="w-full h-[130px] sm:h-[150px] md:h-[220px]">
            <Lottie animationData={cardrive} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col max-w-4xl w-full mx-auto px-3 sm:px-4 pb-3 gap-2">

        {/* TITLE */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white inline-flex items-center gap-2 justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
            <span>درخواست رزرو شما ثبت شد</span>
          </h2>
        </div>

        {/* BLUE NOTICE CARD */}
        <div className="rounded-lg border border-cyan-200 bg-cyan-100/40 dark:bg-cyan-950 dark:border-cyan-800 px-4 py-3 text-center">
          <p className="text-cyan-600 dark:text-cyan-300 font-semibold text-[13px]">
            لطفا صفحه را ترک نفرمایید ، رزرو شما در حال بررسی است
          </p>
        </div>

        {/* DESCRIPTION */}
        <div className="text-center">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-8">
            تیم پالم رنت درحال بررسی و تایید نهایی رزرو شماست
            <br />
            معمولا بررسی رزرو در کمتر از ۲ دقیقه انجام میشود .
            <br />
            لطفا این صفحه را نبندید؛ نتیجه بررسی همینجا نمایش داده میشود.
          </p>
        </div>

        {/* STEPPER + TIMER */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 md:p-4">
          <div className="flex justify-evenly items-center font-bold text-[11px] sm:text-xs md:text-sm">
            <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">ثبت درخواست</span>
            </div>
            <ChevronLeft className="h-7 w-7 text-emerald-500 shrink-0" />
            <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
              <Hourglass className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">بررسی رزرو</span>
            </div>
            <ChevronLeft className="h-7 w-7 text-gray-300 dark:text-gray-600 shrink-0" />
            <div className="text-gray-300 dark:text-gray-600">
              <span className="whitespace-nowrap">نمایش نتیجه</span>
            </div>
          </div>

          <div className="mt-3 border-t border-gray-200 dark:border-gray-700" />

          <div className="mt-3 flex flex-col items-center gap-2">
            {!isExpired ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-white font-black text-sm sm:text-base whitespace-nowrap">
                <Clock3 className="h-5 w-5 animate-spin animation-duration-[3.5s] shrink-0" />
                <span>زمان تقریبی تا اعلام نتیجه: {formatTime(seconds)}</span>
              </div>
            ) : whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-white font-black text-sm sm:text-base whitespace-nowrap hover:bg-[#1ebe5d] transition-colors"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span>ادامه پیگیری در واتساپ</span>
              </a>
            ) : null}
          </div>

          {isExpired && (
            <div className="mt-3 text-center">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                بررسی کمی بیشتر از حد معمول طول کشیده است
              </p>
            </div>
          )}
        </div>

        {/* SUMMARY */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center gap-3 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 px-3 md:px-4">
              <span className="font-black text-lg text-gray-900 dark:text-white whitespace-nowrap">
                خلاصه رزرو شما
              </span>
            </div>
          </div>

          <div className="flex flex-col px-4 py-3 gap-4">
            <div className="text-sm text-gray-800 dark:text-gray-200 leading-8 font-medium">
              <p>{rentDescriptionLine1}</p>
              {rentDescriptionLine2 && <p>{rentDescriptionLine2}</p>}
            </div>

            <Separator className="border-gray-100 dark:border-gray-800" />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-6">
                {priceLabelLine}
              </p>

              <div className="flex flex-col items-end gap-0.5">
                {formattedTotal && (
                  <span className="text-lg font-black text-blue-600 whitespace-nowrap">
                    {formattedTotal} {currency}
                  </span>
                )}
                {hasDiscount && formattedOriginal && (
                  <span className="text-md text-gray-400 line-through whitespace-nowrap">
                    {formattedOriginal} {currency}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
