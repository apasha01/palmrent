/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  Download,
  Camera,
  X,
  Lock,
  ShieldCheck,
  RefreshCcw,
  Loader2,
  Home,
  Headset,
  Send,
} from "lucide-react";
import Lottie from "lottie-react";
import SuccessPayment from "@/public/lottie/PaymentSuccess.json";
import Image from "next/image";
import { toast } from "react-toastify";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import SummaryRow from "../search/extra/SummarySection";
import { getUserDocuments, uploadUserDocumentsFormData } from "@/services/user-document/UserDocument";
import { otpRequest } from "@/services/auth/auth.api";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function toFaNumber(n: number | string) {
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(num);
}

function formatMoneyFa(amount?: number | string, currency = "") {
  if (amount === null || typeof amount === "undefined") return "—";
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return String(amount);
  const txt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(num);
  return currency ? `${txt} ${currency}` : txt;
}

function formatMoneyOrFree(amount: any, currency = "") {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "رایگان";
  return currency ? `${toFaNumber(n)} ${currency}` : `${toFaNumber(n)}`;
}

function formatDateTimeFa(input?: string) {
  if (!input) return "—";
  const iso = input.replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return input.replace(" 00:00:00", "");
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function normalizeMobile(m: string) {
  const s = String(m ?? "").trim();
  if (s.startsWith("+98")) return "0" + s.slice(3);
  if (s.startsWith("0098")) return "0" + s.slice(4);
  return s;
}

type UploadKey = "id_card" | "dl_front" | "dl_back" | "intl_dl_front" | "intl_dl_back" | "visa";

type FilesState = Partial<Record<UploadKey, File | null>>;
type ErrorState = Partial<Record<UploadKey, boolean>>;

type UploadedDoc =
  | {
      id?: number;
      status?: string;
      file_path?: string | null;
      file_url?: string | null;
      rejection_reason?: string | null;
    }
  | null;

type ServerDocsState = Partial<Record<UploadKey, UploadedDoc>>;

const MAP: Record<UploadKey, readonly [string, string]> = {
  id_card: ["identity", "single"],
  dl_front: ["driver_license", "front"],
  dl_back: ["driver_license", "back"],
  intl_dl_front: ["international_driver_license", "front"],
  intl_dl_back: ["international_driver_license", "back"],
  visa: ["visa", "single"],
};

function logFormData(fd: FormData) {
  console.group("SUBMIT: FORMDATA");
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) {
      console.log(key, { name: value.name, type: value.type, size: value.size });
    } else {
      console.log(key, value);
    }
  }
  console.groupEnd();
}

