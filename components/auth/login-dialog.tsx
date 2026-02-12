/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  KeyRound,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

import { otpRequest } from "@/services/auth/auth.api";
import UserAvatarPopover from "./UserAvatarPopover";
import { useAuth } from "@/hooks/useAuth";

import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

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

export default function LoginDialog() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"mobile" | "otp">("mobile");

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const mobileE164 = useMemo(() => normalizeMobileE164(mobile), [mobile]);
  const isPhoneValid = useMemo(() => /^\+[1-9]\d{7,14}$/.test(mobileE164), [mobileE164]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (isAuthenticated) return <UserAvatarPopover />;

  const resetAll = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setCooldown(0);
    setLoading(false);
  };

  const sendOtp = async () => {
    if (!isPhoneValid) {
      toast.error("لطفاً شماره موبایل معتبر وارد کنید");
      return;
    }

    setLoading(true);
    try {
      await otpRequest(mobileE164);
      toast.success("کد تایید ارسال شد");
      setStep("otp");
      setCooldown(60);
    } catch (e: any) {
      console.log("[sendOtp]", e?.response?.status, e?.response?.data, e);
      toast.error(e?.response?.data?.message ?? e?.message ?? "خطا در ارسال کد");
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

      console.log("[signIn otp result]", res);

      if (!res?.ok) {
        toast.error(res?.error || "کد وارد شده صحیح نیست");
        setOtp("");
        return;
      }

      await getSession();
      toast.success("ورود با موفقیت انجام شد");

      setOpen(false);
      router.refresh();
      setTimeout(() => resetAll(), 250);
    } catch (e: any) {
      console.log("[verifyOtp]", e);
      toast.error(e?.message ?? "خطا در تایید کد");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-full border-primary/20 hover:bg-primary/5 transition-all duration-300"
      >
        ورود / عضویت سریع
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setTimeout(() => resetAll(), 200);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl bg-background">
          <DialogTitle className="sr-only">ورود</DialogTitle>

          {/* ✅ Header: ساده + تمیز */}
          <div className="px-6 pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">حساب کاربری</p>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {step === "mobile" ? "ورود / عضویت" : "تایید کد"}
                </h2>
              </div>

              <div className="h-11 w-11 rounded-2xl bg-muted flex items-center justify-center ring-1 ring-border">
                <ShieldCheck className="h-5 w-5 text-foreground/80" />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {step === "mobile"
                ? "شماره همراه را وارد کنید تا کد تایید ارسال شود."
                : "کد ۵ رقمی ارسال‌شده را وارد کنید تا وارد شوید."}
            </p>

            {step === "otp" && (mobileE164 || mobile) ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                <Smartphone className="h-3.5 w-3.5" />
                <span className="tabular-nums">{mobileE164 || mobile}</span>
              </div>
            ) : null}
          </div>

          <div className="px-6 pb-6 ">
            {step === "mobile" ? (
              <div className="space-y-">
                {/* ✅ PhoneInput کاملاً یک‌دست با Input shadcn */}
                <div className="space-y-1">
                  <div
                  className="my-4"
                    dir="ltr"
                  >
                    <PhoneInput
                      defaultCountry="ir"
                      value={mobile}
                      onChange={(phone: string) => setMobile(phone)}
                      className="w-full"
                      // 🔥 این دو تا باعث میشه 100% مثل input بشه
                      inputClassName={cn(
                        "!h-11 !w-full !border-0 !bg-transparent",
                        "!text-sm !outline-none !shadow-none !ring-0",
                        "!focus:ring-0 !focus:outline-none",
                        "!pl-2"
                      )}
                      countrySelectorStyleProps={{
                        buttonClassName: cn(
                          "!h-11 !px-2 !border-0 !bg-transparent",
                          "!outline-none !shadow-none !ring-0",
                          "!focus:ring-0 !focus:outline-none"
                        ),
                      }}
                    />
                  </div>

         
                </div>

                <Button
                  disabled={!isPhoneValid || loading}
                  onClick={sendOtp}
                  className="w-full h-12 rounded-xl font-extrabold gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="h-5 w-5" />
                  )}
                  دریافت کد تایید
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
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
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className={cn(
                            "w-12 h-12 rounded-xl text-xl font-bold",
                            "bg-muted/70 dark:bg-muted",
                            "border-2",
                       
                            "transition"
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  disabled={otp.length !== 5 || loading}
                  onClick={() => verifyOtp(otp)}
                  className="w-full h-12 rounded-xl font-extrabold gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  تایید و ورود
                </Button>

                <Button
                  variant="ghost"
                  disabled={cooldown > 0 || loading}
                  onClick={sendOtp}
                  className="w-full h-11 rounded-xl font-medium gap-2 hover:text-primary transition-colors"
                >
                  <RefreshCcw
                    className={cn("h-4 w-4", cooldown > 0 && "animate-spin-slow opacity-40")}
                  />
                  {cooldown > 0 ? (
                    <span className="tabular-nums">ارسال مجدد کد ({cooldown})</span>
                  ) : (
                    "ارسال دوباره کد"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                  }}
                  className="text-xs font-semibold hover:text-primary transition-all flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  ویرایش شماره همراه
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
