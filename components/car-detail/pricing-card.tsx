/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Info,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { formatJalaliDate } from "@/lib/date-utils";
import { DateRangePickerPopover } from "../custom/calender/date-range-picker";

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
    ":": ":",
    "/": "/",
    "-": "-",
    " ": " ",
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

  // حذف کاراکترهای RTL/LTR و فاصله‌های نامرئی
  s = s.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();
  return s;
}

function formatTimeFa(t: string) {
  return toFaDigits(t);
}

function yesNoFa(v: any, yesText: string, noText: string) {
  const s = String(v ?? "").toLowerCase();
  const yes = s === "yes" || s === "true" || s === "1";
  const no = s === "no" || s === "false" || s === "0";
  if (yes) return yesText;
  if (no) return noText;
  return "—";
}

function formatMoneyFa(value: any) {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  const num = Number(toEnDigits(str));
  if (Number.isFinite(num)) {
    const fixed = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return toFaDigits(fixed);
  }
  return toFaDigits(str);
}

type PickerRange = NonNullable<
  React.ComponentProps<typeof DateRangePickerPopover>["initialRange"]
>;

function buildDefault(): {
  range: PickerRange;
  deliveryTime: string;
  returnTime: string;
} {
  const tomorrow = addDays(new Date(), 1);
  const end = addDays(new Date(), 6);
  const range: PickerRange = { start: tomorrow, end };
  return { range, deliveryTime: "10:00", returnTime: "10:00" };
}

// ---------------- Types ----------------
export type DailyPriceItem = {
  title: string;
  price: string;
  price_off?: number | null;
};

export type PricingCarMeta = {
  id: number;
  branch_id?: number | null; // ✅ اضافه شد
  title?: string | null;
  branch?: string | null;

  insurance?: "yes" | "no" | string | null;
  free_delivery?: "yes" | "no" | string | null;
  km?: "yes" | "no" | string | null;
};

export type PricingCardProps = {
  car: PricingCarMeta;

  dailyPrice?: DailyPriceItem[] | null;
  deposit?: string | number | null;
  currency?: string | null;
  offPercent?: number | null;

  // قبلاً برای واتساپ بود، دیگه استفاده نمی‌کنیم
  whatsapp?: string | null;
};

