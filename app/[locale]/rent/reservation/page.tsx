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

export default function ReservationPage(): any {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale: any = useLocale();

  const statusParam: any = searchParams.get("status"); // initialize | payment | upload | documents ...
  const rentId: any = searchParams.get("rentid");

  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [rentData, setRentData] = useState<any>(null);

  const intervalRef = useRef<any>(null);

  const buildUrlWithStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);
    if (rentId) params.set("rentid", String(rentId));
    return `${pathname}?${params.toString()}`;
  };

  const fetchStatus = async (): Promise<any> => {
    if (!rentId) return null;

    try {
      setError(null);
      const res: any = await getRentStatus(locale, rentId);

      // فرض: خروجی شما { status: 200, data: {...} }
      const data = res?.data ?? res; // اگه getRentStatus خودش data رو برگردوند
      setRentData(data);

      console.log("rent status:", data);
      return data;
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "خطا در ارتباط با سرور"
      );
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

    // اگر initialize نیست، فقط یکبار وضعیت رو بگیر
    if (statusParam !== "initialize") {
      setLoading(true);
      fetchStatus();
      return;
    }

    let cancelled: any = false;

    const start = async () => {
      setLoading(true);
      const first: any = await fetchStatus();
      if (cancelled) return;

      const stillPending: any =
        String(first?.rent_status) === "pending" && first?.is_approved === false;

      if (stillPending) {
        intervalRef.current = setInterval(async () => {
          const latest: any = await fetchStatus();

          const still: any =
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

  // ✅ وقتی در initialize تایید شد، URL رو ببر روی payment (بدون رفرش)
  useEffect(() => {
    if (statusParam !== "initialize") return;
    if (!rentData) return;

    const isApproved =
      rentData?.is_approved === true || String(rentData?.rent_status) === "active";

    const isRejected =
      ["rejected", "cancelled", "failed"].includes(String(rentData?.rent_status));

    // اگه تایید شد -> برو payment
    if (isApproved) {
      router.replace(buildUrlWithStatus("payment"));
      return;
    }

    // اگه رد شد -> برو initialize همونجا میمونه، کارت rejected نمایش میده
    if (isRejected) {
      // هیچ
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentData, statusParam]);

  // ---------------------------
  // تصمیم رندر کارت‌ها
  // ---------------------------

  if (!rentId) return <FailedCard />;
  if (error) return <FailedCard />;

  if (loading && !rentData) return <ProcessingCard />;

  const isPending: any =
    String(rentData?.rent_status) === "pending" && rentData?.is_approved === false;

  const isRejected: any =
    ["rejected", "cancelled", "failed"].includes(String(rentData?.rent_status));

  const isApproved: any =
    rentData?.is_approved === true || String(rentData?.rent_status) === "active";

  // ✅ initialize
  if (statusParam === "initialize") {
    if (isPending) return <ProcessingCard />;
    if (isRejected) return <RejectedCard />;
    if (isApproved) return <ProcessingCard />; // چون useEffect بالا سریع میبره payment
    return <ProcessingCard />;
  }

  // ✅ payment
  if (statusParam === "payment") {
    if (isRejected) return <RejectedCard />;
    return <PaymentCard rentData={rentData} />;
  }

  // ✅ upload/documents
  if (statusParam === "upload" || statusParam === "documents") {
    if (isRejected) return <RejectedCard />;
    return <UploadCard />;
  }

  return <FailedCard />;
}
