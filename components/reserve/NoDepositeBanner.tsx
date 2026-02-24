"use client"

import * as React from "react"
import { Coins } from "lucide-react"
import { useTranslations } from "next-intl"

export default function NoDepositBanner() {
  const t = useTranslations("InformationStep")

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950 bg-emerald-50 px-4 py-3 flex items-center gap-3">
      <div className="mt-0.5 text-emerald-600">
        <Coins size={22} />
      </div>

      <div className="flex-1">
        <div className="font-bold text-emerald-800">{t("noDepositBanner.title")}</div>
        <div className="text-sm text-emerald-700 mt-1">{t("noDepositBanner.desc")}</div>
      </div>
    </div>
  )
}