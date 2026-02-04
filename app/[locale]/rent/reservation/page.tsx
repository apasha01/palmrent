/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { getRentStatus } from "@/services/reservation/reservation-status";
import { FailedCard } from "@/components/rent-status/failed-card";
import { ProcessingCard } from "@/components/rent-status/processing-card";
import { RejectedCard } from "@/components/rent-status/rejected-card";
import { PaymentCard } from "@/components/rent-status/payment-card";
import { UploadCard } from "@/components/rent-status/upload-card";
import { PaymentSuccessCard } from "@/components/rent-status/payment-success-card";

export default function ReservationPage(): any {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale: any = useLocale();

  const statusParam: any = searchParams.get("status"); // initialize | payment | upload | documents ...
  const rentId: any = searchParams.get("rentid");

  // ✅ پارامترهای برگشتی از زرین‌پال
  const paidParam = searchParams.get("paid"); // "1" | "0" | null
  const traceParam = searchParams.get("trace"); // string | null
  const reasonParam = searchParams.get("reason"); // string | null

  const paid = paidParam === "1";
  const payFailed = paidParam === "0";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentData, setRentData] = useState<any>(null);

  const intervalRef = useRef<any>(null);

  const buildUrlWithStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);
    if (rentId) params.set("rentid", String(rentId));
    return `${pathname}?${params.toString()}`;
  };

  const goUpload = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", "upload");
    if (rentId) params.set("rentid", String(rentId));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const fetchStatus = async (): Promise<any> => {
    if (!rentId) return null;

    try {
      setError(null);

      const data: any = await getRentStatus(locale, rentId);

      // ✅ اگر سرویس شما کل آبجکت {status,data} برمی‌گردونه، data.data رو بگیر
      // اگر مستقیم data رو برمی‌گردونه، همون رو نگه دار
      const normalized = data?.data ? data.data : data;

      setRentData(normalized);
      console.log("rent status:", normalized);

      return normalized;
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "خطا در ارتباط با سرور");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ پولینگ فقط برای initialize
  useEffect(() => {
    if (!rentId) {
      setLoading(false);
      return;
    }

    // اگر initialize نیست، فقط یکبار وضعیت را بگیر
    if (statusParam !== "initialize") {
      setLoading(true);
      fetchStatus();
      return;
    }

    let cancelled = false;

    const start = async () => {
      setLoading(true);
      const first: any = await fetchStatus();
      if (cancelled) return;

      const stillPending =
        String(first?.rent_status) === "pending" && first?.is_approved === false;

      if (stillPending) {
        intervalRef.current = setInterval(async () => {
          const latest: any = await fetchStatus();

          const still =
            String(latest?.rent_status) === "pending" &&
            latest?.is_approved === false;

          if (!still) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 6000);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentId, statusParam, locale]);

  // ✅ وقتی در initialize تایید شد، URL رو ببر روی payment
  useEffect(() => {
    if (statusParam !== "initialize") return;
    if (!rentData) return;

    const isApproved =
      rentData?.is_approved === true || String(rentData?.rent_status) === "active";

    const isRejected =
      ["rejected", "cancelled", "failed"].includes(String(rentData?.rent_status));

    if (isApproved) {
      router.replace(buildUrlWithStatus("payment"));
      return;
    }

    if (isRejected) {
      // nothing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentData, statusParam]);

  // ---------------------------
  // تصمیم رندر کارت‌ها
  // ---------------------------
  if (!rentId) return <FailedCard />;
  if (error) return <FailedCard />;

  // وقتی هنوز دیتایی نداریم
  if (loading && !rentData) return <ProcessingCard />;

  const isPending =
    String(rentData?.rent_status) === "pending" && rentData?.is_approved === false;

  const isRejected =
    ["rejected", "cancelled", "failed"].includes(String(rentData?.rent_status));

  const isApproved =
    rentData?.is_approved === true || String(rentData?.rent_status) === "active";

  // ✅ initialize
  if (statusParam === "initialize") {
    if (isPending) return <ProcessingCard rentData={rentData} />;
    if (isRejected) return <RejectedCard />;
    if (isApproved) return <ProcessingCard rentData={rentData} />; // useEffect میبره payment
    return <ProcessingCard rentData={rentData} />;
  }

  // ✅ payment
  if (statusParam === "payment") {
    if (isRejected) return <RejectedCard />;

    if (paid) {
      return (
        <PaymentSuccessCard
          rentData={rentData}
          trace={traceParam}
          onGoUpload={goUpload}
        />
      );
    }

    return (
      <PaymentCard
        rentData={rentData}
        payFailed={payFailed}
        reason={reasonParam}
      />
    );
  }

  // ✅ upload/documents
  if (statusParam === "upload" || statusParam === "documents") {
    if (isRejected) return <RejectedCard />;
    return <UploadCard />;
  }

  return <FailedCard />;
}
