/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMemo, useRef, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Info, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ApiOption } from "@/types/rent-information";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { IconBag, IconGas, IconGearBox, IconPerson } from "@/components/Icons";

// ------------------------------------
// helpers
// ------------------------------------
export function formatNum(n: number) {
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

/**
 * ✅ توضیحات ثابت برای هر آپشن (طبق ID)
 * هر آپشن جدیدی داشتی فقط اینجا اضافه کن.
 */
const OPTION_HELP_TEXT_BY_ID: Record<number, string> = {
  2: `صندلی کودک
- مناسب کودکان خردسال
- نصب و تحویل هنگام دریافت خودرو انجام می‌شود
- مسئولیت انتخاب سایز/مدل مناسب کودک با مشتری است
- در صورت نیاز می‌توانید قبل از رزرو با پشتیبانی هماهنگ کنید.`,

  10: `راننده اضافی
- این گزینه اجازه می‌دهد فرد دیگری هم به‌عنوان راننده خودرو ثبت شود
- برای راننده اضافی ارائه مدارک شناسایی/گواهینامه معتبر لازم است
- در صورت بروز خسارت یا جریمه، مسئولیت طبق قوانین قرارداد برعهده اجاره‌کننده خواهد بود.`,
};

function getOptionDescription(opt: any): string {
  if (!opt) return "برای این آپشن توضیحی ثبت نشده است.";

  const id = Number(opt?.id);
  if (Number.isFinite(id) && OPTION_HELP_TEXT_BY_ID[id]) {
    return OPTION_HELP_TEXT_BY_ID[id];
  }

  const raw =
    opt?.description ??
    opt?.desc ??
    opt?.text ??
    opt?.details ??
    opt?.content ??
    opt?.info ??
    opt?.note ??
    opt?.tooltip ??
    "";

  const apiText = String(raw ?? "").trim();
  if (apiText) return apiText;

  return "برای این آپشن توضیحی ثبت نشده است.";
}

export function formatMoneyOrFree(n: number, currencyLabel?: string) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v <= 0) return "رایگان";
  return currencyLabel ? `${formatNum(v)} ${currencyLabel}` : `${formatNum(v)}`;
}

// ------------------------------------
// SummaryRow (supports skeleton)
// ------------------------------------
function SkeletonLine({ w = "w-24" }: { w?: string }) {
  return <div className={cn("h-3 rounded bg-gray-200 animate-pulse", w)} />;
}

