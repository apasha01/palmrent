/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import SearchResultPageClient from "./SearchResultPageClient";

function safePositiveInt(raw?: string | null) {
  if (!raw) return null;
  const n = Number(String(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

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

function normalizeTimeLocal(input?: string | null) {
  const s = String(input ?? "").trim();
  if (!s) return "10:00";
  const m = s.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return "10:00";
  const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getBaseApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  return base.replace(/\/+$/, "");
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingle(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

/* ---------------------------------- */
/* فقط برای همین صفحه */
/* ---------------------------------- */

const BRANCH_KEY_BY_ID: Record<string, string> = {
  "1": "dubai",
  "2": "istanbul",
  "6": "oman",
  "7": "kisk", // چون در فایل ترجمه شما داخل branchs این کلید kisk تعریف شده
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

  const deliveryTime = normalizeTimeLocal(args.dt);
  const returnTime = normalizeTimeLocal(args.rt);
  const graceMinutes =
    typeof args.graceMinutes === "number" ? args.graceMinutes : 90;

  const [dh, dm] = deliveryTime.split(":").map(Number);
  const [rh, rm] = returnTime.split(":").map(Number);

  const fromFull = new Date(fromDate);
  fromFull.setHours(dh || 0, dm || 0, 0, 0);

  const toFull = new Date(toDate);
  toFull.setHours(rh || 0, rm || 0, 0, 0);

  let totalMinutes = Math.floor((toFull.getTime() - fromFull.getTime()) / 60000);
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) totalMinutes = 0;

  const fullDays = Math.floor(totalMinutes / 1440);
  const remainderMinutes = totalMinutes % 1440;

  let days = fullDays;
  if (remainderMinutes > graceMinutes) days += 1;
  if (days < 1) days = 1;

  return days;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;

  // متن‌های root مثل chooseCar / day / days
  const t = await getTranslations({ locale });

  // نام شعبه‌ها طبق ساختار فعلی فایل شما
  const tBranchs = await getTranslations({
    locale,
    namespace: "branchs",
  });

  const branchId = safePositiveInt(getSingle(sp.branch_id));
  const from = normalizeJalaliParam(getSingle(sp.from));
  const to = normalizeJalaliParam(getSingle(sp.to));
  const dt = normalizeTimeLocal(getSingle(sp.dt));
  const rt = normalizeTimeLocal(getSingle(sp.rt));

  const branchName = getBranchNameByIdServer(
    tBranchs,
    branchId ? String(branchId) : "",
    "",
  );

  const rentDays = calcRentDaysWithGrace({
    from,
    to,
    dt,
    rt,
    graceMinutes: 90,
  });

  const titleParts: string[] = [t("chooseCar")];

  if (branchName) {
    titleParts.push(branchName);
  }

  if (typeof rentDays === "number") {
    const dayLabel = rentDays === 1 ? t("day") : t("days");
    titleParts.push(`${rentDays} ${dayLabel}`);
  }

  const title = titleParts.join(" - ");

  return {
    title,
    description: title,
    openGraph: {
      title,
      description: title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: title,
    },
  };
}

export default async function SearchResultPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const branchId = safePositiveInt(getSingle(sp.branch_id));
  const from = normalizeJalaliParam(getSingle(sp.from));
  const to = normalizeJalaliParam(getSingle(sp.to));
  const dt = normalizeTimeLocal(getSingle(sp.dt));
  const rt = normalizeTimeLocal(getSingle(sp.rt));

  // فقط وقتی branch داریم precheck بزن
  if (branchId) {
    const apiBase = getBaseApiUrl();

    const qs = new URLSearchParams();
    qs.set("branch_id", String(branchId));

    if (from && to) {
      qs.set("from", from);
      qs.set("to", to);
      qs.set("dt", dt);
      qs.set("rt", rt);
    }

    const url = `${apiBase}/car/filter/${locale}?${qs.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 404) {
      notFound();
    }

    let raw: any = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }

    const status = Number(raw?.status ?? res.status);

    if (status === 404) {
      notFound();
    }
  }

  return (
    <Suspense fallback={null}>
      <SearchResultPageClient />
    </Suspense>
  );
}