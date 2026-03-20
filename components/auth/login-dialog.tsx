/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

import { ArrowRight, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";

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
import Image from "next/image";
import { useWebOTP } from "@/hooks/useWebOTP";
import useDIR from "@/hooks/use-rtl";

// ── shake keyframes ────────────────────────────────────────────────────────
const SHAKE_STYLE = `
@keyframes otp-shake {
  0%,100% { transform: translateX(0);   }
  15%     { transform: translateX(-9px);}
  30%     { transform: translateX(9px); }
  45%     { transform: translateX(-6px);}
  60%     { transform: translateX(6px); }
  75%     { transform: translateX(-3px);}
  90%     { transform: translateX(3px); }
}
.otp-shake { animation: otp-shake 0.55s ease-in-out; }
`;

function InjectShakeStyle() {
  useEffect(() => {
    if (document.getElementById("otp-shake-style")) return;
    const tag = document.createElement("style");
    tag.id = "otp-shake-style";
    tag.textContent = SHAKE_STYLE;
    document.head.appendChild(tag);
  }, []);
  return null;
}

// ── localStorage helpers ───────────────────────────────────────────────────
const OTP_STORAGE_KEY = "otp_session";

interface OTPSession {
  mobile: string;
  expiresAt: number;
}

const saveOTPSession = (mobile: string, durationSeconds: number) => {
  try {
    localStorage.setItem(
      OTP_STORAGE_KEY,
      JSON.stringify({ mobile, expiresAt: Date.now() + durationSeconds * 1000 })
    );
  } catch {}
};

const clearOTPSession = () => {
  try {
    localStorage.removeItem(OTP_STORAGE_KEY);
  } catch {}
};

const loadOTPSession = (): OTPSession | null => {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;
    const session: OTPSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearOTPSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const getRemainingSeconds = (session: OTPSession | null): number => {
  if (!session) return 0;
  const remaining = Math.ceil((session.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

// ── mobile helpers ─────────────────────────────────────────────────────────
function onlyDigits(input: string) {
  return (input ?? "").replace(/\D/g, "");
}

function getIranMobileLocal(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith("+")) {
    const n = "+" + raw.slice(1).replace(/\D/g, "");
    return /^\+989\d{9}$/.test(n) ? `0${n.slice(3)}` : "";
  }

  let d = onlyDigits(raw);
  if (d.startsWith("0098")) d = d.slice(4);
  if (d.startsWith("98")) d = d.slice(2);
  if (/^9\d{9}$/.test(d) || /^09\d{9}$/.test(d)) return d;

  return d;
}

function normalizeMobileE164(input: string): string {
  const local = getIranMobileLocal(input);
  if (/^09\d{9}$/.test(local)) return `+98${local.slice(1)}`;
  if (/^9\d{9}$/.test(local)) return `+98${local}`;
  return "";
}

function isValidIranianMobile(input: string): boolean {
  const raw = (input ?? "").trim();
  if (!raw) return false;
  if (raw.startsWith("+"))
    return /^\+989\d{9}$/.test("+" + raw.slice(1).replace(/\D/g, ""));

  let d = onlyDigits(raw);
  if (d.startsWith("0098")) d = d.slice(4);
  if (d.startsWith("98")) d = d.slice(2);
  if (d.startsWith("0")) return /^09\d{9}$/.test(d);
  return /^9\d{9}$/.test(d);
}

// ── error i18n mapping ─────────────────────────────────────────────────────
function mapBackendErrorToI18nKey(message: string): string | null {
  const m = (message ?? "").toLowerCase();

  if (
    m.includes("please wait") ||
    m.includes("too many request") ||
    m.includes("429")
  ) {
    return "tooManyRequests";
  }

  if (
    m.includes("sms failed") ||
    m.includes("sms service") ||
    m.includes("502")
  ) {
    return "smsFailed";
  }

  if (
    m.includes("network") ||
    m.includes("connection") ||
    m.includes("اتصال")
  ) {
    return "networkError";
  }

  if (m.includes("blocked") || m.includes("مسدود")) return "userBlocked";
  if (m.includes("expired") || m.includes("not requested")) return "otpExpired";

  if (m.includes("too many attempt") || m.includes("max attempt")) {
    return "tooManyAttempts";
  }

  if (m.includes("server") || m.includes("500") || m.includes("503")) {
    return "serverError";
  }

  if (
    m.includes("invalid otp") ||
    m.includes("wrong") ||
    m.includes("incorrect")
  ) {
    return "wrongOtp";
  }

  return null;
}

// ── types ──────────────────────────────────────────────────────────────────
type LoginDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  triggerText?: string;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  hideWhenAuthenticated?: boolean;
};

// ── component ──────────────────────────────────────────────────────────────
export default function LoginDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerText,
  showCloseButton = true,
  closeOnOutsideClick = true,
  hideWhenAuthenticated = false,
}: LoginDialogProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isRtl } = useDIR();
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
  const [showMobileError, setShowMobileError] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [otpShake, setOtpShake] = useState(false);

  const triggerShake = () => {
    setOtpError(true);
    setOtpShake(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
      });
    });
  };

  const resolveErrorMessage = (
    rawMessage: string,
    fallbackKey: string
  ): string => {
    const i18nKey = mapBackendErrorToI18nKey(rawMessage);

    if (i18nKey) {
      try {
        return t(`toast.${i18nKey}`);
      } catch {
        return rawMessage;
      }
    }

    try {
      return t(`toast.${fallbackKey}`);
    } catch {
      return rawMessage;
    }
  };

  const mobileLocal = useMemo(() => getIranMobileLocal(mobile), [mobile]);
  const mobileE164 = useMemo(() => normalizeMobileE164(mobile), [mobile]);
  const isPhoneValid = useMemo(() => isValidIranianMobile(mobile), [mobile]);
  const isSendOtpDisabled = useMemo(
    () => loading || !isPhoneValid,
    [loading, isPhoneValid]
  );

  useWebOTP(
    (code) => {
      setOtp(code);
      verifyOtp(code);
    },
    step === "otp" && open
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
      setSmsError(null);
      setOtpError(false);
      setOtpShake(false);
      return;
    }

    const session = loadOTPSession();
    if (session) {
      const remaining = getRemainingSeconds(session);
      if (remaining > 0) {
        setMobile(session.mobile);
        setStep("otp");
        setCooldown(remaining);
      } else {
        clearOTPSession();
      }
    }

    setOtp("");
    setLoading(false);
    setShowMobileError(false);
    setSmsError(null);
    setOtpError(false);
    setOtpShake(false);
  }, [open]);

  if (isAuthenticated) {
    if (hideWhenAuthenticated) return null;
    return <UserAvatarPopover />;
  }

  const resetAll = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setCooldown(0);
    setLoading(false);
    setShowMobileError(false);
    setSmsError(null);
    setOtpError(false);
    setOtpShake(false);
    clearOTPSession();
  };

  const closeDialog = () => {
    setOpen(false);
    setTimeout(() => {
      setOtp("");
      setLoading(false);
      setShowMobileError(false);
      setSmsError(null);
      setOtpError(false);
      setOtpShake(false);
    }, 200);
  };

  const handleBackButton = () => {
    if (step === "otp") {
      setStep("mobile");
      setOtp("");
      setOtpError(false);
      setSmsError(null);
    } else {
      closeDialog();
    }
  };

  const sendOtp = async () => {
    setShowMobileError(true);
    if (!isPhoneValid || !mobileE164) return;

    const session = loadOTPSession();
    if (session && session.mobile === mobile) {
      const remaining = getRemainingSeconds(session);
      if (remaining > 0) {
        setStep("otp");
        setCooldown(remaining);
        setShowMobileError(false);
        return;
      }
    }

    setLoading(true);
    setSmsError(null);

    try {
      await otpRequest(mobileE164);
      saveOTPSession(mobile, 75);
      setStep("otp");
      setCooldown(75);
      setShowMobileError(false);
    } catch (e: any) {
      setSmsError(resolveErrorMessage(e?.message ?? "", "smsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!mobileE164) return;

    setLoading(true);
    setSmsError(null);

    try {
      await otpRequest(mobileE164);
      saveOTPSession(mobile, 75);
      setCooldown(75);
      setOtp("");
      setOtpError(false);
    } catch (e: any) {
      setSmsError(resolveErrorMessage(e?.message ?? "", "smsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length !== 5 || !mobileE164) return;

    setLoading(true);

    try {
      const res = await signIn("otp", {
        redirect: false,
        mobile: mobileE164,
        code,
      });

      if (!res?.ok) {
        setOtp("");
        triggerShake();
        return;
      }

      await getSession();
      clearOTPSession();
      setOpen(false);
      router.refresh();
      setTimeout(() => resetAll(), 250);
    } catch {
      setOtp("");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <InjectShakeStyle />

      {!hideTrigger && (
        <Button onClick={() => setOpen(true)} variant="outline" size="sm">
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
            "fixed inset-0 left-0 top-0 translate-x-0 translate-y-0",
            "h-dvh w-screen max-w-none rounded-none border-0 shadow-none",
            "p-0 gap-0 overflow-hidden bg-white",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:h-auto sm:w-full ",
            "sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl"
          )}
        >
          <DialogTitle className="sr-only">{t("srTitle")}</DialogTitle>

          <div className="flex h-dvh flex-col sm:h-auto">
            {/* header */}
            <div className={cn("flex items-center px-5 pt-5", isRtl ? "justify-start" : "justify-start")}>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={handleBackButton}
                  aria-label={step === "otp" ? t("button.back") : t("button.close")}
                  className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-800"
                >
                  {isRtl ? (
                    <ArrowRight className="h-5 w-5" />
                  ) : (
                    <ArrowLeft className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-12">
              <div className="mb-4 flex justify-center">
                <Image
                  src="/images/logo.png"
                  width={100}
                  height={100}
                  alt={t("image.logoAlt")}
                  className="filter-[invert(1)] dark:filter-none"
                />
              </div>

              {/* ── step: mobile ── */}
              {step === "mobile" && (
                <div dir="rtl">
                  <h2 className="mb-8 text-center text-[20px] font-bold text-gray-900">
                    {t("header.titleMobile")}
                  </h2>

                  <p className="mb-5 text-center text-sm text-gray-500">
                    {t("hint.mobile")}
                  </p>

                  <div dir="ltr" className="mb-2">
                    <PhoneInputCustom
                      value={mobile}
                      onChange={(phone: string) => {
                        setMobile(phone);
                        if (showMobileError) setShowMobileError(false);
                        if (smsError) setSmsError(null);
                      }}
                      error={showMobileError && !isPhoneValid}
                      placeholder={t("placeholders.phone")}
                      defaultCountry="ir"
                      lockedCountry={true}
                      className={cn(
                        "h-14 w-full rounded-xl border border-gray-300 bg-white",
                        "text-gray-900 placeholder:text-gray-400",
                        "focus-within:border-[#3AA4F5] focus-within:ring-1 focus-within:ring-[#3AA4F5]/30",
                        "transition-all duration-150",
                        showMobileError && !isPhoneValid && "border-red-400",
                        smsError && "border-red-400"
                      )}
                    />
                  </div>

                  {showMobileError && !isPhoneValid && !smsError && (
                    <p className="mb-3 px-1 text-xs text-red-500" dir="rtl">
                      {t("toast.invalidMobile")}
                    </p>
                  )}

                  {smsError && (
                    <p className="mb-3 px-1 text-xs text-red-500" dir="rtl">
                      {smsError}
                    </p>
                  )}

                  <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                    {t("terms.suffix-text")}
                    <span className="cursor-pointer text-[#3AA4F5] hover:underline">
                      {" "}
                      {t("terms.link")}{" "}
                    </span>
                    {t("terms.prefix-text")}
                  </p>
                </div>
              )}

              {/* ── step: otp ── */}
              {step === "otp" && (
                <div dir="rtl">
                  <h2 className="mb-8 text-center text-[16px] font-bold text-gray-900">
                    {t("header.titleOtp")}
                  </h2>

                  <div className="mb-4 flex items-center justify-between gap-0.5">
                    <p className="text-xs text-gray-600" dir="ltr">
                      <span dir="rtl">{t("otp.sentDone")}</span>
                      <span className="tabular-nums font-medium text-gray-800">
                        {mobileLocal.startsWith("0") ? mobileLocal : `0${mobileLocal}`}
                      </span>
                      <span dir="rtl">{t("otp.sentPrefix")}</span>
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("mobile");
                        setOtp("");
                        setOtpError(false);
                        setSmsError(null);
                      }}
                      className="text-sm font-medium text-[#3AA4F5] hover:underline"
                    >
                      {t("button.editMobile")}
                    </button>
                  </div>

                  <div
                    className={cn("mb-6 flex justify-center", otpShake && "otp-shake")}
                    dir="ltr"
                  >
                    <InputOTP
                      maxLength={5}
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                        if (otpError) setOtpError(false);
                        if (val.length === 5) verifyOtp(val);
                      }}
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    >
                      <InputOTPGroup className="gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn(
                              "h-12 w-14 rounded-lg border text-2xl font-bold text-gray-900 transition-all duration-150",
                              otpError
                                ? "border-red-400 bg-red-50 text-red-600"
                                : "border-gray-200 bg-white",
                              !otpError &&
                                "data-[active=true]:border-[#3AA4F5] data-[active=true]:shadow-sm"
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {otpError && (
                    <p className="mb-2 text-center text-xs text-red-500">
                      {t("toast.wrongOtp")}
                    </p>
                  )}

                  <div className="mb-2 flex justify-center">
                    {cooldown > 0 ? (
                      <span className="tabular-nums text-sm text-gray-400" dir="rtl">
                        {t("otp.resendCountdown", {
                          time: formatCooldown(cooldown),
                        })}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={resendOtp}
                        className="flex items-center gap-1.5 text-sm text-[#3AA4F5] hover:underline disabled:opacity-50"
                      >
                        <RefreshCcw
                          className={cn("h-3.5 w-3.5", !isRtl && "scale-x-[-1]")}
                        />
                        {t("button.resend")}
                      </button>
                    )}
                  </div>

                  {smsError && (
                    <p className="mt-1 text-center text-xs text-red-500" dir="rtl">
                      {smsError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="px-5 pb-8 pt-4 sm:px-10 md:px-12">
              {step === "mobile" ? (
                <button
                  type="button"
                  disabled={isSendOtpDisabled}
                  onClick={sendOtp}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                    "text-[16px] font-bold text-white transition-all duration-150 shadow-sm",
                    isSendOtpDisabled
                      ? "cursor-not-allowed bg-[#3AA4F5]/40"
                      : "bg-[#3AA4F5] hover:bg-[#2993e8] active:scale-[0.98]"
                  )}
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {t("button.sendOtp")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={otp.length !== 5 || loading}
                  onClick={() => verifyOtp(otp)}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                    "bg-[#3AA4F5] text-[16px] font-bold text-white",
                    "hover:bg-[#2993e8] active:scale-[0.98]",
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
                    "transition-all duration-150 shadow-sm"
                  )}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {t("button.verify")}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}