/** ✅ دیالوگ قفل OTP - پس‌زمینه کاملاً سفید/محو + ارسال کد با دکمه */
function OtpLockDialog({
  open,
  mobile,

}: {
  open: boolean;
  mobile: string;
}) {
  const fixedMobile = useMemo(() => normalizeMobile(mobile), [mobile]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ مرحله‌ها: اول ارسال کد، بعد تایید
  const [step, setStep] = useState<"send" | "verify">("send");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) return;
    setOtp("");
    setLoading(false);
    setCooldown(0);
    setStep("send");
  }, [open, fixedMobile]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (!fixedMobile) return;
    setLoading(true);
    try {
      await otpRequest(fixedMobile);
      toast.success("کد تایید ارسال شد");
      setCooldown(60);
      setStep("verify");
      setOtp("");
    } catch (e: any) {
      toast.error(e?.message ?? "خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!fixedMobile) return;
    if (cooldown > 0) return;

    setLoading(true);
    try {
      await otpRequest(fixedMobile);
      toast.success("کد دوباره ارسال شد");
      setCooldown(60);
      setOtp("");
      setStep("verify");
    } catch (e: any) {
      toast.error(e?.message ?? "ارسال مجدد ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    if (!fixedMobile) return;
    if (code.length !== 5) return;

    setLoading(true);
    try {
      const res = await signIn("otp", {
        redirect: false,
        mobile: fixedMobile,
        code,
      });

      if (!res?.ok) {
        toast.error("کد وارد شده صحیح نیست");
        setOtp("");
        return;
      }

      toast.success("ورود انجام شد");

    } catch (e: any) {
      toast.error(e?.message ?? "خطا در تایید کد");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ لایه‌ی جدا برای محو/سفید کردن کامل پشت صفحه */}
      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[60]",
            "bg-white/95 dark:bg-black/80",
            "backdrop-blur-[14px]"
          )}
        />
      ) : null}

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className={cn(
            "z-[70] sm:max-w-md p-0 overflow-hidden border-none rounded-[28px]",
            "shadow-[0_60px_160px_-30px_rgba(0,0,0,0.55)]",
            "bg-white/95 dark:bg-gray-950/92 backdrop-blur-2xl"
          )}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">ورود اجباری</DialogTitle>

          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/12 to-transparent pointer-events-none" />
            <div className="p-7 sm:p-8 text-center space-y-5">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-gray-900/5 dark:bg-white/5 text-xs text-gray-700 dark:text-gray-200">
                <Lock className="h-4 w-4" />
                <span>این مرحله قفل است</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  برای ادامه باید وارد شوید
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-7">
                  شماره رزرو از قبل ثبت شده و قابل تغییر نیست.
                  <br />
                  کد تایید فقط برای همین شماره ارسال می‌شود.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  شماره همراه (غیرقابل تغییر)
                </div>
                <Input
                  dir="ltr"
                  value={fixedMobile}
                  readOnly
                  className={cn(
                    "h-12 text-center text-base font-black tracking-wide rounded-2xl",
                    "bg-gray-100/80 dark:bg-white/5",
                    "border border-gray-200/70 dark:border-white/10"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 pb-7 sm:px-8 sm:pb-8">
            <div className="rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-[0_18px_50px_-20px_rgba(37,99,235,0.9)]">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              </div>

              {/* مرحله ارسال */}
              {step === "send" ? (
                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-700 dark:text-gray-200 leading-7">
                    برای دریافت کد تایید، روی دکمه زیر بزنید.
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-2xl font-extrabold gap-2"
                    disabled={loading || !fixedMobile}
                    onClick={sendCode}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    ارسال کد تایید
                  </Button>

        
                </div>
              ) : null}

              {/* مرحله تایید */}
              {step === "verify" ? (
                <div className="space-y-4 ">
                  <div className="text-center text-sm text-gray-700 dark:text-gray-200 leading-7">
                    کد ۵ رقمی ارسال‌شده را وارد کنید
                  </div>

<div className="flex items-center justify-center ">

                  <InputOTP
                    dir="ltr"
                    maxLength={5}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (val.length === 5) verify(val);
                    }}
                    autoFocus
                  >
              <InputOTP dir="ltr" maxLength={5} value={otp} onChange={(val) => {
  setOtp(val);
  if (val.length === 5) verify(val);
}} autoFocus>
  <InputOTPGroup
    dir="ltr"
    className="flex flex-nowrap items-center justify-center gap-3"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <InputOTPSlot
        key={i}
        index={i}
        className={cn(
          "w-12 h-14 rounded-2xl text-xl font-extrabold",
          "shrink-0",                 // ✅ نذاره جمع بشه و بره خط بعد
          "bg-gray-100 dark:bg-white/5",
          "shadow-inner border",
          "focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/10"
        )}
      />
    ))}
  </InputOTPGroup>
</InputOTP>

                  </InputOTP>
