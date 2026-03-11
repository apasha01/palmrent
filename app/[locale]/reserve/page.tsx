/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReserveInformation from "@/components/reserve/ReserveInformation";

import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
import { normalizeTime } from "@/lib/rent-days";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

/* ---------------- helpers ---------------- */



function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeJalaliParam(input?: string | null) {
  if (!input) return null;
  const clean = (String(input)).replace(/-/g, "/").trim();
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return `${y}/${pad2(m)}/${pad2(d)}`;
}

function safePositiveInt(raw?: string | null) {
  if (!raw) return null;
  const n = Number((String(raw)));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** ✅ defer: مطمئن برای hydrate قبل از render محتوا */
const defer = (fn: () => void) => {
  if (typeof queueMicrotask === "function") return queueMicrotask(fn);
  Promise.resolve().then(fn);
};

function ReservePageContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const branchId = useMemo(() => safePositiveInt(searchParams.get("branch_id")), [searchParams]);
  const carId = useMemo(() => safePositiveInt(searchParams.get("car_id")), [searchParams]);
  const from = useMemo(() => normalizeJalaliParam(searchParams.get("from")), [searchParams]);
  const to = useMemo(() => normalizeJalaliParam(searchParams.get("to")), [searchParams]);
  const dt = useMemo(() => normalizeTime(searchParams.get("dt") || "10:00"), [searchParams]);
  const rt = useMemo(() => normalizeTime(searchParams.get("rt") || "10:00"), [searchParams]);

  const isValid = Boolean(branchId && carId && from && to);

  const hydrateKey = useMemo(() => {
    return [branchId ?? "", carId ?? "", from ?? "", to ?? "", dt ?? "", rt ?? ""].join("|");
  }, [branchId, carId, from, to, dt, rt]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isValid) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("step");
      params.delete("car_id");

      router.replace(`/search?${params.toString()}`);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(false);

    defer(() => {
      const st: any = useSearchPageStore.getState();

      if (typeof st?.setRoadMapStep === "function") st.setRoadMapStep(3);
      if (typeof st?.setBranchId === "function") st.setBranchId(branchId!);
      if (typeof st?.setSelectedCarId === "function") st.setSelectedCarId(carId!);
      if (typeof st?.setCarDates === "function") st.setCarDates([from!, to!]);
      if (typeof st?.setDeliveryTime === "function") st.setDeliveryTime(dt);
      if (typeof st?.setReturnTime === "function") st.setReturnTime(rt);

      setReady(true);
    });
  }, [hydrateKey, isValid, router, locale, searchParams, branchId, carId, from, to, dt, rt]);

  if (!isValid) return null;
  if (!ready) return null;

  return (
    <>
      <Header shadowLess />

      <div className="bg-white dark:bg-background">
        <SearchHeader stepSecond isSticky stepSecondDesktopLikeSearch />
      </div>

      <div className="sm:w-[90vw] max-w-334 m-auto relative my-4 px-0 sm:px-2">
        <StepRent step={3} />
      </div>

      <div className="sm:w-[90vw] max-w-334 m-auto relative my-2 px-0 sm:px-2">
        {/* ✅ key باعث میشه اگر query عوض شد، حتما remount */}
        <ReserveInformation key={hydrateKey} />
      </div>

      <Footer />
    </>
  );
}

export default function ReservePage() {
  return (
    <Suspense fallback={null}>
      <ReservePageContent />
    </Suspense>
  );
}