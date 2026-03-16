/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

import { otpRequest } from "@/services/auth/auth.api";
import UserAvatarPopover from "./UserAvatarPopover";
import { useAuth } from "@/hooks/useAuth";
import PhoneInputCustom from "../reserve/PhoneInputCustom";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";

function normalizeMobileE164(input: string): string {
  const raw = (input ?? "").toString().trim();
  if (!raw) return "";

  let s = raw.replace(/[^\d+]/g, "");

  if (s.startsWith("00")) s = "+" + s.slice(2);

  if (s.startsWith("+")) {
    s = "+" + s.slice(1).replace(/\D/g, "");
    return s;
  }

  s = s.replace(/\D/g, "");

  if (/^09\d{9}$/.test(s)) return `+98${s.slice(1)}`;
  if (/^9\d{9}$/.test(s)) return `+98${s}`;

  return s ? `+${s}` : "";
}

type LoginDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  triggerText?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
};

export default function LoginDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerText,
  showCloseButton = true,
  closeOnOutsideClick = true,
}: LoginDialogProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const t = useTranslations("Auth.LoginDialog");

  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // فقط بعد از submit خطای شماره را نشان بده
  const [showMobileError, setShowMobileError] = useState(false);

  const mobileE164 = useMemo(() => normalizeMobileE164(mobile), [mobile]);

  const isPhoneValid = useMemo(
    () => /^\+[1-9]\d{7,14}$/.test(mobileE164),
    [mobileE164]
  );

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!open) {
      setOtp("");
      setLoading(false);
      setShowMobileError(false);
      return;
    }

    setOtp("");
    setLoading(false);
    setShowMobileError(false);
  }, [open]);

  if (isAuthenticated) return <UserAvatarPopover />;

  const resetAll = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setCooldown(0);
    setLoading(false);
    setShowMobileError(false);
  };

  const closeDialog = () => {
    setOpen(false);
    setTimeout(() => resetAll(), 200);
  };

  const sendOtp = async () => {
    setShowMobileError(true);

    if (!isPhoneValid) {
      toast.error(t("toast.invalidMobile"));
      return;
    }

    setLoading(true);
    try {
      await otpRequest(mobileE164);
      toast.success(t("toast.otpSent"));
      setStep("otp");
      setCooldown(60);
      setShowMobileError(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? e?.message ?? t("toast.sendError")
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length !== 5) return;

    setLoading(true);
    try {
      const res = await signIn("otp", {
        redirect: false,
        mobile: mobileE164,
        code,
      });

      if (!res?.ok) {
        toast.error(res?.error || t("toast.wrongOtp"));
        setOtp("");
        return;
      }

      await getSession();
      toast.success(t("toast.loginSuccess"));
      setOpen(false);
      router.refresh();
      setTimeout(() => resetAll(), 250);
    } catch (e: any) {
      toast.error(e?.message ?? t("toast.verifyError"));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"

        >
          {triggerText || t("button.open")}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            if (!closeOnOutsideClick) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!closeOnOutsideClick) e.preventDefault();
          }}
          className={cn(
            // Mobile: fullscreen
            "fixed inset-0 z-100",
            "left-0 top-0 translate-x-0 translate-y-0",
            "h-dvh w-screen max-w-none",
            "rounded-none border-0 shadow-none",
            "p-0 gap-0 overflow-hidden",
            "bg-background dark:bg-gray-950",
            // Desktop: centered modal
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:h-auto sm:w-full sm:max-w-120",
            "sm:rounded-3xl sm:border sm:border-border/50 sm:shadow-2xl"
          )}
        >
          <DialogTitle className="sr-only">{t("srTitle")}</DialogTitle>

          {showCloseButton && (
            <button
              type="button"
              onClick={closeDialog}
              aria-label={t("button.close")}
              className={cn(
                "absolute z-20",
                // Mobile: top right corner
                "right-5 top-5",
                // Desktop: smaller position adjustment
                "sm:right-4 sm:top-4",
                "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl sm:rounded-lg",
                "border border-border/60",
                "bg-background/80 dark:bg-white/5",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/80 dark:hover:bg-white/10",
                "transition-all duration-150"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div
            className={cn(
              "relative flex w-full",
              // Mobile: full height, content at top
              "min-h-dvh items-start pt-16",
              // Desktop: auto height, content centered
              "sm:min-h-0 sm:items-center sm:pt-0",
              "justify-center",
              "px-6 py-10 sm:px-10 sm:py-12"
            )}
          >
            <div className="w-full max-w-105">
              <div className="mb-6 sm:mb-8 flex justify-center">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl",
                    "border border-border/50",
                    "bg-muted/30 dark:bg-white/3"
                  )}
                >
                  <ShieldCheck
                    className="h-7 w-7 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="mb-2 text-[20px] sm:text-[24px] font-bold leading-tight tracking-tight text-foreground">
                  {step === "mobile"
                    ? t("header.titleMobile")
                    : t("header.titleOtp")}
                </h2>

                <p className="text-sm font-light text-muted-foreground">
                  {step === "mobile" ? t("hint.mobile") : t("hint.otp")}
                </p>
              </div>

              {step === "mobile" && (
                <div className="space-y-4">
                  <div dir="ltr">
                    <PhoneInputCustom
                      value={mobile}
                      onChange={(phone: string) => {
                        setMobile(phone);
                        if (showMobileError) setShowMobileError(false);
                      }}
                      error={showMobileError && !isPhoneValid}
                      placeholder={t("placeholders.phone") ?? "912 345 6789"}
                      className={cn(
                        "h-13.5 w-full rounded-2xl",
                        "border border-border/70",
                        "bg-background dark:bg-white/3",
                        "text-foreground placeholder:text-muted-foreground/70",
                        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/25",
                        "transition-all duration-150"
                      )}
                    />
                  </div>

                  {showMobileError && !isPhoneValid && (
                    <p className="px-1 text-xs text-red-500">
                      {t("toast.invalidMobile")}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={sendOtp}
                    className={cn(
                      "flex h-11 w-full items-center justify-center gap-2 rounded-lg",
                      "bg-foreground text-background",
                      "text-[15px] font-semibold",
                       "bg-blue-500",
                      "hover:opacity-90 active:scale-[0.98]",
                      "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
                      "transition-all duration-150"
                    )}
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {t("button.sendOtp")}
                  </button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-5">
                  {(mobileE164 || mobile) && (
                    <div className="flex justify-center">
                      <span
                        dir="ltr"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                          "border border-border/60",
                          "bg-background dark:bg-white/3",
                          "text-xs text-muted-foreground tabular-nums"
                        )}
                      >
                        {mobileE164 || mobile}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={5}
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                        if (val.length === 5) verifyOtp(val);
                      }}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn(
                              "h-15 w-13 rounded-2xl",
                              "border-2 border-border/70",
                              "bg-background dark:bg-white/3",
                              "text-xl font-bold text-foreground",
                              "data-[active=true]:border-ring",
                              "data-[active=true]:bg-muted/60 dark:data-[active=true]:bg-white/6",
                              "transition-all duration-150"
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <button
                    type="button"
                    disabled={otp.length !== 5 || loading}
                    onClick={() => verifyOtp(otp)}
                    className={cn(
                      "flex h-13.5 w-full items-center justify-center gap-2 rounded-2xl",
                      "bg-foreground text-background",
                      "text-[15px] font-semibold",
                      "hover:opacity-90 active:scale-[0.98]",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
                      "transition-all duration-150"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                    )}
                    {t("button.verify")}
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={sendOtp}
                    className={cn(
                      "flex h-11.5 w-full items-center justify-center gap-2 rounded-xl",
                      "border border-border/60",
                      "bg-transparent",
                      "text-sm font-medium text-muted-foreground",
                      "hover:border-border hover:bg-muted/40 hover:text-foreground",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      "transition-all duration-150"
                    )}
                  >
                    <RefreshCcw
                      className={cn(
                        "h-3.5 w-3.5",
                        cooldown > 0 && "animate-spin opacity-50"
                      )}
                    />

                    {cooldown > 0 ? (
                      <span className="tabular-nums">
                        {t("button.resendWithCountdown", {
                          seconds: String(cooldown),
                        })}
                      </span>
                    ) : (
                      t("button.resend")
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("mobile");
                      setOtp("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 pt-1",
                      "text-sm text-muted-foreground hover:text-foreground",
                      "transition-colors duration-150"
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("button.editMobile")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
