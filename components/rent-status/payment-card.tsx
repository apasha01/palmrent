/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Lottie from "lottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  CalendarDays,
  ChevronLeft,
  CreditCard,
} from "lucide-react";
import sucess from "@/public/lottie/Success.json";
import { requestZarinpalPayment } from "@/services/Zarinpal/Zarinpal";
import Image from "next/image";

function toFaNumber(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("fa-IR").format(num);
}

function formatDateTimeFa(input?: string) {
  if (!input) return "—";
  const iso = input.replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return input.replace(" 00:00:00", "");

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function PaymentCard({ rentData }: any) {
  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};

  const canPay = payment?.can_pay === true;

  const rentId = Number(
    payment?.pay_payload_example?.rent_id ?? rentData?.rent_id ?? 0,
  );

  const amountToPayToman = Number(payment?.amount_to_pay ?? 0); // تومان
  const prePay = Number(payment?.pre_pay ?? 0); // درهم

  // ✅ اضافه‌های لازم فقط برای محاسبه ۳ رکورد
  const taxIn = String(payment?.tax_in ?? "").toLowerCase(); // "yes" | "no"
  const taxAed = Number(payment?.tax_price ?? 0); // درهم
  const tomanRate = Number(payment?.toman_rate ?? 0); // تومان برای هر 1 درهم
  const totalAed = Number(rentData?.summary?.total ?? 0); // کل رزرو (درهم)

  // ✅ پرداخت الان (درهم) مطابق بک‌اند: اگر tax_in=no => pre_pay + tax_price
  const payNowAed = taxIn === "no" ? prePay + taxAed : prePay;

  // ✅ پرداخت الان (تومان): همون amount_to_pay که بک به زرین‌پال می‌فرسته
  const payNowToman = amountToPayToman;

  // ✅ جمع کل تومان: totalAed × rate
  const totalToman =
    totalAed > 0 && tomanRate > 0 ? Math.round(totalAed * tomanRate) : 0;

  // ✅ باقی مانده
  const remainingAed = Math.max(totalAed - payNowAed, 0);
  const remainingToman = Math.max(totalToman - payNowToman, 0);

  const carTitle = useMemo(
    () => [car?.brand, car?.model, car?.year].filter(Boolean).join(" "),
    [car?.brand, car?.model, car?.year],
  );

  const fromText = formatDateTimeFa(info?.from_date);
  const toText = formatDateTimeFa(info?.to_date);
  const dayRent = info?.day_rent;

  const onPay = async () => {
    if (!canPay || !rentId || rentId <= 0) return;

    try {
      setPayError(null);
      setLoadingPay(true);

      const res = await requestZarinpalPayment({ rent_id: rentId });

      if (!res?.ok || !res?.payment_url) {
        const msg =
          res?.message || res?.errors?.message || "لینک پرداخت دریافت نشد";
        setPayError(String(msg));
        return;
      }

      window.location.href = res.payment_url;
    } catch (e: any) {
      setPayError(
        e?.response?.data?.message || e?.message || "خطا در ارتباط با سرور",
      );
    } finally {
      setLoadingPay(false);
    }
  };

  const disabled = !canPay || !rentId || rentId <= 0 || loadingPay;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 p-0 m-0">
      <Card className="w-full p-0! m-0! relative overflow-hidden shadow-none bg-white dark:bg-gray-900 border-none">
        {/* ===== TOP LOTTIE ===== */}
        <div className="w-full py-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="w-full h-56">
              <Lottie
                animationData={sucess}
                className="w-full h-full"
                loop={false}
              />
            </div>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="max-w-5xl md:max-w-6xl w-full mx-auto px-2 py-0! sm:px-4">
          {/* ===== HEADER ===== */}
          <CardHeader className="p-0">
            <div className="w-full flex justify-center">
              <div className="text-center w-full max-w-3xl mx-auto">
                <CardTitle className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white p-0 m-0">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                    <span className="whitespace-normal sm:whitespace-nowrap">
                      رزرو شما تایید شد
                    </span>
                  </span>
                </CardTitle>

                <p className="mt-3 text-base text-gray-700 dark:text-gray-200 leading-9 text-center">
                  برای قطعی شدن رزرو، پیش‌پرداخت را انجام دهید.
                  <br />
                  <span className="whitespace-normal sm:whitespace-nowrap">
                    در این مرحله فقط هزینه پیش‌پرداخت انجام می‌شود.
                  </span>
                  <br />
                  <span className="whitespace-normal sm:whitespace-nowrap">
                    باقی‌مانده هنگام تحویل خودرو پرداخت می‌شود.
                  </span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-0 m-0">
            {/* ===== STEPPER (like sample) ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 md:p-4">
              <div className="flex justify-evenly items-center font-bold text-[11px] sm:text-xs md:text-sm">
                {/* ثبت درخواست */}
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">ثبت درخواست</span>
                </div>

                <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-emerald-500 shrink-0" />

                {/* تایید رزرو */}
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">تایید رزرو</span>
                </div>

                <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-gray-300 dark:text-gray-600 shrink-0" />

                {/* پرداخت پیش پرداخت */}
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">پرداخت پیش‌پرداخت</span>
                </div>
              </div>
            </div>

            {/* ===== PAYMENT DETAILS (like screenshot box) ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="py-6">
                {/* header with right gutter bar on mobile */}
                <div className="flex items-center">
                  <div className="flex w-full">
                    <div className="h-10 rounded-l-lg bg-gray-700 w-2 md:hidden" />
                    <div className="flex items-center gap-2 w-full px-6 md:px-6">
                      <CreditCard className="h-7 w-7 text-gray-600 dark:text-gray-300 shrink-0" />
                      <span className="font-black text-xl text-gray-900 dark:text-white">
                        جزئیات پرداخت
                      </span>
                    </div>
                  </div>
                </div>

                {/* body */}
                <div className="mt-5 space-y-4 text-sm px-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">
                      خودرو:
                    </span>
                    <strong className="whitespace-nowrap">
                      {carTitle || "—"}
                    </strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">
                      تاریخ:
                    </span>
                    <strong>
                      از {fromText} تا {toText}
                    </strong>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 whitespace-nowrap">
                      تعداد روز:
                    </span>
                    <strong className="whitespace-nowrap">
                      {typeof dayRent !== "undefined"
                        ? toFaNumber(dayRent)
                        : "—"}
                    </strong>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {/* ✅ total (درهم + تومان) */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700 dark:text-gray-200 font-bold">
                        جمع کل:
                      </span>
                      <span className="font-black text-gray-900 dark:text-white">
                        {toFaNumber(totalAed)} درهم = {toFaNumber(totalToman)} تومان
                      </span>
                    </div>

                    {/* ✅ pay now (درهم + تومان) */}
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 dark:text-emerald-300 font-black">
                        پرداخت الآن (پیش‌پرداخت):
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        {toFaNumber(payNowAed)} درهم = {toFaNumber(payNowToman)} تومان
                      </span>
                    </div>

                    {/* ✅ remaining (درهم + تومان) */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-300 font-bold">
                        پرداخت هنگام تحویل:
                      </span>
                      <span className="font-black text-gray-900 dark:text-white">
                        {toFaNumber(remainingAed)} درهم 
                        {/* {toFaNumber(remainingAed)} درهم = {toFaNumber(remainingToman)} تومان */}
                      </span>
                    </div>

                    {payError ? (
                      <div className="mt-2 text-xs text-red-600 text-right">
                        {payError}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== PAY BUTTON (big like screenshot) ===== */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={onPay}
                disabled={disabled}
                className="w-full max-w-xl h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg disabled:opacity-50"
              >
                {loadingPay
                  ? "در حال انتقال به درگاه..."
                  : "پرداخت پیش‌پرداخت و قطعی کردن رزرو"}
              </Button>
            </div>

            <p className="text-center text-muted-foreground">
              پرداخت امن از طریق درگاه زرین پال
            </p>

            <div className="w-full overflow-x-auto pb-8">
              <div className="flex flex-nowrap items-center justify-center gap-4 px-4 min-w-max">
                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image
                    src="/images/peyment/1.webp"
                    alt="1"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image
                    src="/images/peyment/2.webp"
                    alt="2"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="relative h-12 md:h-16 lg:h-20 aspect-[5/3] shrink-0">
                  <Image
                    src="/images/peyment/5.webp"
                    alt="5"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image
                    src="/images/peyment/3.webp"
                    alt="3"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image
                    src="/images/peyment/4.webp"
                    alt="4"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
