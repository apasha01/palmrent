"use client";

import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatJalaliDate } from "@/lib/date-utils";

// ---------------- Utils ----------------
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toFaDigits(input: string) {
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
    ".": "٫",
    ",": "٬",
  };
  return String(input)
    .split("")
    .map((c) => (map[c] ? map[c] : c))
    .join("");
}

function toEnDigits(input: string) {
  if (!input) return "";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  let s = String(input);

  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(fa[i], String(i)).replaceAll(ar[i], String(i));
  }

  s = s.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
  return s;
}

function formatMoneyFa(value: unknown) {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  const num = Number(toEnDigits(str));
  if (Number.isFinite(num)) {
    const fixed = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return toFaDigits(fixed);
  }
  return toFaDigits(str);
}

function buildDefault() {
  const tomorrow = addDays(new Date(), 1);
  const end = addDays(new Date(), 6);
  return {
    range: { start: tomorrow, end },
    deliveryTime: "10:00",
    returnTime: "10:00",
  };
}

// ---------------- Types ----------------
export type DailyPriceItem = {
  title: string;
  price: string;
  price_off?: number | null;
};

export type PricingCarMeta = {
  id: number;
  branch_id?: number | null;
  title?: string | null;
  branch?: string | null;
  insurance?: "yes" | "no" | string | null;
  free_delivery?: "yes" | "no" | string | null;
  km?: "yes" | "no" | string | null;
};

export type MobilePriceBarProps = {
  car: PricingCarMeta;
  dailyPrice?: DailyPriceItem[] | null;
  currency?: string | null;
  offPercent?: number | null;
};

export function MobilePriceBar({
  car,
  dailyPrice,
  currency,
}: MobilePriceBarProps) {
  const router = useRouter();
  const defaults = React.useMemo(() => buildDefault(), []);
  const [isVisible, setIsVisible] = useState(false);

  const [range] = React.useState(defaults.range);
  const [deliveryTime] = React.useState<string>(defaults.deliveryTime);
  const [returnTime] = React.useState<string>(defaults.returnTime);

  const unit = currency || "درهم";

  // گرفتن اولین قیمت
  const firstPrice = (dailyPrice || [])[0];
  const displayPrice = firstPrice?.price_off ?? firstPrice?.price ?? "—";
  const originalPrice = firstPrice?.price;
  const hasOffPrice =
    firstPrice?.price_off !== null && firstPrice?.price_off !== undefined;

  // تشخیص اسکرول و نمایش نوار بعد از رد شدن از کارت قیمت
  useEffect(() => {
    const pricingCard = document.getElementById("mobile-pricing-card");
    if (!pricingCard) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // وقتی کارت از viewport خارج شد (یعنی رفتیم پایین‌تر)، نوار رو نشون بده
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0,
      }
    );

    observer.observe(pricingCard);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleReserve = () => {
    const safeStart = range?.start ?? defaults.range.start;
    const safeEnd = range?.end ?? defaults.range.end;

    const fromFa = safeStart ? formatJalaliDate(safeStart) : "";
    const toFa = safeEnd ? formatJalaliDate(safeEnd) : "";

    const from = toEnDigits(fromFa);
    const to = toEnDigits(toFa);

    const dt = toEnDigits(deliveryTime || defaults.deliveryTime);
    const rt = toEnDigits(returnTime || defaults.returnTime);

    const branchId = Number(car?.branch_id ?? 0);
    const carId = Number(car?.id ?? 0);

    if (!branchId || !from || !to || !dt || !rt || !carId) return;

    const params = new URLSearchParams();
    params.set("branch_id", String(branchId));
    params.set("from", from);
    params.set("to", to);
    params.set("dt", dt);
    params.set("rt", rt);
    params.set("step", "3");
    params.set("car_id", String(carId));

    router.push(`/search?${params.toString()}`);
  };

  // اگر هنوز کارت قیمت توی viewport هست، نوار رو نشون نده
  if (!isVisible) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 px-4 py-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* دکمه رزرو */}
        {/* قیمت */}
        <div className="flex flex-col ">
          <span className="text-xs text-gray-400">شروع قیمت از</span>
          <div className="flex items-center gap-2">
            {hasOffPrice && originalPrice && (
              <span className="text-gray-400 line-through text-sm">
                {formatMoneyFa(originalPrice)}
              </span>
            )}
            <span className="text-blue-500 font-bold text-xl">
              {formatMoneyFa(displayPrice)}
            </span>
            <span className="text-gray-600 text-sm">{unit}</span>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <button
          type="button"
          onClick={handleReserve}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-base font-medium rounded-xl transition-colors"
        >
          رزرو آنلاین
        </button>

      </div>
    </div>
  );
}
