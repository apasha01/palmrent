"use client";

import React from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

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

const BRANCH_KEY_BY_SLUG: Record<string, BranchKey> = {
  dubai: "dubai",

  turkey: "istanbul",
  istanbul: "istanbul",

  oman: "oman",
  muscat: "oman",

  kish: "kish",
  izmir: "izmir",
  ankara: "ankara",
  antalya: "antalya",
  samsun: "samsun",
  kayseri: "kayseri",
  georgia: "georgia",
  tbilisi: "georgia",
};

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

const normalizeSlug = (slug?: string | null) => {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-");
};

export function getBranchNameById(
  tBranches: (key: string) => string,
  branchId: string | number | null | undefined,
  fallback = "",
) {
  if (branchId === null || branchId === undefined || branchId === "") {
    return fallback;
  }

  const key = BRANCH_KEY_BY_ID[String(branchId)];
  if (!key) return fallback;

  return tBranches(key);
}

export function getBranchNameBySlug(
  tBranches: (key: string) => string,
  slug: string | null | undefined,
  fallback = "",
) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return fallback;

  const key = BRANCH_KEY_BY_SLUG[normalizedSlug];
  if (!key) return fallback;

  return tBranches(key);
}

type BranchNameProps = {
  slug?: string | null;
  branchId?: string | number | null;
  fallback?: string;
};

export default function BranchName({
  slug,
  branchId,
  fallback = "",
}: BranchNameProps) {
  const pathname = usePathname();
  const tBranches = useTranslations("branchs");

  const directNameBySlug = getBranchNameBySlug(tBranches, slug, "");
  if (directNameBySlug) return <>{directNameBySlug}</>;

  const directNameById = getBranchNameById(tBranches, branchId, "");
  if (directNameById) return <>{directNameById}</>;

  const pathSlug = pathname?.split("/").filter(Boolean).at(-1);
  const pathName = getBranchNameBySlug(tBranches, pathSlug, "");
  if (pathName) return <>{pathName}</>;

  return <>{fallback}</>;
}

export function BranchById({
  fallback = "",
}: {
  fallback?: string;
}) {
  const searchParams = useSearchParams();
  const tBranches = useTranslations("branchs");

  const branchId = searchParams.get("branch_id");
  const name = getBranchNameById(tBranches, branchId, fallback);

  return <>{name}</>;
}