</div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-2xl font-extrabold"
                    disabled={loading || otp.length !== 5}
                    onClick={() => verify(otp)}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تایید و ادامه"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11 rounded-xl font-bold gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                    disabled={loading || cooldown > 0}
                    onClick={resend}
                  >
                    <RefreshCcw className={cn("h-4 w-4", cooldown > 0 && "opacity-40")} />
                    {cooldown > 0 ? `ارسال مجدد (${cooldown})` : "ارسال دوباره کد"}
                  </Button>

                  <div className="text-[11px] text-center text-gray-500 dark:text-gray-400">
                    {cooldown > 0 ? `تا ارسال مجدد ${cooldown} ثانیه` : "اگر کد را نگرفتید، ارسال دوباره را بزنید"}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 h-px bg-gray-200/70 dark:bg-white/10" />
            <div className="mt-4 text-center text-[11px] text-gray-500 dark:text-gray-400 leading-6">
              تا زمانی که وارد نشوید، آپلود مدارک غیرفعال است.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** ✅ تایمر ۵ ثانیه‌ای برای دیالوگ تشکر */
function CountdownRing({ secondsLeft, total = 5 }: { secondsLeft: number; total?: number }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, secondsLeft / total));
  const dash = c * progress;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="text-gray-200 dark:text-gray-800" stroke="currentColor" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="text-green-600"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-black tabular-nums text-gray-900 dark:text-white">{toFaNumber(secondsLeft)}</div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">ثانیه</div>
      </div>
    </div>
  );
}

/** ✅ دیالوگ تشکر قفل + تایمر + هدایت خودکار */
function UploadThanksLockedDialog({
  open,
  secondsLeft,
  onGoHome,
}: {
  open: boolean;
  secondsLeft: number;
  onGoHome: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.35)] bg-background/95 backdrop-blur-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">ثبت مدارک</DialogTitle>

        <div className="p-7 sm:p-9 space-y-6 text-center">
          <CountdownRing secondsLeft={secondsLeft} total={10} />

          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">مدارک ثبت شد</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-7">
              ممنون 🙏 مدارک شما دریافت شد و در حال بررسی است.
              <br />
              تا چند لحظه دیگر به صفحه اصلی هدایت می‌شوید…
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/30 p-4 text-right">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Headset className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-200 leading-6">
                <div className="font-black mb-1">پشتیبانی</div>
                اگر عکس‌ها خوانا نبود یا مشکلی داشت (نور، برش، تاری و ...)، با پشتیبانی هماهنگ کنید تا سریع‌تر بررسی شود.
              </div>
            </div>
          </div>

          <Button type="button" onClick={onGoHome} className="w-full h-12 rounded-2xl font-extrabold gap-2">
            <Home className="h-5 w-5" />
            همین الان برو صفحه اصلی
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadTile({
  label,
  file,
  serverUrl,
  onPick,
  onRemove,
  hasError,
  gridOneSlot,
  disabled,
}: {
  label: string;
  file?: File | null;
  serverUrl?: string | null;
  onPick: () => void;
  onRemove?: () => void;
  hasError?: boolean;
  gridOneSlot?: boolean;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (serverUrl) {
      setPreview(serverUrl);
      return;
    }
    setPreview(null);
  }, [file, serverUrl]);

  const hasAnyPreview = Boolean(preview);

  return (
    <div className={gridOneSlot ? "col-span-1" : "w-full"}>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            onPick();
          }}
          className={[
            "w-full rounded-2xl border relative overflow-hidden",
            hasError ? "border-red-500" : "border-gray-200 dark:border-gray-800",
            "bg-gray-100/70 dark:bg-gray-800/60",
            disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition",
            "h-[108px] sm:h-[120px]",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
          ].join(" ")}
        >
          {preview ? (
            <Image src={preview} alt={label} fill className="object-cover" sizes="(max-width: 640px) 50vw, 240px" />
          ) : null}

          <div className={["absolute inset-0", hasAnyPreview ? "bg-black/10" : "bg-transparent"].join(" ")} />

          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl">
              <Camera className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </button>

        {hasAnyPreview && onRemove && !disabled ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
            aria-label="remove"
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 text-center text-xs text-gray-700 dark:text-gray-200">{label}</div>
      {hasError ? <div className="mt-1 text-center text-[11px] text-red-600">این مورد الزامی است</div> : null}
    </div>
  );
}

