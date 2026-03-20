/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

import { getRentStatus } from "@/services/reservation/reservation-status";
import { FailedCard } from "@/components/rent-status/failed-card";
import { ProcessingCard } from "@/components/rent-status/processing-card";
import { RejectedCard } from "@/components/rent-status/rejected-card";
import { PaymentCard } from "@/components/rent-status/payment-card";
import { PaymentSuccessCard } from "@/components/rent-status/payment-success-card";

function buildTitle({
  status,
  fullname,
  isLocked,
  isPaid,
}: {
  status: string | null;
  fullname: string | null | undefined;
  isLocked: boolean;
  isPaid: boolean;
}): string {
  const name = fullname?.trim() || null;

  const loginTitle = name
    ? `ادامه رزرو ، ورود به حساب - ${name}`
    : "ادامه رزرو ، ورود به حساب";

  const uploadTitle = name
    ? `آپلود و بررسی مدارک - ${name}`
    : "آپلود و بررسی مدارک";

  if (status === "initialize") {
    return name ? `بررسی رزرو - ${name}` : "بررسی رزرو";
  }

  if (status === "payment") {
    // اگر پرداخت انجام شده، دیگر نباید "در انتظار پرداخت" باشد
    if (isPaid) {
      return isLocked ? loginTitle : uploadTitle;
    }

    return name ? `در انتظار پرداخت - ${name}` : "در انتظار پرداخت";
  }

  if (status === "upload" || status === "documents") {
    return isLocked ? loginTitle : uploadTitle;
  }

  return "بررسی رزرو";
}

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800",
        className,
      ].join(" ")}
    />
  );
}

function PaymentSuccessSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-gray-900">
      <div className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="flex flex-col items-center pt-2 text-center">
          <SkeletonBlock className="h-[148px] w-[148px] rounded-full" />
          <SkeletonBlock className="mt-2 h-8 w-64 rounded-xl" />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full rounded-lg" />
          <SkeletonBlock className="mt-2 h-4 w-72 max-w-full rounded-lg" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <SkeletonBlock className="h-6 w-28 rounded-lg" />
          <SkeletonBlock className="h-5 w-24 rounded-lg" />
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SkeletonBlock className="h-6 w-64 max-w-full rounded-lg" />
                <SkeletonBlock className="mt-3 h-4 w-56 max-w-full rounded-lg" />
                <SkeletonBlock className="mt-3 h-4 w-44 rounded-lg" />
              </div>
              <SkeletonBlock className="h-5 w-5 shrink-0 rounded-md" />
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="bg-gray-50 px-3 py-3 dark:bg-gray-800/40">
                <SkeletonBlock className="h-4 w-28 rounded-lg" />
              </div>

              <div className="space-y-4 px-3 py-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <div className="flex-1">
                      <SkeletonBlock className="h-4 w-36 rounded-lg" />
                      {idx === 0 ? (
                        <SkeletonBlock className="mt-2 h-3 w-28 rounded-lg" />
                      ) : null}
                    </div>
                    <SkeletonBlock className="h-4 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SkeletonBlock className="mt-6 h-4 w-72 max-w-full rounded-lg" />

        <div className="mt-5">
          <SkeletonBlock className="h-7 w-44 rounded-lg" />

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <SkeletonBlock className="h-[108px] w-full rounded-2xl sm:h-[120px]" />
              <SkeletonBlock className="mx-auto mt-2 h-4 w-14 rounded-lg" />
            </div>
            <div className="hidden" />
          </div>
        </div>

        <div className="mt-6">
          <SkeletonBlock className="h-7 w-40 rounded-lg" />

          <div className="mt-3 grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx}>
                <SkeletonBlock className="h-[108px] w-full rounded-2xl sm:h-[120px]" />
                <SkeletonBlock className="mx-auto mt-2 h-4 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b border-gray-200 pb-2 dark:border-gray-800">
            <SkeletonBlock className="h-7 w-56 rounded-lg" />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <SkeletonBlock className="h-4 w-40 rounded-lg" />
            <SkeletonBlock className="h-5 w-5 rounded-md" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx}>
                <SkeletonBlock className="h-[108px] w-full rounded-2xl sm:h-[120px]" />
                <SkeletonBlock className="mx-auto mt-2 h-4 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b border-gray-200 pb-2 dark:border-gray-800">
            <SkeletonBlock className="h-7 w-20 rounded-lg" />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24 rounded-lg" />
            <SkeletonBlock className="h-5 w-5 rounded-md" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <SkeletonBlock className="h-[108px] w-full rounded-2xl sm:h-[120px]" />
              <SkeletonBlock className="mx-auto mt-2 h-4 w-14 rounded-lg" />
            </div>
            <div className="hidden" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-[560px] px-4 py-3">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ReservationPage(): any {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale: any = useLocale();

  const statusParam = searchParams.get("status");
  const codeParam = searchParams.get("code");
  const rentCode = codeParam ? String(codeParam) : null;

  const paidParam = searchParams.get("paid");
  const traceParam = searchParams.get("trace");
  const reasonParam = searchParams.get("reason");

  const paidFromUrl = paidParam === "1";
  const payFailed = paidParam === "0";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentData, setRentData] = useState<any>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enrichedRentData = useMemo(() => {
    if (!rentData) return rentData;

    const beforeDiscount =
      rentData?.details?.base_rent?.rent_total_before_discount;

    return {
      ...rentData,
      summary: {
        ...rentData?.summary,
        original_total: beforeDiscount ?? null,
      },
    };
  }, [rentData]);

  const isAuthLocked = useMemo(() => {
    const authRequired = enrichedRentData?.auth?.auth_required === true;
    const isLoggedIn = enrichedRentData?.auth?.is_logged_in === true;
    return authRequired && !isLoggedIn;
  }, [
    enrichedRentData?.auth?.auth_required,
    enrichedRentData?.auth?.is_logged_in,
  ]);

  const isPaidResolved = useMemo(() => {
    return enrichedRentData?.payment?.is_paid === true || paidFromUrl;
  }, [enrichedRentData?.payment?.is_paid, paidFromUrl]);

  const pageTitle = useMemo(() => {
    return buildTitle({
      status: statusParam,
      fullname: enrichedRentData?.auth?.fullname,
      isLocked: isAuthLocked,
      isPaid: isPaidResolved,
    });
  }, [
    statusParam,
    enrichedRentData?.auth?.fullname,
    isAuthLocked,
    isPaidResolved,
  ]);

  useLayoutEffect(() => {
    const t = pageTitle.trim();
    if (!t) return;
    if (document.title === t) return;
    document.title = t;
  }, [pageTitle]);

  const buildUrlWithStatus = (nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextStatus);

    if (rentCode) {
      params.set("code", String(rentCode));
    }

    params.delete("rentid");

    return `${pathname}?${params.toString()}`;
  };

  const goUpload = () => {
    router.replace(buildUrlWithStatus("upload"));
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
        e?.response?.data?.message || e?.message || "خطا در ارتباط با سرور",
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
        String(first?.rent_status) === "pending" &&
        first?.is_approved === false;

      if (stillPending) {
        intervalRef.current = setInterval(async () => {
          const latest: any = await fetchStatus();

          const still =
            String(latest?.rent_status) === "pending" &&
            latest?.is_approved === false;

          if (!still && intervalRef.current) {
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

  const needsFetchedData =
    statusParam === "payment" ||
    statusParam === "upload" ||
    statusParam === "documents";

  if (statusParam === "initialize" && loading && !rentData) {
    return <ProcessingCard />;
  }

  if (needsFetchedData && (loading || !enrichedRentData)) {
    return <PaymentSuccessSkeleton />;
  }

  const isRejected = ["rejected", "cancelled", "failed"].includes(
    String(enrichedRentData?.rent_status),
  );

  const isPending =
    String(enrichedRentData?.rent_status) === "pending" &&
    enrichedRentData?.is_approved === false;

  const isApproved =
    enrichedRentData?.is_approved === true ||
    String(enrichedRentData?.rent_status) === "active";

  if (statusParam === "initialize") {
    if (isPending) return <ProcessingCard rentData={enrichedRentData} />;
    if (isRejected) return <RejectedCard />;
    if (isApproved) return <ProcessingCard rentData={enrichedRentData} />;
    return <ProcessingCard rentData={enrichedRentData} />;
  }

  if (statusParam === "payment") {
    if (isRejected) return <RejectedCard />;

    if (isPaidResolved) {
      return (
        <PaymentSuccessCard
          rentData={enrichedRentData}
          trace={traceParam}
          onGoUpload={goUpload}
        />
      );
    }

    return (
      <PaymentCard
        rentData={enrichedRentData}
        payFailed={payFailed}
        reason={reasonParam}
      />
    );
  }

  if (statusParam === "upload" || statusParam === "documents") {
    if (isRejected) return <RejectedCard />;

    return (
      <PaymentSuccessCard
        rentData={enrichedRentData}
        trace={traceParam}
      />
    );
  }

  return <FailedCard />;
}