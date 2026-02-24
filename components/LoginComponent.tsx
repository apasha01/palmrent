/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "next-auth/react";
import { showToast } from "@/redux/slices/globalSlice";
import {
  changeIsStage2,
  changePhoneNumber,
  setError,
  setLoading,
} from "@/redux/slices/loginSlice";

import { otpRequest } from "@/services/auth/auth.api";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

/**
 * ✅ Normalize to E.164
 */
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

/**
 * Wrapper Component for Login UI
 */
export default function LoginComponent() {
  const isStage2 = useSelector((state: any) => state.login.isStage2);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#F6F6F6]">
      <LoginBox>{!isStage2 ? <LoginStage1 /> : <LoginStage2 />}</LoginBox>
    </div>
  );
}

export function LoginBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white flex p-8 flex-col gap-6 w-[487px] shadow-lg">
      <Link className="w-full flex justify-center" href="/">
        <Image
          className="filter-[invert(1)]"
          src="/images/logo.png"
          width={170}
          height={76}
          alt="Palm Rent Logo"
          priority
        />
      </Link>

      {children}

      <div className="flex justify-center gap-2 text-xs text-gray-500 mt-2">
        <Link className="text-[#1E40AF] hover:underline" href="/rules">
          قوانین و مقررات
        </Link>
        و
        <Link className="text-[#1E40AF] hover:underline" href="/privacy">
          حریم خصوصی
        </Link>
      </div>
    </div>
  );
}

/**
 * Stage 1: PhoneInput + Request OTP
 * ✅ از PhoneInput استفاده می‌کنیم، ولی UI دقیقاً مثل shadcn Input یکدست میشه
 */
export function LoginStage1() {
  const dispatch = useDispatch();
  const phoneNumber = useSelector((state: any) => state.login.phoneNumber);
  const isLoading = useSelector((state: any) => state.login.isLoading);
  const error = useSelector((state: any) => state.login.error);

  const mobileE164 = useMemo(
    () => normalizeMobileE164(phoneNumber ?? ""),
    [phoneNumber]
  );

  const isPhoneValid = useMemo(() => {
    return /^\+[1-9]\d{7,14}$/.test(mobileE164);
  }, [mobileE164]);

  function phoneHandler(value: string) {
    // react-international-phone خودش + و اعداد میده
    dispatch(changePhoneNumber(value));
    dispatch(setError(null));
  }

  async function submitHandler() {
    if (!isPhoneValid) return;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const data = await otpRequest(mobileE164);
      dispatch(changeIsStage2(true));

      const msg =
        (data as any)?.dev_code
          ? `کد تایید ارسال شد (Dev: ${(data as any).dev_code})`
          : "کد تایید ارسال شد";

      dispatch(showToast({ message: msg, type: "success" }));
    } catch (e: any) {
      const msg = e?.message ?? "خطا در ارسال کد";
      dispatch(setError(msg));
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      dispatch(setLoading(false));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitHandler();
      }}
      className="text-[#1A1A1A] flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xl font-extrabold">ورود به حساب کاربری</div>
          <div className="text-xs text-gray-500">
            لطفاً شماره موبایل خود را وارد نمایید.
          </div>
        </div>

   
      </div>

      {/* PhoneInput (یکدست با shadcn Input) */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">شماره موبایل</span>

        {/* قاب شبیه Input شَدسی‌اِن */}
        <div

        >
          <div dir="ltr" className="w-full">
            <PhoneInput
              defaultCountry="ir"
              value={phoneNumber}
              onChange={(v: string) => phoneHandler(v)}
              className="w-full"
              // خود input داخلی
              inputClassName={cn(
                "!h-10 !w-full !border-0 !bg-transparent",
                "!text-sm !outline-none !shadow-none !ring-0",
                "!focus:ring-0 !focus:outline-none",
                "!pl-2 !pr-0"
              )}
              // دکمه انتخاب کشور
              countrySelectorStyleProps={{
                buttonClassName: cn(
                  "!h-10 !px-2 !border-0 !bg-transparent",
                  "!outline-none !shadow-none !ring-0",
                  "!focus:ring-0 !focus:outline-none"
                ),
              }}
            />
          </div>
        </div>

        {/* اگر خواستی E164 رو جایی نشون بدی */}
        {/* <div className="text-[10px] text-gray-400">E164: {mobileE164}</div> */}

        {error && <span className="text-red-500 text-xs">{error}</span>}
   
      </div>

      <Button
        disabled={!isPhoneValid || isLoading}
        type="submit"
        className="w-full h-12 rounded-xl font-extrabold shadow-md shadow-blue-200"
      >
        {isLoading ? "در حال ارسال..." : "دریافت کد تایید"}
      </Button>
    </form>
  );
}

