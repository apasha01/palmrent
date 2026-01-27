/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import jalaali from "jalaali-js";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { ChevronDown, Info, UserSearch, Coins } from "lucide-react";
import { api } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { STORAGE_URL } from "../../lib/apiClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days";
import { cn } from "@/lib/utils";

import type {
  ApiCalcResponse,
  ApiOption,
  LocationState,
  Totals,
  UserInfo,
} from "@/types/rent-information";

import { InformationStepSkeleton } from "../Loadings/InformationSetupSkeleton";
import InfoListDialog from "../InfoListPopup";
import ResponsiveLocationPicker from "../search/extra/ResponsiveLocationPicker";

import {
  ExtrasList,
  formatMoneyOrFree,
  formatNum,
  SelectedCarMeta,
} from "../search/helpers/utils";

import { Switch } from "../ui/switch";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ✅ مهم: برای موبایل که car_id از URL حذف میشه، از store بخونیم
// اگر مسیر پروژه‌ت فرق داره، فقط این import رو اصلاح کن:
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";

// ✅ cache & inflight (key باید dt/rt داشته باشه)
const calcCache = new Map<string, ApiCalcResponse>();
const calcInflight = new Map<string, Promise<ApiCalcResponse>>();

function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * ✅ استخراج امن تخفیف/قیمت از API
 * - offPercent: از apiData.item.off
 * - dailyBefore/dailyAfter: ترجیحاً از rent_price_day_* و fallback به rent_price/final_price
 * - totalBefore/totalAfter: ترجیحاً از rent_total_* و fallback به pay_price و روزها
 */
function useRentPricing(apiData: ApiCalcResponse | null, rentDays: number) {
  return useMemo(() => {
    const item: any = apiData?.item || {};

    const offPercent = clamp(safeNum(item.off, 0), 0, 100);

    // daily after: از سرور
    const dailyAfter =
      safeNum(item.rent_price_day_after_discount, 0) ||
      safeNum(item.rent_price_day, 0) ||
      safeNum(item.final_price, 0) ||
      0;

    // daily before: از سرور
    const dailyBefore =
      safeNum(item.rent_price_day_before_discount, 0) ||
      safeNum(item.rent_price, 0) ||
      (offPercent > 0 && dailyAfter > 0 ? dailyAfter / (1 - offPercent / 100) : dailyAfter);

    // totals: ترجیحاً از سرور
    const totalAfter =
      safeNum(item.rent_total_after_discount, 0) ||
      safeNum(item.pay_price, 0) ||
      dailyAfter * (rentDays || 1);

    const totalBefore =
      safeNum(item.rent_total_before_discount, 0) ||
      dailyBefore * (rentDays || 1);

    return {
      offPercent,
      dailyBefore,
      dailyAfter,
      totalBefore,
      totalAfter,
    };
  }, [apiData, rentDays]);
}

