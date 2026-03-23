"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToastBanner from "@/components/ui/toast";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function CouponDrawer({ open, onOpenChange }: Props) {
  const t = useTranslations("InformationStep");

  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<"idle" | "checking" | "invalid">("idle");

  /* ---- toast state ---- */
  const [toastText, setToastText] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  const showToastError = (text: string) => {
    setToastText(text);
    setToastKey((k) => k + 1);
    setToastVisible(true);
  };

  const couponTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (couponTimerRef.current) {
      clearTimeout(couponTimerRef.current);
      couponTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const resetState = () => {
    setCouponCode("");
    setCouponState("idle");
    setToastVisible(false);
    clearTimers();
  };

  React.useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <>
      {/* ── toast اینجاست، خارج از Drawer تا z-index مشکل نداشته باشه ── */}
      {toastVisible && (
        <ToastBanner
          variant="error"
          text={toastText}
          triggerKey={toastKey}
          mobilePosition={{ side: "bottom", offset: 120 }}
          desktopBottomOffset={48}
          onClose={() => setToastVisible(false)}
        />
      )}

      <Drawer
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) resetState();
        }}
      >
        <DrawerContent className="w-full  rounded-t-2xl">
          <div className="max-w-3xl w-full mx-auto">
          <DrawerHeader className="px-4 pt-2 pb-1" >
            <DrawerTitle className="text-right">
              {t("coupon.title")}
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-3 px-4 pb-4">
            <Label className="block text-right text-sm text-gray-700 dark:text-gray-300">
              {t("coupon.enterLabel")}
            </Label>

            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                if (couponState === "invalid") setCouponState("idle");
              }}
              className="h-12 rounded-lg border-gray-300"
              placeholder={t("coupon.placeholder")}
              dir="ltr"
            />

            <Button
              type="button"
              className="h-12 w-full rounded-xl font-extrabold"
              disabled={
                couponState === "checking" || couponCode.trim().length === 0
              }
              onClick={() => {
                clearTimers();
                setCouponState("checking");

                couponTimerRef.current = setTimeout(() => {
                  setCouponState("invalid");
                  showToastError(t("coupon.invalidToast"));
                  couponTimerRef.current = null;

                  closeTimerRef.current = setTimeout(() => {
                    onOpenChange(false);
                    closeTimerRef.current = null;
                  }, 150);
                }, 2000);
              }}
            >
              {couponState === "checking"
                ? t("coupon.checking")
                : t("coupon.apply")}
            </Button>
          </div>

          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}