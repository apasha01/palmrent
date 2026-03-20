/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import Lottie from "lottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, CreditCard } from "lucide-react";
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

export function PaymentCard({ rentData, payFailed, reason }: any) {
  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const payment = rentData?.payment || {};
  const summary = rentData?.summary || {};
  const info = rentData?.rent_info || {};

  const canPay = payment?.can_pay === true;
  const rentId = Number(
    payment?.pay_payload_example?.rent_id ?? rentData?.rent_id ?? 0,
  );

  const taxInRaw = String(payment?.tax_in ?? "no").toLowerCase().trim();
  const taxIn: "yes" | "no" = taxInRaw === "yes" ? "yes" : "no";

  const prePayAed = Number(payment?.pre_pay ?? 0);
  const taxAed = Number(payment?.tax_price ?? 0);
  const tomanRate = Number(payment?.toman_rate ?? 0);
  const payNowToman = Number(payment?.amount_to_pay ?? 0);
  const totalAed = Number(summary?.total ?? 0);

  const payNowAed = taxIn === "no" ? prePayAed + taxAed : prePayAed;
  const totalToman =
    totalAed > 0 && tomanRate > 0 ? Math.round(totalAed * tomanRate) : 0;
  const remainingAed = Math.max(totalAed - payNowAed, 0);

  // ✅ اسم فارسی از summary.car_name
  const carTitle = summary?.car_name || "—";

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

        {/* ===== LOTTIE ===== */}
        <div className="w-full py-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="w-full h-40">
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
          <CardHeader className="p-0 mb-3">
            <div className="w-full flex justify-center">
              <div className="text-center w-full max-w-3xl mx-auto">

                <CardTitle className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white p-0 m-0">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                    <span>رزرو شما تایید شد</span>
                  </span>
                </CardTitle>

                {/* notice box */}
                <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 dark:bg-cyan-950 dark:border-cyan-800 px-4 py-3 text-center">
                  <p className="text-cyan-700 dark:text-cyan-300 font-semibold text-xs leading-6">
                    برای قطعی شدن رزرو لطفا مبلغ پیش پرداخت را در این صفحه پرداخت کنید
                  </p>
                </div>

                {payFailed ? (
                  <div className="mt-2 text-sm font-bold text-red-600">
                    پرداخت ناموفق بود{reason ? `: ${String(reason)}` : ""}
                  </div>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2 p-0 m-0">

            {/* ===== STEPPER ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 md:p-4">
              <div className="flex justify-evenly items-center font-bold text-[11px] sm:text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">ثبت درخواست</span>
                </div>
                <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-emerald-500 shrink-0" />
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">تایید رزرو</span>
                </div>
                <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-gray-300 dark:text-gray-600 shrink-0" />
                <div className="flex items-center gap-1 md:gap-2 text-emerald-600">
                  <CreditCard className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap">پرداخت پیش‌پرداخت</span>
                </div>
              </div>
            </div>

            {/* ===== PAYMENT DETAILS ===== */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="py-3 px-4">

                <span className="font-black text-lg text-gray-900 dark:text-white">
                  جزئیات حساب
                </span>

                {/* توضیح یه‌پارچه فارسی */}
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-8 font-medium">
                  اجاره {carTitle} از {fromText}
                  <br />
                  تا {toText} به مدت{" "}
                  {typeof dayRent !== "undefined" ? toFaNumber(dayRent) : "—"}{" "}
                  روز
                </p>

                <div className="mt-3 space-y-2 text-xs border-t border-gray-200 dark:border-gray-700 pt-2">

                  {/* total */}
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-700 dark:text-gray-200 font-bold whitespace-nowrap">
                      جمع کل هزینه :
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {toFaNumber(totalAed)} درهم ( {toFaNumber(totalToman)} تومان )
                    </span>
                  </div>

                  {/* pay now */}
                  <div className="flex items-center justify-between bg-blue-100 dark:bg-blue-900 rounded-lg px-3 py-2">
                    <span className="font-black whitespace-nowrap text-gray-900 dark:text-white">
                      پیش پرداخت (پرداخت الان) :
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {toFaNumber(payNowAed)} درهم ( {toFaNumber(payNowToman)} تومان )
                    </span>
                  </div>

                  {/* remaining */}
                  <div className="flex items-center justify-between bg-green-100 dark:bg-green-900 rounded-lg px-3 py-2">
                    <span className="text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">
                      مانده حساب (پرداخت هنگام تحویل خودرو) :
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {toFaNumber(remainingAed)} درهم
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

            {/* ===== PAY BUTTON ===== */}
            <div className="flex justify-center">
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

            <p className="text-center text-muted-foreground text-sm">
              پرداخت امن از طریق درگاه زرین پال
            </p>

            {/* ===== TRUST BADGES ===== */}
            <div className="w-full overflow-x-auto pb-8">
              <div className="flex flex-nowrap items-center justify-center gap-4 px-4 min-w-max">
                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image src="/images/peyment/1.webp" alt="1" fill className="object-contain" />
                </div>
                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image src="/images/peyment/2.webp" alt="2" fill className="object-contain" />
                </div>
                <div className="relative h-12 md:h-16 lg:h-20 aspect-5/3 shrink-0">
                  <Image src="/images/peyment/5.webp" alt="5" fill className="object-contain" />
                </div>
                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image src="/images/peyment/3.webp" alt="3" fill className="object-contain" />
                </div>
                <div className="relative h-12 md:h-16 lg:h-20 aspect-square shrink-0">
                  <Image src="/images/peyment/4.webp" alt="4" fill className="object-contain" />
                </div>
              </div>
            </div>

          </CardContent>
        </div>
      </Card>
    </div>
  );
}
