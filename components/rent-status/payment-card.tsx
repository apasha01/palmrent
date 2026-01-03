/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Car as CarIcon, CalendarDays } from "lucide-react";

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
  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};

  const canPay = payment?.can_pay === true;
  const paymentUrl = payment?.payment_url;

  // ✅ فقط اینا رو نشون میدیم
  const amountToPayToman = Number(payment?.amount_to_pay ?? 0); // مبلغ قابل پرداخت
  const prePay = Number(payment?.pre_pay ?? 0); // پیش پرداخت (برای نمایش)

  const carTitle = [car?.brand, car?.model, car?.year].filter(Boolean).join(" ");

  const fromText = formatDateTimeFa(info?.from_date);
  const toText = formatDateTimeFa(info?.to_date);
  const dayRent = info?.day_rent;

  const onPay = () => {
    if (!canPay || !paymentUrl) return;
    window.location.href = paymentUrl;
  };

  return (
    <div className="flex items-center justify-center mt-4 px-3">
      <Card className="w-full max-w-md border border-border bg-background overflow-hidden relative">
        {/* progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <div className="h-full bg-primary w-2/3 transition-all duration-700 ease-in-out" />
        </div>

        <CardHeader>
          <CardTitle className="text-2xl font-black text-right">
            وضعیت سفارش شما
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="text-center space-y-2 w-full">
              <h3 className="text-xl font-bold text-foreground">تایید انجام شد</h3>
              <p className="text-sm text-muted-foreground max-w-[340px] mx-auto">
                سفارش شما تایید شد. اکنون می‌توانید مبلغ زیر را پرداخت کنید.
              </p>

              {/* ✅ مشخصات ماشین + تاریخ ها کنار هم */}
              <div className="mt-4 p-4 bg-secondary/40 rounded-xl border border-border text-right space-y-3">
                <div className="flex items-center gap-2 justify-between">
                  <div className="text-base font-bold text-foreground">
                    {carTitle || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">خودرو</span>
                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      از {fromText} تا {toText}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">تاریخ</span>
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-foreground">
                      {typeof dayRent !== "undefined" ? toFaNumber(dayRent) : "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">تعداد روز</div>
                  </div>
                </div>
              </div>

              {/* ✅ مبالغ (بدون مالیات) */}
              <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-border text-right space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">
                    {toFaNumber(prePay)} تومان
                  </div>
                  <div className="text-xs text-muted-foreground">پیش‌پرداخت</div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-primary">
                      {toFaNumber(amountToPayToman)} تومان
                    </div>
                    <div className="text-xs text-muted-foreground">مبلغ قابل پرداخت</div>
                  </div>

                  {/* اگر نمیخوای لینک دیده بشه، این رو حذف کن */}
                  {paymentUrl ? (
                    <div className="mt-2 text-xs text-muted-foreground break-all text-left">
                      {paymentUrl}
                    </div>
                  ) : null}
                </div>
              </div>

              <Button
                onClick={onPay}
                disabled={!canPay || !paymentUrl}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
              >
                پرداخت آنلاین
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
