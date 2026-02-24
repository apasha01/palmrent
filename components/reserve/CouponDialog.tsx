"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "react-toastify"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function CouponDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("InformationStep")

  const [couponCode, setCouponCode] = useState("")
  const [couponState, setCouponState] = useState<"idle" | "checking" | "invalid">("idle")

  // ✅ درست‌ترین تایپ برای هم Node و هم Browser
  const couponTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCouponTimer = () => {
    if (couponTimerRef.current) {
      clearTimeout(couponTimerRef.current)
      couponTimerRef.current = null
    }
  }

  React.useEffect(() => {
    return () => {
      clearCouponTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setCouponCode("")
          setCouponState("idle")
          clearCouponTimer()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">{t("coupon.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label className="text-right text-sm text-gray-700">{t("coupon.enterLabel")}</Label>

          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="h-12 rounded-lg border-gray-300"
            placeholder={t("coupon.placeholder")}
          />

          {couponState === "invalid" ? (
            <div className="text-sm text-red-600 text-right">{t("coupon.invalidText")}</div>
          ) : null}

          <Button
            type="button"
            className="w-full h-12 rounded-xl font-extrabold"
            disabled={couponState === "checking" || couponCode.trim().length === 0}
            onClick={() => {
              clearCouponTimer()
              setCouponState("checking")

              couponTimerRef.current = setTimeout(() => {
                setCouponState("invalid")
                toast.error(t("coupon.invalidToast"))
                couponTimerRef.current = null
              }, 2000)
            }}
          >
            {couponState === "checking" ? t("coupon.checking") : t("coupon.apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}