/**
 * Stage 2: Verify OTP via NextAuth
 * ✅ signIn('otp', { mobile: +98..., code })
 */
export function LoginStage2() {
  const dispatch = useDispatch();
  const router = useRouter();

  const phoneNumber = useSelector((state: any) => state.login.phoneNumber);
  const isLoading = useSelector((state: any) => state.login.isLoading);

  const mobileE164 = useMemo(
    () => normalizeMobileE164(phoneNumber ?? ""),
    [phoneNumber]
  );

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  async function verifyHandler(code?: string) {
    const finalCode = (code ?? otp).trim();
    if (finalCode.length !== 5) return;

    dispatch(setLoading(true));
    setLocalError(null);

    try {
      const res = await signIn("otp", {
        mobile: mobileE164,
        code: finalCode,
        redirect: false,
      });

      if (res?.ok) {
        dispatch(
          showToast({ message: "ورود با موفقیت انجام شد", type: "success" })
        );
        router.push("/");
        return;
      }

      const msg = res?.error || "کد وارد شده صحیح نیست.";
      setLocalError(msg);
      dispatch(showToast({ message: msg, type: "error" }));
      setOtp("");
    } catch (e: any) {
      const msg = e?.message ?? "خطا در تایید کد";
      setLocalError(msg);
      dispatch(showToast({ message: msg, type: "error" }));
      setOtp("");
    } finally {
      dispatch(setLoading(false));
    }
  }

  useEffect(() => {
    if (otp.length === 5) verifyHandler(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const resend = async () => {
    dispatch(setLoading(true));
    setLocalError(null);

    try {
      await otpRequest(mobileE164);
      setTimer(120);
      dispatch(
        showToast({ message: "کد تایید مجدداً ارسال شد", type: "success" })
      );
    } catch (e: any) {
      const msg = e?.message ?? "خطا در ارسال مجدد کد";
      setLocalError(msg);
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="text-[#1A1A1A] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold">کد تایید را وارد کنید</h2>
          <div className="text-xs text-gray-500">
            کد برای
            <span className="font-bold text-black tabular-nums" dir="ltr">
              {mobileE164}
            </span>
            پیامک شد.
          </div>

          <button
            onClick={() => {
              dispatch(changeIsStage2(false));
              dispatch(setError(null));
              setLocalError(null);
              setOtp("");
            }}
            className="text-xs text-[#3B82F6] mt-1 hover:underline inline-flex items-center gap-1"
            type="button"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            ویرایش شماره موبایل
          </button>
        </div>

   
      </div>

      {/* ✅ Shadcn OTP (LTR order حتی زیر RTL) */}
      <div className="flex justify-center">
        <InputOTP
          dir="ltr"
          maxLength={5}
          value={otp}
          onChange={(val) => setOtp(val.replace(/\D/g, ""))}
          autoFocus
          containerClassName="[direction:ltr] [unicode-bidi:plaintext]"
        >
          <InputOTPGroup
            dir="ltr"
            style={{ direction: "ltr" }}
            className="gap-3 flex-row justify-start [direction:ltr] [unicode-bidi:plaintext]"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className={cn(
                  "w-12 h-12 rounded-lg text-2xl font-bold",
                  "bg-white border",
                  localError ? "border-red-500" : "border-gray-300",
                  "data-[active=true]:border-[#3B82F6] data-[active=true]:ring-2 data-[active=true]:ring-blue-100"
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {localError && (
        <div className="text-center text-xs text-red-500">{localError}</div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          disabled={otp.length !== 5 || isLoading}
          onClick={() => verifyHandler()}
          type="button"
          className="w-full h-12 rounded-xl font-extrabold shadow-md shadow-blue-200"
        >
          {isLoading ? "در حال بررسی..." : "تایید و ورود"}
        </Button>

        <div className="text-center text-sm">
          {timer > 0 ? (
            <span className="text-gray-500">
              ارسال مجدد کد تا {formatTime(timer)} دیگر
            </span>
          ) : (
            <button
              onClick={resend}
              type="button"
              className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
              disabled={isLoading}
            >
              ارسال مجدد کد
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