export function PricingCard({
  car,
  dailyPrice,
  deposit,
  currency,
  offPercent,
}: PricingCardProps) {
  const router = useRouter();
  const defaults = React.useMemo(() => buildDefault(), []);

  const [range, setRange] = React.useState<PickerRange>(defaults.range);
  const [deliveryTime, setDeliveryTime] = React.useState<string>(
    defaults.deliveryTime
  );
  const [returnTime, setReturnTime] = React.useState<string>(
    defaults.returnTime
  );

  const deliveryText = React.useMemo(() => {
    const datePart = range.start ? formatJalaliDate(range.start) : "";
    return `${toFaDigits(datePart)} - ${formatTimeFa(deliveryTime)}`;
  }, [range.start, deliveryTime]);

  const returnText = React.useMemo(() => {
    const datePart = range.end ? formatJalaliDate(range.end) : "";
    return `${toFaDigits(datePart)} - ${formatTimeFa(returnTime)} `;
  }, [range.end, returnTime]);

  const unit = currency || "درهم";

  const off = Number(offPercent ?? 0);
  const hasOff = Number.isFinite(off) && off > 0;

  const pricingOptions = (dailyPrice || []).filter(Boolean).map((x) => ({
    days: x.title,
    originalPrice: x.price,
    finalPrice: x.price_off ?? x.price,
    hasOffPrice: x.price_off !== null && x.price_off !== undefined,
  }));

  const titleText =
    car?.title && car?.branch
      ? `قیمت اجاره ${car.title} در ${car.branch}`
      : car?.title
      ? `قیمت اجاره ${car.title}`
      : "قیمت اجاره خودرو";

  const locationLabel =
    car?.title && car?.branch
      ? `اجاره ${car.title} در ${car.branch}`
      : car?.title
      ? `اجاره ${car.title}`
      : "اجاره خودرو";

  // ✅✅✅ رزرو: رفتن به صفحه Search با from/to/dt/rt + car_id + branch_id
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

    // ✅ اگر تاریخ‌ها به هر دلیلی خالی شدن، نرو که همون مشکل skeleton پیش میاد
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

  // ✅ بخش بالا (قیمت‌ها + اطلاعات)
  const TopContent = (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-700 font-medium text-base">{titleText}</h2>

          {hasOff && (
            <span className="bg-amber-400 text-white px-4 py-1.5 rounded-full text-sm font-medium">
              {toFaDigits(String(off))}٪ تخفیف
            </span>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {pricingOptions.length === 0 ? (
            <div className="text-sm text-gray-500">قیمت‌ها موجود نیست.</div>
          ) : (
            pricingOptions.map((option, index) => (
              <div
                key={`${option.days}-${index}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {index === 0 ? (
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  ) : (
                    <div className="w-5" />
                  )}
                  <span className="text-gray-600 text-sm">{option.days}</span>
                </div>

                <div className="flex items-center gap-3">
                  {option.hasOffPrice ? (
                    <span className="text-gray-400 line-through text-sm">
                      {formatMoneyFa(option.originalPrice)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm"> </span>
                  )}

                  <span className="text-gray-700 font-medium">
                    {formatMoneyFa(option.finalPrice)} {unit}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">ودیعه خلافی :</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-700">
                {formatMoneyFa(deposit)} {unit}
              </span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">هزینه تحویل :</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">
                {yesNoFa(car?.free_delivery, "تحویل رایگان", "تحویل غیر رایگان")}
              </span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">بیمه خودرو :</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">
                {yesNoFa(car?.insurance, "بیمه پایه رایگان", "بدون بیمه")}
              </span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">کیلومتر :</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-medium">
                {yesNoFa(car?.km, "کیلومتر نامحدود", "محدود")}
              </span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* ✅ فقط موبایل: لینک رزرو آنلاین + رزرو سریع */}
        <div className="mt-4 border-t md:hidden">
          <div className="pt-4 flex gap-6">
            <button
              type="button"
              className="flex items-center text-sm text-blue-500"
              onClick={() => {
                const el = document.getElementById("reserve-card");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <p>رزرو آنلاین</p>
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="flex items-center text-sm text-green-600"
              onClick={handleReserve}
            >
              <p>ادامه رزرو</p>
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ✅ کارت رزرو (پایین)
  const ReserveContent = (
    <div className="p-2">
      <h3 className="text-lg font-medium mb-2 md:mb-0">رزرو آنلاین</h3>

      <div id="reserve-card" className="p-4 border md:border-none rounded-lg">
        <div className="text-xs text-gray-400 mb-1">اجاره آنلاین خودرو</div>

        <div className="border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600 text-sm">{locationLabel}</span>
        </div>

        <DateRangePickerPopover
          initialRange={range}
          defaultIsJalali={true}
          initialTimes={{ deliveryTime, returnTime }}
          onConfirm={(v) => {
            setRange({ start: v.start, end: v.end });
            setDeliveryTime(v.deliveryTime);
            setReturnTime(v.returnTime);
          }}
          onClear={() => {
            const d = buildDefault();
            setRange(d.range);
            setDeliveryTime(d.deliveryTime);
            setReturnTime(d.returnTime);
          }}
          trigger={
            <div className="flex w-full mb-4 cursor-pointer">
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">
                  تاریخ و ساعت تحویل
                </div>
                <div className="border border-gray-200 rounded-r-lg p-3 flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{deliveryText}</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">
                  تاریخ و ساعت عودت
                </div>
                <div className="border border-gray-200 rounded-l-lg gap-2 p-3 flex items-center ">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 text-sm">{returnText}</span>
                </div>
              </div>
            </div>
          }
        />

        <button
          type="button"
          onClick={handleReserve}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 text-base font-medium rounded-md transition-colors"
        >
          رزرو این خودرو
        </button>

        {/* ✅ اگر branch_id یا car_id نداشتی، بهت هشدار بده */}
        {(!car?.branch_id || !car?.id) && (
          <div className="mt-2 text-xs text-red-500">
            branch_id یا car_id موجود نیست (برای رزرو باید در car پاس داده شود).
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ✅ موبایل: دو کارت جدا */}
      <div className="md:hidden space-y-3">
        <div className="rounded-xl border overflow-hidden">{TopContent}</div>
        <div className="rounded-xl overflow-hidden">{ReserveContent}</div>
      </div>

      {/* ✅ دسکتاپ: یک کارت یک‌تکه */}
      <div className="hidden md:block">
        <div className="rounded-xl border max-w-md mx-auto overflow-hidden ">
          {TopContent}
          <div className="border-t border-gray-200" />
          {ReserveContent}
        </div>
      </div>
    </>
  );
}
