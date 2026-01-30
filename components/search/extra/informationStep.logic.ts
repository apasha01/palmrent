/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import jalaali from "jalaali-js";
import { toast } from "react-toastify";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days";

import type { ApiCalcResponse, ApiOption, LocationState, Totals } from "@/types/rent-information";

const calcCache = new Map<string, ApiCalcResponse>();
const calcInflight = new Map<string, Promise<ApiCalcResponse>>();

function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export function useInformationStepLogic() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCarId = searchParams.get("car_id");
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  // ✅ dt/rt normalize
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

  // ================== API fetch key ==================
  const fetchKey = useMemo(() => {
    const carId = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : "";
    const branchId = branchIdFromUrl ? String(branchIdFromUrl) : "";
    const from = urlFrom || "";
    const to = urlTo || "";
    const loc = locale || "";
    return `${carId}|${branchId}|${from}|${to}|${loc}|${dt}|${rt}`;
  }, [selectedCarId, branchIdFromUrl, urlFrom, urlTo, locale, dt, rt]);

  const lastFetchKeyRef = useRef<string>("");

  const [apiData, setApiData] = useState<ApiCalcResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const carIdRaw = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null;
    const branchIdRaw = branchIdFromUrl != null ? String(branchIdFromUrl) : null;

    if (!carIdRaw) return;

    if (!branchIdRaw) {
      toast.error("شعبه نامعتبر است");
      setIsLoading(false);
      setApiData(null);
      return;
    }

    if (!urlFrom || !urlTo) {
      toast.error("تاریخ رزرو نامعتبر است");
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

  // ================== Totals calculator ==================
  function calcTotals(args: {
    apiData: ApiCalcResponse;
    carDates: readonly [string, string] | null;
    dt: string;
    rt: string;
    selectedOptions: number[];
    deliveryLocation: LocationState;
    returnLocation: LocationState;
    returnDifferent: boolean;
  }): Totals {
    const { apiData, carDates, dt, rt, selectedOptions, deliveryLocation, returnLocation, returnDifferent } = args;

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

    const serverDaily =
      safeNum((apiData.item as any).rent_price_day, 0) ||
      safeNum((apiData.item as any).final_price, 0) ||
      0;

    const dailyPrice = serverDaily > 0 ? serverDaily : totalPrice > 0 ? totalPrice / rentDays : 0;

    const extraItems: { title: string; price: number }[] = [];

    // ✅ Options (از API)
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

    // ✅ Places (فقط از API — بدون desired)
    if (Array.isArray(apiData.places)) {
      const places = apiData.places.filter(Boolean);
      const getPlaceById = (id: any) => places.find((p) => p && String((p as any).id) === String(id));

      // delivery
      if (deliveryLocation?.location != null) {
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

      // return
      const effectiveReturn = returnDifferent ? returnLocation : deliveryLocation;

      if (effectiveReturn?.location != null) {
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

    // ✅ Tax
    let tax = 0;
    const taxPercent = safeNum((apiData.item as any).tax_percent, 0);
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100);
      totalPrice += tax;
      if (apiData.collage_tax_in === "no") prePayPrice += tax;
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
  }

  return {
    t,
    locale,
    router,
    searchParams,

    // url/meta
    selectedCarId,
    urlFrom,
    urlTo,
    dt,
    rt,
    carDates,
    branchIdFromUrl,

    // data
    apiData,
    isLoading,
    activePlaces,

    // helpers
    calcTotals,
  };
}
