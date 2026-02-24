/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getRentStatus } from "@/services/reservation/reservation-status";
import { FailedCard } from "@/components/rent-status/failed-card";
import { ProcessingCard } from "@/components/rent-status/processing-card";
import { RejectedCard } from "@/components/rent-status/rejected-card";
import { PaymentCard } from "@/components/rent-status/payment-card";
import { UploadCard } from "@/components/rent-status/upload-card";
import { PaymentSuccessCard } from "@/components/rent-status/payment-success-card";
import { useSearchParams } from "next/navigation";

export default function ReservationPage(): any {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale: any = useLocale();

  const statusParam: any = searchParams.get("status");
  const codeParam: any = searchParams.get("code");

  const rentCode: string | null = codeParam ? String(codeParam) : null;

  const paidParam = searchParams.get("paid");
  const traceParam = searchParams.get("trace");
  const reasonParam = searchParams.get("reason");

  const paid = paidParam === "1";
  const payFailed = paidParam === "0";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentData, setRentData] = useState<any>(null);

  const intervalRef = useRef<any>(null);

  const buildUrlWithStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);
    if (rentCode) params.set("code", String(rentCode));
    params.delete("rentid");
    return `${pathname}?${params.toString()}`;
  };

  const goUpload = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", "upload");
    if (rentCode) params.set("code", String(rentCode));
    params.delete("rentid");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const fetchStatus = async (): Promise<any> => {
    if (!rentCode) return null;

    try {
      setError(null);
      const data: any = await getRentStatus(String(locale), String(rentCode));
      const normalized = data?.data ? data.data : data;
      setRentData(normalized);
      return normalized;
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "خطا در ارتباط با سرور"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rentCode) {
      setLoading(false);
      return;
    }

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
  }, [rentCode, statusParam, locale]);

  useEffect(() => {
    if (statusParam !== "initialize") return;
    if (!rentData) return;

    const isApproved =
      rentData?.is_approved === true ||
      String(rentData?.rent_status) === "active";

    if (isApproved) {
      router.replace(buildUrlWithStatus("payment"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentData, statusParam]);

  if (!rentCode) return <FailedCard />;
  if (error) return <FailedCard />;

  if (statusParam === "initialize" && loading && !rentData) {
    return <ProcessingCard />;
  }

  const isRejected =
    ["rejected", "cancelled", "failed"].includes(String(rentData?.rent_status));

  const isPending =
    String(rentData?.rent_status) === "pending" &&
    rentData?.is_approved === false;

  const isApproved =
    rentData?.is_approved === true ||
    String(rentData?.rent_status) === "active";

  if (statusParam === "initialize") {
    if (isPending) return <ProcessingCard rentData={rentData} />;
    if (isRejected) return <RejectedCard />;
    if (isApproved) return <ProcessingCard rentData={rentData} />;
    return <ProcessingCard rentData={rentData} />;
  }

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
      <PaymentCard rentData={rentData} payFailed={payFailed} reason={reasonParam} />
    );
  }

  if (statusParam === "upload" || statusParam === "documents") {
    if (isRejected) return <RejectedCard />;
    return <UploadCard />;
  }

  return <FailedCard />;
}