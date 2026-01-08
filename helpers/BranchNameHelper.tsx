"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

const BRANCH_KEYS: Record<number, string> = {
  1: "dubai",
  2: "istanbul",
  6: "oman",
  7: "kish",
  8: "izmir",
  9: "ankara",
  10: "antalya",
  11: "samsun",
  12: "kayseri",
  13: "georgia",
}

export default function BranchName({ fallback = "" }: { fallback?: string }) {
  const searchParams = useSearchParams()
  const t = useTranslations("branchs")

  const branchId = searchParams.get("branch_id")
  if (!branchId) return <>{fallback}</>

  const id = Number(branchId)
  const key = BRANCH_KEYS[id]
  if (!key) return <>{fallback}</>

  return <>{t(key)}</>
}
