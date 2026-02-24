"use client";

import React from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

/**
 * ✅ کلیدهای مشترک ترجمه‌ی شعبه‌ها
 * هرجا branch لازم بود => از t(`branches.${key}`) استفاده می‌کنیم
 */
export type BranchKey =
  | "dubai"
  | "istanbul"
  | "oman"
  | "kish"
  | "izmir"
  | "ankara"
  | "antalya"
  | "samsun"
  | "kayseri"
  | "georgia";

/**
 * ✅ از slug آخر مسیر (مثلاً /fa/branches/dubai) => key ترجمه
 */
const BRANCH_KEY_BY_SLUG: Record<string, BranchKey> = {
  dubai: "dubai",
  turkey: "istanbul", // ✅ اگر slug شما turkey هست ولی اسمش استانبوله
  istanbul: "istanbul",
  oman: "oman",
  kish: "kish",
  izmir: "izmir",
  ankara: "ankara",
  antalya: "antalya",
  samsun: "samsun",
  kayseri: "kayseri",
  georgia: "georgia",
};

/**
 * ✅ از branch_id توی query => key ترجمه
 * (قبلاً متن فارسی داشتی؛ الان فقط key نگه می‌داریم)
 */
export const BRANCH_KEY_BY_ID: Record<string, BranchKey> = {
  "1": "dubai",
  "2": "istanbul",
  "6": "oman",
  "7": "kish",
  "8": "izmir",
  "9": "ankara",
  "10": "antalya",
  "11": "samsun",
  "12": "kayseri",
  "13": "georgia",
};

/**
 * ✅ Helper برای جاهایی که JSX نمی‌خوان و string لازم دارن
 * مثل meta/title builder
 *
 * استفاده:
 * const t = useTranslations("branches")
 * const name = getBranchNameById(t, branchId, "")
 */
export function getBranchNameById(
  tBranches: (key: string) => string,
  branchId: string | null | undefined,
  fallback = "",
) {
  if (!branchId) return fallback;
  const key = BRANCH_KEY_BY_ID[String(branchId)];
  if (!key) return fallback;
  return tBranches(key);
}

/**
 * ✅ Helper برای slug (اگر لازم شد بیرون کامپوننت)
 */
export function getBranchNameBySlug(
  tBranches: (key: string) => string,
  slug: string | null | undefined,
  fallback = "",
) {
  if (!slug) return fallback;
  const key = BRANCH_KEY_BY_SLUG[String(slug)];
  if (!key) return fallback;
  return tBranches(key);
}

/**
 * ✅ کامپوننت: اسم شعبه از آخر مسیر (slug)
 * مثال: /fa/branches/dubai => branches.dubai
 */
export default function BranchName({ fallback = "" }: { fallback?: string }) {
  const pathname = usePathname();
  const tBranches = useTranslations("branchs");

  if (!pathname) return <>{fallback}</>;

  const slug = pathname.split("/").filter(Boolean).at(-1);
  if (!slug) return <>{fallback}</>;

  const name = getBranchNameBySlug(tBranches, slug, "");
  if (!name) return <>{fallback}</>;

  return <>{name}</>;
}

/**
 * ✅ کامپوننت: اسم شعبه از branch_id توی query
 * مثال: ?branch_id=2 => branches.istanbul
 */
export function BranchById({ fallback = "" }: { fallback?: string }) {
  const searchParams = useSearchParams();
  const tBranches = useTranslations("branchs");

  const branchId = searchParams.get("branch_id");
  const name = getBranchNameById(tBranches, branchId, "");

  if (!name) return <>{fallback}</>;
  return <>{name}</>;
}