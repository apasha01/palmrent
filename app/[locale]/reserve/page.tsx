/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import SearchHeader from "@/components/search/search-header";
import StepRent from "@/components/search/StepsRent";
import ReservePageClient from "./ReservePageClient";

import { normalizeTime } from "@/lib/rent-days";
import { checkReserveOr404 } from "@/services/reservation/check-reserve.server";
import { getReservePageDataServer } from "@/services/reservation/get-reserve-page-data.server";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function normalizeJalaliParam(input?: string | null) {
  if (!input) return null;
  const clean = String(input).replace(/-/g, "/").trim();
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return `${y}/${pad2(m)}/${pad2(d)}`;
}

function safePositiveInt(raw?: string | null) {
  if (!raw) return null;
  const n = Number(String(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingle(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

const BRANCH_KEY_BY_ID: Record<string, string> = {
  "1": "dubai",
  "2": "istanbul",
  "6": "oman",
  "7": "kisk",
  "8": "izmir",
  "9": "ankara",
  "10": "antalya",
  "11": "samsun",
  "12": "kayseri",
  "13": "georgia",
};

function getBranchNameByIdServer(
  tBranchs: (key: string) => string,
  branchId: string | null | undefined,
  fallback = "",
) {
  if (!branchId) return fallback;
  const key = BRANCH_KEY_BY_ID[String(branchId)];
  if (!key) return fallback;
  try {
    return tBranchs(key);
  } catch {
    return fallback;
  }
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  let gy;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }

  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm = 1;
  while (gm <= 12 && days > sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }

  const gd = days;
  return { gy, gm, gd };
}

function parseJalaliToDate(jalali?: string | null) {
  if (!jalali) return null;
  const clean = String(jalali).replace(/-/g, "/").trim();
  const [jy, jm, jd] = clean.split("/").map((x) => parseInt(x, 10));
  if (!jy || !jm || !jd) return null;
  const g = jalaliToGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function calcRentDaysWithGrace(args: {
  from: string | null;
  to: string | null;
  dt?: string | null;
  rt?: string | null;
  graceMinutes?: number;
}) {
  const fromDate = parseJalaliToDate(args.from);
  const toDate = parseJalaliToDate(args.to);
  if (!fromDate || !toDate) return null;

  const deliveryTime = normalizeTime(args.dt || "10:00");
  const returnTime = normalizeTime(args.rt || "10:00");
  const graceMinutes =
    typeof args.graceMinutes === "number" ? args.graceMinutes : 90;

  const [dh, dm] = deliveryTime.split(":").map(Number);
  const [rh, rm] = returnTime.split(":").map(Number);

  const fromFull = new Date(fromDate);
  fromFull.setHours(dh || 0, dm || 0, 0, 0);

  const toFull = new Date(toDate);
  toFull.setHours(rh || 0, rm || 0, 0, 0);

  let totalMinutes = Math.floor(
    (toFull.getTime() - fromFull.getTime()) / 60000,
  );
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) totalMinutes = 0;

  const fullDays = Math.floor(totalMinutes / 1440);
  const remainderMinutes = totalMinutes % 1440;

  let days = fullDays;
  if (remainderMinutes > graceMinutes) days += 1;
  if (days < 1) days = 1;

  return days;
}

function extractCarTitle(payload: any): string {
  return String(
    payload?.item?.title ??
      payload?.item?.name ??
      "",
  ).trim();
}

async function getValidatedReserveInputs(
  params: PageProps["params"],
  searchParams: PageProps["searchParams"],
) {
  const { locale } = await params;
  const sp = await searchParams;

  const branchId = safePositiveInt(getSingle(sp.branch_id));
  const carId = safePositiveInt(getSingle(sp.car_id));
  const from = normalizeJalaliParam(getSingle(sp.from));
  const to = normalizeJalaliParam(getSingle(sp.to));
  const dt = normalizeTime(getSingle(sp.dt) || "10:00");
  const rt = normalizeTime(getSingle(sp.rt) || "10:00");

  return {
    locale,
    sp,
    branchId,
    carId,
    from,
    to,
    dt,
    rt,
    isValid: Boolean(branchId && carId && from && to),
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale, branchId, carId, from, to, dt, rt, isValid } =
    await getValidatedReserveInputs(params, searchParams);

  const t = await getTranslations({ locale, namespace: "InformationStep" });
  const tBranchs = await getTranslations({ locale, namespace: "branchs" });

  const branchName = getBranchNameByIdServer(
    tBranchs,
    branchId ? String(branchId) : "",
    "",
  );

  const rentDays = calcRentDaysWithGrace({ from, to, dt, rt, graceMinutes: 90 });

  let carTitle = "";

  if (isValid) {
    try {
      const reserveData = await getReservePageDataServer({
        carId: carId!,
        locale,
        branchId: branchId!,
        from: from!,
        to: to!,
        dt,
        rt,
      });
      carTitle = extractCarTitle(reserveData);
    } catch (error) {
      console.error("[generateMetadata] reserve data error:", error);
      carTitle = "";
    }
  }

  // ───── build title using i18n keys ─────
  // key: "InformationStep.meta.title"
  // value: "انتخاب محل تحویل{branch}{car}{days} | PalmRent"
  // interpolation params are optional segments built from other keys

  const branchPart = branchName
    ? t("meta.branchIn", { branch: branchName })   // " در {branch}"
    : "";

  const daysPart =
    typeof rentDays === "number" && rentDays > 0
      ? t("meta.forDays", { days: rentDays })       // " برای {days} روز"
      : "";

  const carPart = carTitle
    ? t("meta.carInParens", { car: carTitle })      // " ({car})"
    : "";

  const title = t("meta.title", {
    branch: branchPart,
    car: carPart,
    days: daysPart,
  });

  const description = t("meta.desc", {
    branchPart,
    daysPart,
    carPart,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ReservePage({
  params,
  searchParams,
}: PageProps) {
  const { locale, sp, branchId, carId, from, to, dt, rt, isValid } =
    await getValidatedReserveInputs(params, searchParams);

  if (!isValid) {
    const qs = new URLSearchParams();
    Object.entries(sp).forEach(([key, value]) => {
      if (key === "step" || key === "car_id") return;
      const single = Array.isArray(value) ? value[0] : value;
      if (single != null) qs.set(key, single);
    });
    redirect(`/${locale}/search?${qs.toString()}`);
  }

  await checkReserveOr404({
    carId: carId!,
    locale,
    branchId: branchId!,
    from: from!,
    to: to!,
    dt,
    rt,
  });

  let initialApiData: any = null;
  try {
    initialApiData = await getReservePageDataServer({
      carId: carId!,
      locale,
      branchId: branchId!,
      from: from!,
      to: to!,
      dt,
      rt,
    });
  } catch (error) {
    console.error("[ReservePage] initialApiData fetch failed:", error);
    initialApiData = null;
  }

  const hydrateKey = [
    branchId ?? "",
    carId ?? "",
    from ?? "",
    to ?? "",
    dt ?? "",
    rt ?? "",
  ].join("|");

  return (
    <>
      <Header shadowLess />

      <div className="bg-white dark:bg-background">
        <SearchHeader stepSecond isSticky stepSecondDesktopLikeSearch />
      </div>

      <div className="relative m-auto my-4 max-w-334 px-0 sm:w-[90vw] sm:px-2">
        <StepRent step={3} />
      </div>

      <div className="relative m-auto my-2 max-w-334 px-0 sm:w-[90vw] sm:px-2">
        <Suspense fallback={null}>
          <ReservePageClient
            key={hydrateKey}
            branchId={branchId!}
            carId={carId!}
            from={from!}
            to={to!}
            dt={dt}
            rt={rt}
            initialApiData={initialApiData}
          />
        </Suspense>
      </div>

      <Footer />
    </>
  );
}