export function PaymentSuccessCard({ rentData, trace, onDownloadVoucher, onSubmitUpload }: any) {
  const router = useRouter();

  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const authRequired = rentData?.auth?.auth_required === true;

  const readonlyPhoneRaw =
    String(rentData?.auth?.phone ?? rentData?.rent_info?.phone ?? rentData?.summary?.phone ?? rentData?.phone ?? "") || "";
  const readonlyPhone = useMemo(() => normalizeMobile(readonlyPhoneRaw), [readonlyPhoneRaw]);

  const mustLock = authRequired && !isAuthed;

  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};
  const summary = rentData?.summary || {};
  const details = rentData?.details || {};

  const currency = details?.currency || summary?.currency || "";

  const carTitle = useMemo(() => [car?.brand, car?.model, car?.year].filter(Boolean).join(" "), [
    car?.brand,
    car?.model,
    car?.year,
  ]);

  const fromText = formatDateTimeFa(info?.from_date);
  const toText = formatDateTimeFa(info?.to_date);
  const days = Number(info?.day_rent ?? summary?.days ?? 0) || 0;

  const remainAtDelivery =
    details?.totals?.remain_to_pay ??
    payment?.remain_to_pay ??
    payment?.remaining ??
    payment?.remain ??
    rentData?.remain_to_pay;

  const prePay = details?.totals?.pre_pay ?? payment?.pre_pay ?? payment?.prepay ?? rentData?.pre_pay;
  const sumAll = details?.totals?.sum_all ?? summary?.total ?? details?.sum_all ?? rentData?.sum_all;

  const [openInfo, setOpenInfo] = useState(true);

  // ===== uploads
  const [files, setFiles] = useState<FilesState>({});
  const [serverDocs, setServerDocs] = useState<ServerDocsState>({});
  const [noIntl, setNoIntl] = useState<boolean>(false);
  const [noVisa, setNoVisa] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErrorState>({});

  const [openThanks, setOpenThanks] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const onFile = (k: UploadKey, f: File | null) => {
    if (mustLock) {
      toast.info("برای ادامه باید وارد شوید");
      return;
    }
    setFiles((p) => ({ ...p, [k]: f }));
    setFieldErrors((p) => ({ ...p, [k]: false }));
  };

  const removeFile = (k: UploadKey) => {
    if (mustLock) return;
    setFiles((p) => ({ ...p, [k]: null }));
    setServerDocs((p) => ({ ...p, [k]: null }));
  };

  useEffect(() => {
    if (!openThanks) return;

    setSecondsLeft(5);
    let mounted = true;

    const interval = setInterval(() => {
      if (!mounted) return;
      setSecondsLeft((s) => s - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      if (!mounted) return;
      router.push("/");
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [openThanks, router]);

  // load existing docs فقط اگر قفل نیست
  useEffect(() => {
    if (mustLock) return;

    let mounted = true;
    (async () => {
      try {
        const data = await getUserDocuments();
        if (!mounted) return;

        const next: ServerDocsState = {};
        (Object.keys(MAP) as UploadKey[]).forEach((k) => {
          const [type, side] = MAP[k];
          next[k] = data?.[type]?.[side] ?? null;
        });

        setServerDocs(next);

        const hasIntl = Boolean(next.intl_dl_front?.file_url) || Boolean(next.intl_dl_back?.file_url);
        if (!hasIntl) setNoIntl(false);

        const hasVisa = Boolean(next.visa?.file_url);
        if (!hasVisa) setNoVisa(false);
      } catch (e) {
        console.error("load documents failed", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mustLock]);

  const hasServer = (k: UploadKey) => Boolean(serverDocs[k]?.file_url);

  const validate = () => {
    if (mustLock) {
      toast.info("برای آپلود مدارک باید وارد شوید");
      return false;
    }

    const next: ErrorState = {};

    if (!files.id_card && !hasServer("id_card")) next.id_card = true;
    if (!files.dl_front && !hasServer("dl_front")) next.dl_front = true;
    if (!files.dl_back && !hasServer("dl_back")) next.dl_back = true;

    if (!noIntl) {
      if (!files.intl_dl_front && !hasServer("intl_dl_front")) next.intl_dl_front = true;
      if (!files.intl_dl_back && !hasServer("intl_dl_back")) next.intl_dl_back = true;
    }

    if (!noVisa) {
      if (!files.visa && !hasServer("visa")) next.visa = true;
    }

    setFieldErrors(next);

    const hasAny = Object.values(next).some(Boolean);
    if (hasAny) {
      toast.warning("لطفاً مدارک الزامی را تکمیل کنید");
      return false;
    }
    return true;
  };

  const submit = async () => {
    try {
      if (mustLock) {
        toast.info("برای آپلود مدارک باید وارد شوید");
        return;
      }

      setErr(null);
      if (!validate()) return;

      setLoading(true);

      const fd = new FormData();

      if (files.id_card) fd.append("identity_file", files.id_card);
      if (files.dl_front) fd.append("driver_license_front", files.dl_front);
      if (files.dl_back) fd.append("driver_license_back", files.dl_back);

      if (!noIntl) {
        if (files.intl_dl_front) fd.append("intl_driver_license_front", files.intl_dl_front);
        if (files.intl_dl_back) fd.append("intl_driver_license_back", files.intl_dl_back);
      }

      if (!noVisa) {
        if (files.visa) fd.append("visa_file", files.visa);
      }

      const hasAnyNewFile = [...fd.keys()].length > 0;
      if (!hasAnyNewFile) {
        setOpenThanks(true);
        return;
      }

      const rentCode = rentData?.rent_code ?? "";
      const traceCode = trace ?? rentData?.tracing_code ?? "";
      if (rentCode) fd.append("rent_code", String(rentCode));
      if (traceCode) fd.append("trace_code", String(traceCode));

      logFormData(fd);

      if (typeof onSubmitUpload === "function") {
        await onSubmitUpload(fd);
      } else {
        await uploadUserDocumentsFormData(fd);
      }

      try {
        const data = await getUserDocuments();
        const next: ServerDocsState = {};
        (Object.keys(MAP) as UploadKey[]).forEach((k) => {
          const [type, side] = MAP[k];
          next[k] = data?.[type]?.[side] ?? null;
        });
        setServerDocs(next);
        setFiles({});
      } catch {
        setFiles({});
      }

      toast.success("آپلود انجام شد");
      setOpenThanks(true);
    } catch (e: any) {
      setErr(e?.message || "خطا در آپلود مدارک");
      toast.warn(e?.message || "آپلود انجام نشد");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVoucher = async () => {
    const rentId = rentData?.rent_id ?? rentData?.rentId ?? rentData?.id;
    if (!rentId) {
      toast.error("rent_id پیدا نشد");
      return;
    }

    if (typeof onDownloadVoucher === "function") {
      onDownloadVoucher();
      return;
    }

    try {
      setDownloadingVoucher(true);
      toast.info("در حال آماده‌سازی وچر...");

      const res = await fetch(`/api/voucher-pdf?rent_id=${rentId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `PDF API failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `voucher-${rentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success("وچر دانلود شد");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "دانلود وچر ناموفق بود");
    } finally {
      setDownloadingVoucher(false);
    }
  };

  const invoiceRows = useMemo(() => {
    const rows: { label: string; value: string; subLabel?: React.ReactNode; valueHint?: React.ReactNode }[] = [];

    const base = details?.base_rent || {};
    const baseAfter = Number(base?.rent_total_after_discount ?? base?.price ?? 0) || 0;
    const baseBefore = Number(base?.rent_total_before_discount ?? 0) || 0;
    const offPercent = Number(base?.off_percent ?? 0) || 0;

    const dailyAfter = Number(base?.rent_price_day_after_discount ?? 0) || (days > 0 ? baseAfter / days : 0);
    const dailyBefore =
      Number(base?.rent_price_day_before_discount ?? 0) || (days > 0 ? baseBefore / days : dailyAfter);

    rows.push({
      label: `قیمت اجاره ${toFaNumber(days || summary?.days || 0)} روز`,
      value: formatMoneyOrFree(baseAfter, currency),
      subLabel:
        offPercent > 0 ? (
          <span className="inline-flex items-center gap-1 flex-wrap justify-end">
            <span className="line-through text-gray-400">{toFaNumber(Math.round(dailyBefore))}</span>
            <span>
              {toFaNumber(Math.round(dailyAfter))} {currency}
            </span>
            <span className="text-gray-500">روزانه</span>
            <span>(</span>
            <span>{toFaNumber(offPercent)}% تخفیف</span>
            <span>)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 flex-wrap justify-end">
            <span>
              {toFaNumber(Math.round(dailyAfter))} {currency}
            </span>
            <span className="text-gray-500">روزانه</span>
          </span>
        ),
    });

    const services = Array.isArray(details?.services) ? details.services : [];
    for (const s of services) {
      const priceNum = Number(s?.price ?? 0) || 0;
      if (priceNum <= 0) continue;
      rows.push({ label: s?.title || "—", value: formatMoneyOrFree(priceNum, currency) });
    }

    const optItems = Array.isArray(details?.options?.items) ? details.options.items : [];
    const safeDays = Math.max(1, Number(days || summary?.days || 1) || 1);

    for (const o of optItems) {
      const num = Math.max(1, Number(o?.num ?? 1) || 1);
      const title = String(o?.title ?? "آپشن");
      const sumPrice = Number(o?.sum_price ?? 0) || 0;
      if (sumPrice <= 0) continue;

      rows.push({
        label: `${title} × ${toFaNumber(num)}`,
        value: formatMoneyOrFree(sumPrice, currency),
      });
    }

    const optSum = Number(details?.options?.sum ?? 0) || 0;
    if (optSum > 0) rows.push({ label: "جمع آپشن‌ها", value: formatMoneyOrFree(optSum, currency) });

    const taxPercent = Number(details?.tax?.percent ?? 0) || 0;
    const taxPrice = Number(details?.tax?.price ?? 0) || 0;
    if (taxPrice > 0) rows.push({ label: `مالیات (${toFaNumber(taxPercent)}٪)`, value: formatMoneyOrFree(taxPrice, currency) });

    if (typeof prePay !== "undefined" && prePay !== null) {
      rows.push({ label: "پیش پرداخت", value: `${formatMoneyFa(prePay, currency)} (پرداخت شده)` });
    }

    if (typeof remainAtDelivery !== "undefined" && remainAtDelivery !== null) {
      rows.push({ label: "مانده حساب", value: formatMoneyFa(remainAtDelivery, currency) });
    }

    if (typeof sumAll !== "undefined" && sumAll !== null) {
      rows.push({
        label: `هزینه نهایی برای ${toFaNumber(days || summary?.days || 0)} روز`,
        value: formatMoneyFa(sumAll, currency),
      });
    }

    return rows;
  }, [details, currency, days, summary?.days, remainAtDelivery, prePay, sumAll]);

  return (
    <div className="w-full bg-white dark:bg-gray-900">
      {/* ✅ دیالوگ قفل OTP */}
      {mustLock ? (
        <OtpLockDialog
          open={true}
          mobile={readonlyPhone}

        />
      ) : null}

      {/* ✅ دیالوگ تشکر قفل + تایمر */}
      <UploadThanksLockedDialog
        open={openThanks}
        secondsLeft={Math.max(0, secondsLeft)}
        onGoHome={() => router.push("/")}
      />

      <div className="mx-auto w-full px-4 max-w-5xl pb-24">
        <div className="flex flex-col items-center text-center">
          <Lottie animationData={SuccessPayment} style={{ height: "148px" }} loop={false} />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">پرداخت با موفقیت انجام شد</h1>
          <p className="text-xs leading-7 text-gray-600 dark:text-gray-300 max-w-[430px]">
            رزرو شما قطعی شد. وچر و مدارک از همین صفحه قابل مدیریت است.
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="font-black text-gray-900 dark:text-white">اطلاعات رزرو</div>

          <button
            type="button"
            onClick={handleDownloadVoucher}
            disabled={downloadingVoucher}
            className={[
              "inline-flex items-center gap-2 text-blue-600 font-black",
              downloadingVoucher ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <Download className="h-4 w-4" />
            {downloadingVoucher ? "در حال دانلود..." : "دانلود وچر"}
          </button>
        </div>

        <Card className="mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-none">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setOpenInfo((p) => !p)}
              className="w-full flex items-center justify-between p-3"
              aria-label="toggle info"
            >
              <div className="text-right">
                <div className="font-black text-gray-900 dark:text-white">
                  {carTitle || summary?.car_name || "—"}{" "}
                  {days ? <span className="text-gray-500 font-bold">({toFaNumber(days)} روز)</span> : null}
                </div>

                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  از {fromText} تا {toText}
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  مانده هنگام تحویل :
                  <span className="font-black text-gray-900 dark:text-white mr-2">
                    {typeof remainAtDelivery !== "undefined" ? formatMoneyFa(remainAtDelivery, currency) : "—"}
                  </span>
                </div>
              </div>

              <ChevronDown
                className={["h-5 w-5 text-gray-500 transition-transform", openInfo ? "rotate-180" : "rotate-0"].join(" ")}
              />
            </button>

            {openInfo ? (
              <div className="px-4 pb-4">
                <div className="mt-2 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/40 text-xs font-black text-gray-700 dark:text-gray-200">
                    ریز فاکتور رزرو
                  </div>

                  <div className="px-3 divide-y divide-gray-100 dark:divide-gray-800">
                    {invoiceRows.map((row, idx) => (
                      <SummaryRow key={idx} label={row.label} value={row.value} subLabel={row.subLabel} valueHint={row.valueHint} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-6 text-xs md:text-sm text-gray-900 dark:text-white">
          برای صرفه‌جویی در زمان تحویل، عکس‌های مدارک خود را آپلود کنید
        </div>

        {/* ===== Passport/ID ===== */}
        <div className="mt-5">
          <div className="text-lg font-black text-gray-900 dark:text-white">گذرنامه/کارت شناسایی</div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <UploadTile
              label="عکس"
              file={files.id_card}
              serverUrl={serverDocs.id_card?.file_url ?? null}
              onPick={() => inputs.current["id_card"]?.click()}
              onRemove={() => removeFile("id_card")}
              hasError={fieldErrors.id_card}
              gridOneSlot
              disabled={mustLock}
            />
            <div className="hidden" />
          </div>

          <Input
            ref={(el) => {
              inputs.current["id_card"] = el as unknown as HTMLInputElement;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={mustLock}
            onChange={(e) => onFile("id_card", (e.target as HTMLInputElement).files?.[0] ?? null)}
          />
        </div>

        {/* ===== Driving license ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white">گواهینامه رانندگی</div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <UploadTile
                label="سمت عقب"
                file={files.dl_back}
                serverUrl={serverDocs.dl_back?.file_url ?? null}
                onPick={() => inputs.current["dl_back"]?.click()}
                onRemove={() => removeFile("dl_back")}
                hasError={fieldErrors.dl_back}
                disabled={mustLock}
              />
              <Input
                ref={(el) => {
                  inputs.current["dl_back"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={mustLock}
                onChange={(e) => onFile("dl_back", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </div>

            <div>
              <UploadTile
                label="جبهه"
                file={files.dl_front}
                serverUrl={serverDocs.dl_front?.file_url ?? null}
                onPick={() => inputs.current["dl_front"]?.click()}
                onRemove={() => removeFile("dl_front")}
                hasError={fieldErrors.dl_front}
                disabled={mustLock}
              />
              <Input
                ref={(el) => {
                  inputs.current["dl_front"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={mustLock}
                onChange={(e) => onFile("dl_front", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>

        {/* ===== International DL ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white border-b">گواهینامه رانندگی بین المللی</div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">گواهینامه رانندگی بین المللی ندارم</div>

            <Checkbox
              checked={noIntl}
              disabled={mustLock}
              onCheckedChange={(checked) => {
                if (mustLock) return;
                const v = checked === true;
                setNoIntl(v);
                if (v) setFieldErrors((p) => ({ ...p, intl_dl_front: false, intl_dl_back: false }));
              }}
              className="h-5 w-5"
            />
          </div>

          {!noIntl ? (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <UploadTile
                  label="سمت عقب"
                  file={files.intl_dl_back}
                  serverUrl={serverDocs.intl_dl_back?.file_url ?? null}
                  onPick={() => inputs.current["intl_dl_back"]?.click()}
                  onRemove={() => removeFile("intl_dl_back")}
                  hasError={fieldErrors.intl_dl_back}
                  disabled={mustLock}
                />
                <Input
                  ref={(el) => {
                    inputs.current["intl_dl_back"] = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={mustLock}
                  onChange={(e) => onFile("intl_dl_back", (e.target as HTMLInputElement).files?.[0] ?? null)}
                />
              </div>

              <div>
                <UploadTile
                  label="جبهه"
                  file={files.intl_dl_front}
                  serverUrl={serverDocs.intl_dl_front?.file_url ?? null}
                  onPick={() => inputs.current["intl_dl_front"]?.click()}
                  onRemove={() => removeFile("intl_dl_front")}
                  hasError={fieldErrors.intl_dl_front}
                  disabled={mustLock}
                />
                <Input
                  ref={(el) => {
                    inputs.current["intl_dl_front"] = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={mustLock}
                  onChange={(e) => onFile("intl_dl_front", (e.target as HTMLInputElement).files?.[0] ?? null)}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* ===== Visa ===== */}
        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white border-b">ویزا</div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">من ویزا ندارم</div>

            <Checkbox
              checked={noVisa}
              disabled={mustLock}
              onCheckedChange={(checked) => {
                if (mustLock) return;
                const v = checked === true;
                setNoVisa(v);
                if (v) setFieldErrors((p) => ({ ...p, visa: false }));
              }}
              className="h-5 w-5"
            />
          </div>

          {!noVisa ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <UploadTile
                  label="عکس"
                  file={files.visa}
                  serverUrl={serverDocs.visa?.file_url ?? null}
                  onPick={() => inputs.current["visa"]?.click()}
                  onRemove={() => removeFile("visa")}
                  hasError={fieldErrors.visa}
                  gridOneSlot
                  disabled={mustLock}
                />
                <div className="hidden" />
              </div>

              <Input
                ref={(el) => {
                  inputs.current["visa"] = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={mustLock}
                onChange={(e) => onFile("visa", (e.target as HTMLInputElement).files?.[0] ?? null)}
              />
            </>
          ) : null}

          {err ? <div className="mt-4 text-xs text-red-600">{err}</div> : null}
        </div>
      </div>

      <div className="fixed z-20 bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto w-full max-w-[560px] px-4 py-3">
          <Button
            onClick={submit}
            disabled={loading || mustLock || openThanks}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black disabled:opacity-50"
          >
            {mustLock ? "ابتدا وارد شوید" : loading ? "در حال ارسال..." : "ارسال مدارک"}
          </Button>
        </div>
      </div>
    </div>
  );
}
