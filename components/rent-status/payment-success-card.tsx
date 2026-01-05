/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Car as CarIcon,
  CalendarDays,
  ReceiptText,
  Upload,
  Copy,
} from "lucide-react";

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

export function PaymentSuccessCard({
  rentData,
  trace,
  onGoUpload,
}: any) {
  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};

  const carTitle = useMemo(
    () => [car?.brand, car?.model, car?.year].filter(Boolean).join(" "),
    [car?.brand, car?.model, car?.year]
  );

  const fromText = formatDateTimeFa(info?.from_date);
  const toText = formatDateTimeFa(info?.to_date);
  const dayRent = info?.day_rent;

  const amountPaid = Number(payment?.amount_to_pay ?? 0);
  const rentCode = rentData?.rent_code ?? "—";
  const traceCode = trace ?? rentData?.tracing_code ?? "—";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center justify-center mt-4 px-3">
      <Card className="w-full max-w-md border border-border bg-background overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <div className="h-full bg-emerald-600 w-full transition-all duration-700 ease-in-out" />
        </div>

        <CardHeader>
          <CardTitle className="text-2xl font-black text-right">
            پرداخت موفق ✅
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center pb-6 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="text-center space-y-2 w-full">
              <h3 className="text-xl font-bold text-foreground">
                پرداخت شما با موفقیت ثبت شد
              </h3>
              <p className="text-sm text-muted-foreground max-w-[340px] mx-auto">
                لطفاً در مرحله بعد مدارک را آپلود کنید تا رزرو نهایی شود.
              </p>

              {/* مشخصات خودرو و زمان */}
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

              {/* فاکتور */}
              <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-border text-right space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-foreground">
                    فاکتور پرداخت
                  </div>
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">کد رزرو</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{rentCode}</span>
                      <button
                        onClick={() => copy(String(rentCode))}
                        className="p-1 rounded-md border border-border hover:bg-secondary"
                        aria-label="copy rent code"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">کد رهگیری</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{traceCode}</span>
                      <button
                        onClick={() => copy(String(traceCode))}
                        className="p-1 rounded-md border border-border hover:bg-secondary"
                        aria-label="copy trace"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مبلغ پرداخت‌شده</span>
                    <span className="text-base font-black text-emerald-600">
                      {toFaNumber(amountPaid)} تومان
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">وضعیت</span>
                    <span className="font-bold text-emerald-600">موفق</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={onGoUpload}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Upload className="h-4 w-4 ml-2" />
                آپلود مدارک
              </Button>

              <div className="text-xs text-muted-foreground text-right mt-2">
                بعد از آپلود مدارک، پشتیبانی رزرو شما را نهایی می‌کند.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
