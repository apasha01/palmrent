"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const BRANCH_KEYS: Record<string, string> = {
  dubai: "dubai",
  turkey: "istanbul",
  oman: "oman",
  kish: "kish",
  izmir: "izmir",
  ankara: "ankara",
  antalya: "antalya",
  samsun: "samsun",
  kayseri: "kayseri",
  georgia: "georgia",
};

export default function BranchName({ fallback = "" }: { fallback?: string }) {
  const pathname = usePathname();
  const t = useTranslations("branchs");

  if (!pathname) return <>{fallback}</>;

  // آخر path رو می‌گیریم
  const slug = pathname.split("/").filter(Boolean).at(-1);

  if (!slug) return <>{fallback}</>;

  const key = BRANCH_KEYS[slug];
  if (!key) return <>{fallback}</>;

  return <>{t(key)}</>;
}