export default function InformationStep(): JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ car_id: اول URL، اگر نبود از store (برای موبایل + Sheet)
  const storeSelectedCarId = useSearchPageStore((s) => s.selectedCarId);

  const selectedCarId = useMemo(() => {
    const urlId = searchParams.get("car_id");
    if (urlId && urlId !== "null") return urlId;
    if (storeSelectedCarId) return String(storeSelectedCarId);
    return null;
  }, [searchParams, storeSelectedCarId]);

  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  // ✅ dt/rt همیشه normalize بشن
  const dt = normalizeTime(searchParams.get("dt") || "10:00");
  const rt = normalizeTime(searchParams.get("rt") || "10:00");

  const carDates = useMemo(() => {
    return urlFrom && urlTo ? ([urlFrom, urlTo] as const) : null;
  }, [urlFrom, urlTo]);

  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id");
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [searchParams]);

  // ===== Local UI State =====
  const [deliveryLocation, setDeliveryLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  });
  const [returnLocation, setReturnLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  });
  const [returnDifferent, setReturnDifferent] = useState<boolean>(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState<boolean>(false);
  const [isLocationReturn, setIsLocationReturn] = useState<boolean>(false);
  const [isInfoListOpen, setIsInfoListOpen] = useState<boolean>(false);
  const [apiData, setApiData] = useState<ApiCalcResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [insuranceComplete, setInsuranceComplete] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    email: "",
    phone: "",
  });

  // ✅ وقتی ماشین عوض شد، state های قیمت‌ساز رو reset کن تا قیمت “ارثی” نشه
  const prevCarRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null;
    if (prevCarRef.current === null) {
      prevCarRef.current = cur;
      return;
    }
    if (prevCarRef.current !== cur) {
      prevCarRef.current = cur;
      setSelectedOptions([]);
      setInsuranceComplete(false);
      setDeliveryLocation({ isDesired: false, location: null, address: "" });
      setReturnLocation({ isDesired: false, location: null, address: "" });
      setReturnDifferent(false);
    }
  }, [selectedCarId]);

  // ===== Fake Coupon Dialog =====
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<"idle" | "checking" | "invalid">("idle");
  const couponTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (couponTimerRef.current) clearTimeout(couponTimerRef.current);
    };
  }, []);

  // ✅ fetchKey باید dt/rt داشته باشه وگرنه cache اشتباه میشه
  const fetchKey = useMemo(() => {
    const carId = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : "";
    const branchId = branchIdFromUrl ? String(branchIdFromUrl) : "";
    const from = urlFrom || "";
    const to = urlTo || "";
    const loc = locale || "";
    return `${carId}|${branchId}|${from}|${to}|${loc}|${dt}|${rt}`;
  }, [selectedCarId, branchIdFromUrl, urlFrom, urlTo, locale, dt, rt]);

  const lastFetchKeyRef = useRef<string>("");

  useEffect(() => {
    const carIdRaw = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null;
    const branchIdRaw = branchIdFromUrl != null ? String(branchIdFromUrl) : null;

    // ✅ مهم: اگر دیتاهای لازم نداریم، اسکلتون گیر نکنه
    if (!carIdRaw || !branchIdRaw || !urlFrom || !urlTo) {
      setIsLoading(false);
      setApiData(null);
      return;
    }

    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    let alive = true;

    async function run() {
      try {
        const cached = calcCache.get(fetchKey);
        if (cached) {
          setApiData(cached);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        const inflight = calcInflight.get(fetchKey);
        if (inflight) {
          const data = await inflight;
          if (!alive) return;
          setApiData(data);
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.append("branch_id", String(branchIdRaw));
        params.append("from", String(urlFrom));
        params.append("to", String(urlTo));
        params.append("dt", dt);
        params.append("rt", rt);

        const url = `/car/rent/${carIdRaw}/${locale}?${params.toString()}`;

        const promise = (async () => {
          const res: any = await api.get(url);
          const payload = (res?.data ?? res) as ApiCalcResponse;
          const status = res?.status ?? (payload as any)?.status;

          if (status && Number(status) !== 200) {
            throw new Error((payload as any)?.message || "خطا در دریافت اطلاعات.");
          }
          if (!payload?.item) throw new Error("پاسخ سرور نامعتبر است.");
          return payload;
        })();

        calcInflight.set(fetchKey, promise);
        const data = await promise;
        calcInflight.delete(fetchKey);
        calcCache.set(fetchKey, data);

        if (!alive) return;
        setApiData(data);
      } catch (error: any) {
        calcInflight.delete(fetchKey);
        console.error("Calculation Error:", error);
        toast.error(error?.message || "خطا در ارتباط با سرور.");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [fetchKey, selectedCarId, urlFrom, urlTo, branchIdFromUrl, locale, dt, rt]);

  // ================== Places safe ==================
  const activePlaces = useMemo(() => {
    return Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : [];
  }, [apiData]);

  const delPlace = activePlaces.find((p) => p && String(p.id) === String(deliveryLocation.location));
  const delTitle = delPlace ? (delPlace as any).title : "محل تحویل خودرو را انتخاب کنید";

  const retPlace = activePlaces.find((p) => p && String(p.id) === String(returnLocation.location));
  const retTitle = retPlace ? (retPlace as any).title : "محل عودت خودرو را انتخاب کنید";

  // ================== Totals ==================
  const totals: Totals = useMemo(() => {
    const safeTotals: Totals = {
      total: 0,
      prePay: 0,
      debt: 0,
      tax: 0,
      rentDays: 0,
      dailyPrice: 0,
      extraItems: [],
    };
    if (!apiData?.item) return safeTotals;

    let totalPrice = safeNum((apiData.item as any).pay_price, 0);
    let prePayPrice = safeNum((apiData.item as any).pre_pay_price, 0);

    // ✅ rentDays دقیق
    let rentDays = 1;
    try {
      if (carDates?.length === 2) {
        rentDays = calcRentDaysWithGrace({
          fromDateJalali: carDates[0],
          toDateJalali: carDates[1],
          deliveryTime: dt,
          returnTime: rt,
          graceMinutes: 90,
          jalaliToDate: (jy, jm, jd) => {
            const g = jalaali.toGregorian(jy, jm + 1, jd);
            return new Date(g.gy, g.gm - 1, g.gd);
          },
        });
      }
    } catch {
      rentDays = safeNum((apiData.item as any).rent_days, 1);
    }
    rentDays = rentDays > 0 ? rentDays : 1;

    // ✅ dailyPrice: ترجیحاً از سرور
    const serverDaily =
      safeNum((apiData.item as any).rent_price_day, 0) ||
      safeNum((apiData.item as any).final_price, 0) ||
      0;

    const dailyPrice =
      serverDaily > 0 ? serverDaily : totalPrice > 0 ? totalPrice / rentDays : 0;

    const extraItems: { title: string; price: number }[] = [];

    // Options
    if (Array.isArray(apiData.options)) {
      const safeOptions = apiData.options.filter(
        (o): o is ApiOption => Boolean(o) && typeof (o as any).id !== "undefined",
      );

      selectedOptions.forEach((optId) => {
        const opt = safeOptions.find((o) => o.id === optId);
        if (!opt) return;

        const optPrice = safeNum((opt as any).price_pay, 0);
        const preOpt = safeNum((opt as any).pre_price_pay, 0);

        totalPrice += optPrice;
        prePayPrice += preOpt;

        extraItems.push({ title: (opt as any).title, price: optPrice });
      });
    }

    // Insurance (complete)
    if (insuranceComplete) {
      const insPrice = safeNum((apiData.item as any).insurance_complete_price_pay, 0);
      totalPrice += insPrice;
      prePayPrice += safeNum((apiData.item as any).pre_price_insurance_complete_price_pay, 0);
      extraItems.push({ title: "بسته جامع خسارت", price: insPrice });
    }

    // Places
    if (Array.isArray(apiData.places)) {
      const places = apiData.places.filter(Boolean);
      const getPlaceById = (id: any) => places.find((p) => p && String((p as any).id) === String(id));

      if (deliveryLocation?.location) {
        if (deliveryLocation.location === "desired") {
          extraItems.push({ title: `هزینه تحویل: آدرس دلخواه`, price: 0 });
        } else {
          const del = getPlaceById(deliveryLocation.location);
          const delPrice = safeNum((del as any)?.price_pay, 0);
          const delPre = safeNum((del as any)?.pre_price_pay, 0);

          totalPrice += delPrice;
          prePayPrice += delPre;

          extraItems.push({
            title: `محل تحویل: ${(del as any)?.title || "نامشخص"}`,
            price: delPrice,
          });
        }
      }

      const effectiveReturn = returnDifferent ? returnLocation : deliveryLocation;

      if (effectiveReturn?.location) {
        if (effectiveReturn.location === "desired") {
          extraItems.push({ title: `هزینه عودت: آدرس دلخواه`, price: 0 });
        } else {
          const ret = getPlaceById(effectiveReturn.location);
          const retPrice = safeNum((ret as any)?.price_pay, 0);
          const retPre = safeNum((ret as any)?.pre_price_pay, 0);

          if (returnDifferent) {
            totalPrice += retPrice;
            prePayPrice += retPre;
          }

          extraItems.push({
            title: `محل عودت: ${(ret as any)?.title || "نامشخص"}`,
            price: retPrice,
          });
        }
      }
    }

    // Tax
    let tax = 0;
    const taxPercent = safeNum((apiData.item as any).tax_percent, 0);
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100);
      totalPrice += tax;
      if ((apiData as any).collage_tax_in === "no") prePayPrice += tax;
    }

    return {
      total: totalPrice,
      prePay: prePayPrice,
      debt: totalPrice - prePayPrice,
      tax,
      rentDays,
      dailyPrice,
      extraItems,
    };
  }, [
    apiData,
    selectedOptions,
    insuranceComplete,
    deliveryLocation,
    returnLocation,
    returnDifferent,
    carDates,
    dt,
    rt,
  ]);

  // ✅ قیمت و تخفیف واقعی از API
  const pricing = useRentPricing(apiData, totals.rentDays);
  const offPercent = pricing.offPercent;
  const dailyBefore = pricing.dailyBefore;
  const dailyAfter = pricing.dailyAfter;

  // ✅ اجاره پایه (کل) قبل/بعد تخفیف از API
  const baseRentAfter = pricing.totalAfter;
  const baseRentBefore = pricing.totalBefore;

  const currentLocation = isLocationReturn ? returnLocation : deliveryLocation;
  const [isDesiredChecked, setIsDesiredChecked] = useState(false);

  useEffect(() => {
    setIsDesiredChecked(Boolean(currentLocation?.isDesired));
  }, [isLocationReturn, currentLocation?.isDesired]);

  function openLocationDialog(isReturn: boolean) {
    setIsLocationReturn(isReturn);
    setIsLocationDialogOpen(true);
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!userInfo.name || !userInfo.phone) {
      toast.warning("لطفا نام و شماره تماس را وارد کنید");
      return;
    }
    if (!deliveryLocation?.location) {
      toast.warning("لطفا محل تحویل را انتخاب کنید");
      return;
    }
    if (returnDifferent && !returnLocation?.location) {
      toast.warning("لطفا محل عودت را انتخاب کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!carDates?.[0] || !carDates?.[1] || !branchIdFromUrl) {
        toast.error("اطلاعات رزرو نامعتبر است");
        return;
      }
      if (!selectedCarId) {
        toast.error("خودرو انتخاب نشده است");
        return;
      }

      const payload = {
        branch_id: branchIdFromUrl || 1,
        from: carDates[0],
        to: carDates[1],

        place_delivery: deliveryLocation.location,
        address_delivery: deliveryLocation.isDesired ? deliveryLocation.address : "",

        place_return: returnDifferent
          ? returnLocation.location || deliveryLocation.location
          : deliveryLocation.location,

        address_return: returnDifferent
          ? returnLocation.isDesired
            ? returnLocation.address
            : ""
          : deliveryLocation.isDesired
            ? deliveryLocation.address
            : "",

        first_name: userInfo.name,
        last_name: ".",
        phone: userInfo.phone,
        email: userInfo.email,
        option_check: selectedOptions,
        insurance_complete: insuranceComplete ? "yes" : "no",
      };

      const res: any = await api.post(`/car/rent/${selectedCarId}/${locale}/registration`, payload);
      const data: any = res?.data ?? res;

      const status = res?.status ?? data?.status;
      if (status && Number(status) !== 200) {
        throw new Error(data?.message || "خطا در ثبت رزرو");
      }

      const rentId = data?.item?.rent_id ?? data?.rent_id;
      if (!rentId) {
        toast.warning("رزرو ثبت شد ولی rent_id دریافت نشد");
        return;
      }

      const paymentUrl = data?.payment_url || data?.item?.payment_url;
      if (paymentUrl) {
        const cb = encodeURIComponent(`/rent/${rentId}`);
        const joiner = paymentUrl.includes("?") ? "&" : "?";
        window.location.href = `${paymentUrl}${joiner}callback=${cb}`;
        return;
      }

      toast.success("درخواست رزرو انجام شد");
      router.push(`/rent/reservation?status=initialize&rentid=${rentId}`);
    } catch (error: any) {
      console.error("Booking Error:", error);
      toast.error(error?.message || "خطا در ثبت رزرو");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = (user: { name?: string; phone?: string; email?: string }) => {
    setUserInfo({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
    });
    setIsInfoListOpen(false);
  };

  if (isLoading || !apiData) {
    return <InformationStepSkeleton />;
  }

  const photo0 = Array.isArray((apiData.item as any).photo)
    ? (apiData.item as any).photo?.[0]
    : typeof (apiData.item as any).photo === "string"
      ? (apiData.item as any).photo
      : "";

  const currencyLabel = t((apiData as any).currency);

  // ================== UI Blocks ==================
  const SelectedCarCard = (
    <Card className="border border-gray-200 rounded-none lg:rounded-xl shadow-sm p-0 bg-white dark:bg-gray-900 gap-0">
      <div className="hidden md:block">
        <CardHeader className="px-3 pt-4 pb-2 m-0">
          <CardTitle className="text-sm text-gray-700 dark:text-gray-200">خودرو انتخابی شما</CardTitle>
        </CardHeader>
        <Separator />
      </div>

      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="relative w-28 h-18 rounded bg-gray-100 shrink-0 overflow-hidden">
            <Image
              src={`${STORAGE_URL}${photo0}` || "/images/placeholder.png"}
              alt={(apiData.item as any).title}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-right font-bold text-gray-800 truncate leading-5">
              {(apiData.item as any).title}
            </div>

            <SelectedCarMeta
              fuel={(apiData.item as any).fuel}
              gearbox={(apiData.item as any).gearbox}
              baggage={(apiData.item as any).baggage}
              passengers={(apiData.item as any).person}
            />

            <div className="mt-2 flex items-center justify-between text-xs text-gray-600 leading-4 whitespace-nowrap">
              <div className="flex items-center gap-0.5 min-w-0">
                <span>قیمت روزانه برای</span>
                <span className="text-gray-700">{totals.rentDays} روز:</span>

                {offPercent > 0 ? (
                  <span className="text-gray-400 line-through">{formatNum(dailyBefore)}</span>
                ) : null}

                <span className="text-gray-900">{formatNum(dailyAfter)}</span>
                <span className="text-gray-500">{currencyLabel}</span>
              </div>

              {offPercent > 0 ? (
                <Badge className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-amber-100 px-1 py-0.5 text-[12px]">
                  {formatNum(offPercent)}% تخفیف
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
          >
            کیلومتر نامحدود
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
          >
            تحویل رایگان
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
          >
            بدون ودیعه
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const NoDepositBanner = (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950 bg-emerald-50 px-4 py-3 flex items-center gap-3">
      <div className="mt-0.5 text-emerald-600">
        <Coins size={22} />
      </div>
      <div className="flex-1">
        <div className="font-bold text-emerald-800">بدون ودیعه (دیپوزیت)</div>
        <div className="text-sm text-emerald-700 mt-1">
          برای رزرو این خودرو نیازی به پرداخت ودیعه (دیپوزیت) نیست؛ فقط هزینه اجاره را پرداخت می‌کنید.
        </div>
      </div>
    </div>
  );

  const DeliveryCard = (
    <Card className="border border-gray-200 rounded-xl shadow-sm py-3">
      <CardHeader className="m-0 px-4">
        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
          دوست دارید خودرو را کجا تحویل بگیرید؟
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-12 bg-transparent rounded-lg border-gray-300 text-gray-600"
          onClick={() => openLocationDialog(false)}
        >
          <span
            className={cn("truncate", deliveryLocation.location ? "text-gray-800" : "text-gray-500")}
          >
            {deliveryLocation.location ? delTitle : "محل تحویل خودرو را انتخاب کنید"}
          </span>
          <ChevronDown size={18} className="text-gray-500" />
        </Button>

        {deliveryLocation.isDesired && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">آدرس دقیق (اختیاری)</Label>
            <Input
              value={deliveryLocation.address}
              onChange={(e) =>
                setDeliveryLocation((p) => ({
                  ...p,
                  address: e.target.value,
                }))
              }
              className="h-11 rounded-lg border-gray-300"
              placeholder="آدرس را وارد کنید"
            />
          </div>
        )}

        <div className="flex items-center justify-between p-0 pb-4 m-0">
          <Label className="flex items-center gap-3 cursor-pointer select-none">
            <Switch
              dir="ltr"
              checked={returnDifferent}
              onCheckedChange={(v) => {
                const next = Boolean(v);
                setReturnDifferent(next);
                if (!next)
                  setReturnLocation({
                    isDesired: false,
                    location: null,
                    address: "",
                  });
              }}
            />
            <span className="text-gray-800 font-semibold">خودرو را در محل دیگری عودت می‌دهم</span>
          </Label>
        </div>

        {returnDifferent && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-12 rounded-lg bg-transparent border-gray-300 text-gray-600"
              onClick={() => openLocationDialog(true)}
            >
              <span
                className={cn("truncate", returnLocation.location ? "text-gray-800" : "text-gray-500")}
              >
                {returnLocation.location ? retTitle : "محل عودت خودرو را انتخاب کنید"}
              </span>
              <ChevronDown size={18} className="text-gray-500" />
            </Button>

            {returnLocation.isDesired && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">آدرس دقیق (اختیاری)</Label>
                <Input
                  value={returnLocation.address}
                  onChange={(e) =>
                    setReturnLocation((p) => ({
                      ...p,
                      address: e.target.value,
                    }))
                  }
                  className="h-11 rounded-lg border-gray-300"
                  placeholder="آدرس را وارد کنید"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ExtrasCard = (
    <Card className="border border-gray-200 dark:border-gray-800 rounded-xl md:mb-4 shadow-sm p-0 m-0 gap-0 bg-white dark:bg-gray-900">
      <CardHeader className="p-0 px-4 pt-2">
        <CardTitle className="text-base text-gray-900 flex items-center">آپشن‌های اضافی را انتخاب کنید</CardTitle>
      </CardHeader>

      <CardContent className="p-0 m-0 pb-1">
        <ExtrasList
          options={(apiData as any).options || []}
          selected={selectedOptions}
          setSelected={setSelectedOptions}
          insuranceComplete={insuranceComplete}
          setInsuranceComplete={setInsuranceComplete}
        />
      </CardContent>
    </Card>
  );

  const PersonalInfoCard = (
    <Card className="border p-4 m-0 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      <CardHeader className="p-0 m-0">
        <CardTitle className="text-base text-gray-900 flex justify-between items-center gap-2">
          <p>مشخصات خود را وارد کنید</p>

          <div className="flex items-center justify-between">
            <Button
              variant="link"
              className="px-0 text-blue-600 font-semibold"
              onClick={() => setIsInfoListOpen(true)}
            >
              <UserSearch size={16} className="ml-2" />
              قبلاً ثبت نام کردم
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 m-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-5">
            <Input
              value={userInfo.name}
              onChange={(e) => setUserInfo((p) => ({ ...p, name: e.target.value }))}
              className="h-12 rounded-lg border-gray-300"
              placeholder="نام و نام خانوادگی"
            />
          </div>

          <div className="md:col-span-4 overflow-visible">
            <div dir="ltr" className="w-full overflow-visible relative z-50">
              <PhoneInput
                defaultCountry="ir"
                value={userInfo.phone}
                onChange={(phone: string) => setUserInfo((p) => ({ ...p, phone }))}
                className="w-full"
                inputClassName="!h-12 !w-full !border-0 !bg-transparent !text-sm !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none !pl-3"
                countrySelectorStyleProps={{
                  buttonClassName:
                    "!h-12 !px-3 !border-0 !bg-transparent !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none",
                }}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Input
              value={userInfo.email}
              onChange={(e) => setUserInfo((p) => ({ ...p, email: e.target.value }))}
              className="h-12 rounded-lg border-gray-300"
              placeholder="ایمیل"
              type="email"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mt-6">
          {t("rulesB")}{" "}
          <Link className="text-blue-600 underline" href={"/rules"}>
            {t("rules2")}
          </Link>{" "}
          {t("rulesA")}
        </div>
      </CardContent>
    </Card>
  );

  const SummaryCard = (showButton: boolean) => (
    <Card className="border border-gray-200 p-0 pt-2 pb-1 rounded-xl shadow-sm gap-0 overflow-hidden bg-white">
      <CardHeader className="px-4">
        <CardTitle className="text-md font-bold text-gray-700 p-0 m-0 text-right">جزئیات حساب</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="pt-2 px-4">
        <div>
          <SummaryRow
            label={`قیمت اجاره ${totals.rentDays} روز`}
            value={formatMoneyOrFree(baseRentAfter, currencyLabel)}
            valueBefore={offPercent > 0 ? formatMoneyOrFree(baseRentBefore, currencyLabel) : undefined}
            valueHint={
              <button
                type="button"
                onClick={() => {
                  setCouponState("idle");
                  setCouponCode("");
                  setCouponOpen(true);
                }}
                className="text-[10px] font-medium text-blue-600 mt-0.5"
              >
                کد تخفیف دارم
              </button>
            }
            subLabel={
              offPercent > 0 ? (
                <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                  <span className="line-through text-gray-400">{formatNum(dailyBefore)}</span>
                  <span>
                    {formatNum(dailyAfter)} {currencyLabel}
                  </span>
                  <span className="text-gray-500">روزانه</span>
                  <span>(</span>
                  <span>{offPercent}% تخفیف</span>
                  <span>)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                  <span>
                    {formatNum(dailyAfter)} {currencyLabel}
                  </span>
                  <span className="text-gray-500">روزانه</span>
                </span>
              )
            }
          />

          {totals.extraItems.slice(0, 12).map((x, i) => (
            <SummaryRow key={i} label={x.title} value={formatMoneyOrFree(x.price, currencyLabel)} />
          ))}

          {totals.tax > 0 && (
            <SummaryRow
              label="مالیات"
              subLabel={`${(apiData.item as any).tax_percent || "0"} درصد`}
              value={formatMoneyOrFree(totals.tax, currencyLabel)}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-gray-200">
          <div className="flex items-end justify-between">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">هزینه نهایی برای {totals.rentDays} روز</div>
            </div>

            <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
              {formatNum(totals.total)} {currencyLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 py-4 pb-6 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-2">
          <Info size={16} className="text-gray-400" />
          <span>با ثبت رزرو قوانین پالم رنت را می‌پذیرید</span>
        </div>

        {showButton && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 mb-4 rounded-xl text-base font-extrabold bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت رزرو نهایی"}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // ================== Render ==================
  return (
    <div className="relative">
      {/* ===== Fake Coupon Dialog ===== */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">کد تخفیف</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-right text-sm text-gray-700">کد تخفیف را وارد کنید</Label>

            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="h-12 rounded-lg border-gray-300"
              placeholder="مثلاً: PALM15"
            />

            {couponState === "invalid" ? (
              <div className="text-sm text-red-600 text-right">کد تخفیف اشتباه است.</div>
            ) : null}

            <Button
              type="button"
              className="w-full h-12 rounded-xl font-extrabold"
              disabled={couponState === "checking" || couponCode.trim().length === 0}
              onClick={() => {
                if (couponTimerRef.current) clearTimeout(couponTimerRef.current);

                setCouponState("checking");
                couponTimerRef.current = setTimeout(() => {
                  setCouponState("invalid");
                  toast.error("کد تخفیف اشتباه است");
                }, 2000);
              }}
            >
              {couponState === "checking" ? "در حال بررسی..." : "اعمال کد"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= MOBILE LAYOUT ================= */}
      <div className="lg:hidden pb-28">
        {SelectedCarCard}
        <div className="px-2">
          <div className="mt-2">{NoDepositBanner}</div>
          <div className="mt-2">{DeliveryCard}</div>
          <div className="mt-2">{ExtrasCard}</div>
          <div className="mt-2">{SummaryCard(false)}</div>
          <div className="mt-2">{PersonalInfoCard}</div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-60 bg-white border-t border-gray-200">
        <div className="max-w-130 mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">مبلغ قابل پرداخت</div>
            <div className="text-lg font-extrabold text-blue-600">
              {formatNum(totals.prePay)} {currencyLabel}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl text-base font-extrabold bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت رزرو نهایی"}
          </Button>
        </div>
      </div>

      {/* ================= DESKTOP LAYOUT ================= */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {NoDepositBanner}
            {DeliveryCard}
            {ExtrasCard}
            {PersonalInfoCard}
          </div>

          <div className="lg:col-span-4 space-y-4">
            {SelectedCarCard}
            {SummaryCard(true)}
          </div>
        </div>
      </div>

      {/* ================= Location Dialog ================= */}
      <ResponsiveLocationPicker
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        title={isLocationReturn ? "محل عودت را انتخاب کنید" : "محل تحویل را انتخاب کنید"}
        currencyLabel={currencyLabel}
        places={activePlaces as any}
        value={isLocationReturn ? returnLocation : deliveryLocation}
        onChange={(next) => {
          if (isLocationReturn) setReturnLocation(next);
          else setDeliveryLocation(next);
        }}
      />

      {/* ================= InfoList ================= */}
      {isInfoListOpen && (
        <InfoListDialog open={isInfoListOpen} onOpenChange={setIsInfoListOpen} onSelect={handleSelectUser} />
      )}
    </div>
  );
}

/* ================= SummaryRow (همین فایل) ================= */
export function SummaryRow({
  label,
  value,
  valueBefore,
  subLabel,
  valueHint,
}: {
  label: string;
  value: string;
  valueBefore?: string;
  subLabel?: React.ReactNode;
  valueHint?: React.ReactNode;
}) {
  const isFree = value.includes("رایگان");

  const isDelivery = label.startsWith("محل تحویل:");
  const isReturn = label.startsWith("محل عودت:");

  const normalizedLabel = isDelivery ? "هزینه تحویل" : isReturn ? "هزینه عودت" : label;

  const normalizedSub: React.ReactNode = isDelivery
    ? label.replace("محل تحویل:", "").trim()
    : isReturn
      ? label.replace("محل عودت:", "").trim()
      : subLabel ?? null;

  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="text-sm text-gray-800 leading-5">{normalizedLabel}</div>
          {normalizedSub ? <div className="text-xs text-gray-500 mt-1 leading-4">{normalizedSub}</div> : null}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {valueBefore ? <span className="text-xs text-gray-400 line-through">{valueBefore}</span> : null}

            <span className={`text-sm ${isFree ? "text-gray-500" : "text-gray-800"}`}>{value}</span>
          </div>

          {valueHint ? <div className="mt-1 text-[10px] text-blue-600 font-medium text-left">{valueHint}</div> : null}
        </div>
      </div>
    </div>
  );
}