export function SummaryRow({
  label,
  value,
  subLabel,
  valueHint,
  loading,
}: {
  label: string;
  value: string;
  subLabel?: any;
  valueHint?: any;
  loading?: boolean;
}) {
  // special case: delivery/return format
  const isDelivery = label.startsWith("محل تحویل:");
  const isReturn = label.startsWith("محل عودت:");

  const normalizedLabel = isDelivery
    ? "هزینه تحویل"
    : isReturn
      ? "هزینه عودت"
      : label;
  const normalizedSub = isDelivery
    ? label.replace("محل تحویل:", "").trim()
    : isReturn
      ? label.replace("محل عودت:", "").trim()
      : subLabel || "";

  const isFree = !loading && value.includes("رایگان");

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        {/* RIGHT */}
        <div className="flex-1 text-right">
          <div className="text-sm font-bold text-gray-800 leading-5">
            {loading ? <SkeletonLine w="w-28" /> : normalizedLabel}
          </div>

          {normalizedSub ? (
            <div className="text-xs text-gray-500 mt-1 leading-4">
              {loading ? <SkeletonLine w="w-40" /> : normalizedSub}
            </div>
          ) : null}
        </div>

        {/* LEFT */}
        <div
          className={cn(
            "text-sm text-left font-bold leading-5 whitespace-nowrap",
            loading
              ? "text-gray-400"
              : isFree
                ? "text-gray-500"
                : "text-gray-800",
          )}
        >
          {loading ? <SkeletonLine w="w-20" /> : value}

          {valueHint ? (
            <div className="text-[10px] font-medium text-blue-600 mt-0.5">
              {valueHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------
// Checkbox
// ------------------------------------
function RadixCheckbox({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border border-gray-300 bg-white",
        "transition-colors",
        "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center text-white",
          "data-[state=checked]:animate-in data-[state=checked]:zoom-in-95",
        )}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

// ------------------------------------
// Price label (قدیمی - نگه داشتم چون گفتی پاک نکن)
// ------------------------------------
const PriceLeft = ({ price }: { price: number }) => {
  const n = Number(price || 0);
  if (!Number.isFinite(n) || n <= 0) {
    return (
      <span className="text-sm text-gray-600 whitespace-nowrap">رایگان</span>
    );
  }

  return (
    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
      {formatNum(n)} <span className="font-medium">درهم</span>{" "}
      <span className="text-gray-500 font-medium">روزانه</span>
    </span>
  );
};

function renderPriceLeft({
  price,
  currencyLabel,
}: {
  price: number;
  currencyLabel: string;
}) {
  const n = Number(price || 0);

  if (!Number.isFinite(n) || n <= 0) {
    return (
      <span className="text-sm text-gray-600 whitespace-nowrap">رایگان</span>
    );
  }

  return (
    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
      {formatNum(n)} <span className="font-medium">{currencyLabel}</span>{" "}
      <span className="text-gray-500 font-medium">روزانه</span>
    </span>
  );
}

// ------------------------------------
// ExtrasList + Drawer
// ------------------------------------
export function ExtrasList({
  options,
  selected,
  setSelected,
  insuranceComplete,
  setInsuranceComplete,
  insuranceCompleteEnabled,
  insuranceCompleteDailyPrice,
  currencyLabel = "درهم",
  onSelectionVisualChange,
}: {
  options: ApiOption[];
  selected: number[];
  setSelected: (v: number[]) => void;

  insuranceComplete: boolean;
  setInsuranceComplete: (v: boolean) => void;
  insuranceCompleteEnabled: boolean;
  insuranceCompleteDailyPrice?: number;
  currencyLabel?: string;

  onSelectionVisualChange?: (changedOptionId: number) => void;
}) {
  const safeOptions = useMemo(() => {
    return (Array.isArray(options) ? options : []).filter(
      (x): x is ApiOption => Boolean(x) && typeof (x as any).id !== "undefined",
    );
  }, [options]);

  const [openOptionId, setOpenOptionId] = useState<number | null>(null);
  const INS_ID = -999;

  // ✅✅✅ NEW: payload ثابت برای جلوگیری از فلش متن دیفالت موقع بستن
  const [drawerPayload, setDrawerPayload] = useState<any>(null);
  const closeTimerRef = useRef<any>(null);

  // ✅ openOption از payload میاد (نه از openOptionId)
  const openOption = useMemo(() => {
    return drawerPayload;
  }, [drawerPayload]);

  const openDesc = useMemo(() => getOptionDescription(openOption), [openOption]);

  // ✅ هر بار روی info کلیک شد، payload ست میشه
  function openDrawerForOption(opt: any) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    if (opt?.id === INS_ID) {
      setDrawerPayload({
        id: INS_ID,
        title: "بسته جامع خسارت",
        description:
          "با انتخاب این گزینه، پوشش کامل‌تری برای خسارت/ریسک‌های احتمالی در طول اجاره فعال می‌شود.",
      });
      setOpenOptionId(INS_ID);
      return;
    }

    setDrawerPayload(opt);
    setOpenOptionId(Number(opt?.id));
  }

  function toggleOption(id: number) {
    if (!Number.isFinite(id as any)) return;
    onSelectionVisualChange?.(id);

    if (selected.includes(id)) setSelected(selected.filter((i) => i !== id));
    else setSelected([...selected, id]);
  }

  function toggleInsurance() {
    onSelectionVisualChange?.(INS_ID);
    setInsuranceComplete(!insuranceComplete);
  }

  return (
    <div>
      {safeOptions.map((item) => {
        const checked = selected.includes(item.id);
        const rawDaily = Number((item as any)?.price ?? 0) || 0;

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2",
              "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
            )}
            onClick={() => toggleOption(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleOption(item.id);
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <RadixCheckbox
                checked={checked}
                onCheckedChange={() => toggleOption(item.id)}
                className="cursor-pointer"
              />

              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {item.title}
                </div>

                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawerForOption(item);
                  }}
                  aria-label="اطلاعات بیشتر"
                >
                  <Info size={18} />
                </button>
              </div>
            </div>

            <div className="text-left">
              {renderPriceLeft({ price: rawDaily, currencyLabel })}
            </div>
          </div>
        );
      })}

      {insuranceCompleteEnabled ? (
        <>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-2",
              "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
            )}
            onClick={toggleInsurance}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleInsurance();
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <RadixCheckbox
                checked={insuranceComplete}
                onCheckedChange={toggleInsurance}
                className="cursor-pointer"
              />

              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  بسته جامع خسارت
                </div>

                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawerForOption({ id: INS_ID });
                  }}
                  aria-label="اطلاعات بیشتر"
                >
                  <Info size={18} />
                </button>
              </div>
            </div>

            <div className="text-left">
              {renderPriceLeft({
                price: Number(insuranceCompleteDailyPrice || 0),
                currencyLabel,
              })}
            </div>
          </div>
        </>
      ) : null}

      <Drawer
        open={openOptionId != null}
        onOpenChange={(v) => {
          // ✅ وقتی می‌بندیم، openOptionId رو null میکنیم ولی payload رو کمی دیرتر پاک می‌کنیم
          if (!v) {
            setOpenOptionId(null);

            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
              setDrawerPayload(null);
              closeTimerRef.current = null;
            }, 250); // همزمان با انیمیشن
          }
        }}
      >
        <DrawerContent className="">
          {/* ✅✅✅ NEW: max-w واقعی با wrapper */}
          <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
            <DrawerHeader className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Sparkles className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <DrawerTitle className="text-right text-base font-extrabold text-gray-900 truncate">
                      {/* ✅ payload تا زمان بسته شدن باقی می‌مونه => دیفالت فلش نمی‌زنه */}
                      {openOption?.title || "جزئیات آپشن"}
                    </DrawerTitle>
                  </div>
                </div>
              </div>
            </DrawerHeader>

            <div className="px-5 pb-4">
              <div className="rounded-2xl p-2">
                <p className="text-right text-sm leading-7 text-gray-700 whitespace-pre-line">
                  {openDesc}
                </p>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ------------------------------------
// car meta
// ------------------------------------
export function SelectedCarMeta({
  fuel,
  gearbox,
  baggage,
  passengers,
}: {
  fuel?: string | null;
  gearbox?: string | null;
  baggage?: number | string | null;
  passengers?: number | string | null;
}) {
  const safeFuel = fuel ?? "بنزین";

  const g = String(gearbox ?? "");
  const safeGearbox =
    g.toLowerCase().includes("auto") || g.includes("اتوماتیک")
      ? "اتوماتیک"
      : "دنده‌ای";

  const safeBaggage = baggage ?? 0;
  const safePassengers = passengers ?? 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-gray-500">
      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconGas />
        </span>
        <span className="text-gray-600">{safeFuel}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconGearBox />
        </span>
        <span className="text-gray-600">{safeGearbox}</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconBag />
        </span>
        <span className="text-gray-600">{safeBaggage} چمدان</span>
      </span>

      <span className="inline-flex items-center gap-0.5">
        <span className="w-4 h-4 flex items-center justify-center">
          <IconPerson />
        </span>
        <span className="text-gray-600">{safePassengers} نفر</span>
      </span>
    </div>
  );
}
