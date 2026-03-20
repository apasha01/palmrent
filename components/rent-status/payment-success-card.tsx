/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  Download,
  Camera,
  X,
  RefreshCcw,
  Loader2,
  Home,
  Headset,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Lottie from "lottie-react";
import SuccessPayment from "@/public/lottie/PaymentSuccess.json";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

import SummaryRow from "../search/extra/SummarySection";
import PhoneInputCustom from "../reserve/PhoneInputCustom";
import {
  getUserDocuments,
  uploadUserDocumentsFormData,
} from "@/services/user-document/UserDocument";
import { otpRequest } from "@/services/auth/auth.api";
import useDIR from "@/hooks/use-rtl";

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

function mapLocaleForIntl(locale: string) {
  if (locale === "fa") return "fa-IR";
  if (locale === "ar") return "ar";
  if (locale === "tr") return "tr-TR";
  return "en-US";
}

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

function formatNumber(value: number | string, locale: string, maximumFractionDigits = 2) {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);

  return new Intl.NumberFormat(mapLocaleForIntl(locale), {
    maximumFractionDigits,
  }).format(num);
}

function formatMoney(amount: number | string | undefined, locale: string, currency = "") {
  if (amount === null || typeof amount === "undefined") return "—";
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return String(amount);

  const txt = new Intl.NumberFormat(mapLocaleForIntl(locale), {
    maximumFractionDigits: 2,
  }).format(num);

  return currency ? `${txt} ${currency}` : txt;
}

function formatMoneyOrFree(
  amount: any,
  locale: string,
  t: (key: string) => string,
  currency = "",
) {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return t("common.free");
  return currency ? `${formatNumber(n, locale, 2)} ${currency}` : `${formatNumber(n, locale, 2)}`;
}

function formatDateTime(input: string | undefined, locale: string) {
  if (!input) return "—";
  const iso = input.replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return input.replace(" 00:00:00", "");

  return new Intl.DateTimeFormat(mapLocaleForIntl(locale), {
    year: "numeric",
    month: locale === "fa" ? "long" : "2-digit",
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

type UploadKey =
  | "id_card"
  | "dl_front"
  | "dl_back"
  | "intl_dl_front"
  | "intl_dl_back"
  | "visa";

type FilesState = Partial<Record<UploadKey, File | null>>;
type ErrorState = Partial<Record<UploadKey, boolean>>;
type UploadedDoc = {
  id?: number;
  status?: string;
  file_path?: string | null;
  file_url?: string | null;
  rejection_reason?: string | null;
} | null;

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

function OtpLockScreen({
  mobile,
  sessionLoading,
}: {
  mobile: string;
  sessionLoading?: boolean;
}) {
  const t = useTranslations("PaymentSuccessCard.otp");
  const fixedMobile = useMemo(() => normalizeMobile(mobile), [mobile]);
  const { isRtl } = useDIR();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const displayMobile = useMemo(() => {
    const m = fixedMobile;
    if (m.startsWith("09")) return m;
    if (m.startsWith("9")) return "0" + m;
    return m;
  }, [fixedMobile]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [cooldown, setCooldown] = useState(0);
  const [otpError, setOtpError] = useState(false);
  const [otpShake, setOtpShake] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);

  useEffect(() => {
    setOtp("");
    setLoading(false);
    setCooldown(0);
    setStep("send");
    setOtpError(false);
    setSmsError(null);
  }, [fixedMobile]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerShake = () => {
    setOtpError(true);
    setOtpShake(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
      }),
    );
  };

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sendCode = async () => {
    if (!fixedMobile) return;
    setLoading(true);
    setSmsError(null);

    try {
      await otpRequest(fixedMobile);
      setCooldown(75);
      setStep("verify");
      setOtp("");
    } catch (e: any) {
      setSmsError(e?.message ?? t("sendCodeError"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!fixedMobile || cooldown > 0) return;
    setLoading(true);
    setSmsError(null);

    try {
      await otpRequest(fixedMobile);
      setCooldown(75);
      setOtp("");
      setStep("verify");
      setOtpError(false);
    } catch (e: any) {
      setSmsError(e?.message ?? t("resendError"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code: string) => {
    if (!fixedMobile || code.length !== 5) return;

    setLoading(true);
    try {
      const res = await signIn("otp", {
        redirect: false,
        mobile: fixedMobile,
        code,
      });

      if (!res?.ok) {
        setOtp("");
        triggerShake();
        return;
      }
    } catch (e: any) {
      toast.error(e?.message ?? t("verifyErrorToast"));
      setOtp("");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <InjectShakeStyle />

      <div className="fixed inset-0 z-[9999] overflow-hidden bg-white sm:flex sm:items-center sm:justify-center sm:bg-black/40">
        <div
          className={cn(
            "flex h-dvh flex-col overflow-hidden bg-white",
            "sm:h-auto sm:w-full sm:max-w-lg sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl",
          )}
        >
          <div className="flex items-center px-5 pt-5">
            {step === "verify" && (
              <button
                type="button"
                onClick={() => {
                  setStep("send");
                  setOtp("");
                  setOtpError(false);
                  setSmsError(null);
                }}
                aria-label={t("back")}
                className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-800"
              >
                <BackIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-10">
            <div className="mb-4 flex justify-center">
              <Image
                src="/images/logo.png"
                width={100}
                height={100}
                alt="LOGO"
                className="filter-[invert(1)] dark:filter-none"
              />
            </div>

            {step === "send" && (
              <div >
                <h2 className="mb-6 text-center text-[20px] font-bold text-gray-900">
                  {t("title")}
                </h2>

                <div className="mb-4 rounded-xl border border-[#bae6fd] bg-[#eff8ff] px-2 py-3 text-center text-sm leading-6 text-[#0369a1]">
                  {t("banner1")}
                  <br />
                  {t("banner2")}
                </div>

                <p className="mb-2 text-right text-sm text-gray-700">
                  {t("registeredMobile")}
                </p>

                <div dir="ltr" className="mb-2">
                  <PhoneInputCustom
                    value={fixedMobile}
                    onChange={() => {}}
                    error={false}
                    placeholder=""
                    defaultCountry="ir"
                    lockedCountry={true}
                    disabled
                    className={cn(
                      "h-14 w-full rounded-xl border border-gray-300 bg-white",
                      "text-gray-900",
                      "opacity-100 cursor-default",
                    )}
                  />
                </div>

                {smsError && (
                  <p className="mb-2 px-1 text-xs text-red-500" >
                    {smsError}
                  </p>
                )}

                {sessionLoading && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    {t("checkingLogin")}
                  </p>
                )}

                <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                  {t("sendCodeHint")}
                </p>
              </div>
            )}

            {step === "verify" && (
              <div >
                <h2 className="mb-8 text-center text-[16px] font-bold text-gray-900">
                  {t("enterCode")}
                </h2>

                <div className="mb-4 flex items-center justify-between gap-0.5">
                  <p className="text-xs text-gray-600" >
                    {t("codeSentPrefix")}{" "}
                    <span className="tabular-nums font-medium text-gray-800">
                      {displayMobile}
                    </span>{" "}
                    {t("codeSentSuffix")}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("send");
                      setOtp("");
                      setOtpError(false);
                      setSmsError(null);
                    }}
                    className="text-sm font-medium text-[#3AA4F5] hover:underline"
                  >
                    {t("edit")}
                  </button>
                </div>

                <div className={cn("mb-6 flex justify-center", otpShake && "otp-shake")}>
                  <InputOTP
                    maxLength={5}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (otpError) setOtpError(false);
                      if (val.length === 5) verify(val);
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
                              "data-[active=true]:border-[#3AA4F5] data-[active=true]:shadow-sm",
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpError && (
                  <p className="mb-2 text-center text-xs text-red-500">
                    {t("wrongCode")}
                  </p>
                )}

                <div className="mb-2 flex justify-center">
                  {cooldown > 0 ? (
                    <span className="tabular-nums text-sm text-gray-400" >
                      {formatCooldown(cooldown)} {t("resendCooldown")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={resend}
                      className="flex items-center gap-1.5 text-sm text-[#3AA4F5] hover:underline disabled:opacity-50"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      {t("resendCode")}
                    </button>
                  )}
                </div>

                {smsError && (
                  <p className="mt-1 text-center text-xs text-red-500" >
                    {smsError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-5 pb-8 pt-4 sm:px-10">
            {step === "send" ? (
              <button
                type="button"
                disabled={loading || sessionLoading || !fixedMobile}
                onClick={sendCode}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                  "text-[16px] font-bold text-white transition-all duration-150 shadow-sm",
                  loading || sessionLoading || !fixedMobile
                    ? "cursor-not-allowed bg-[#3AA4F5]/40"
                    : "bg-[#3AA4F5] hover:bg-[#2993e8] active:scale-[0.98]",
                )}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("confirmAndSend")}
              </button>
            ) : (
              <button
                type="button"
                disabled={otp.length !== 5 || loading}
                onClick={() => verify(otp)}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                  "bg-[#3AA4F5] text-[16px] font-bold text-white",
                  "hover:bg-[#2993e8] active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
                  "transition-all duration-150 shadow-sm",
                )}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {t("confirmAndContinue")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CountdownRing({
  secondsLeft,
  total = 5,
}: {
  secondsLeft: number;
  total?: number;
}) {
  const locale = useLocale();
  const t = useTranslations("PaymentSuccessCard.thanksDialog");

  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, secondsLeft / total));
  const dash = c * progress;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-800"
          stroke="currentColor"
          fill="none"
        />
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
        <div className="text-3xl font-black tabular-nums text-gray-900 dark:text-white">
          {formatNumber(secondsLeft, locale, 0)}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {t("seconds")}
        </div>
      </div>
    </div>
  );
}

function UploadThanksLockedDialog({
  open,
  secondsLeft,
  onGoHome,
}: {
  open: boolean;
  secondsLeft: number;
  onGoHome: () => void;
}) {
  const t = useTranslations("PaymentSuccessCard.thanksDialog");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border-none bg-background/95 p-0 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="space-y-6 p-7 text-center sm:p-9">
          <CountdownRing secondsLeft={secondsLeft} total={5} />

          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {t("title")}
            </h3>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {t("description")}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-right dark:border-gray-800 dark:bg-gray-800/30">
            <div className="flex  gap-2">
              <Headset className="mt-0.5 h-5 w-5 text-gray-600 dark:text-gray-300" />
              <div className="text-xs leading-6 text-gray-700 dark:text-gray-200">
                <div className="mb-1 font-black">{t("supportTitle")}</div>
                {t("supportText")}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={onGoHome}
            className="h-12 w-full gap-2 rounded-2xl font-extrabold"
          >
            <Home className="h-5 w-5" />
            {t("goHomeNow")}
          </Button>
        </div>
      </div>
    </div>
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
  const t = useTranslations("PaymentSuccessCard.upload");

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
          className={cn(
            "relative flex h-[108px] w-full items-center justify-center overflow-hidden rounded-2xl border transition sm:h-[120px]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
            hasError ? "border-red-500" : "border-gray-200 dark:border-gray-800",
            "bg-gray-100/70 dark:bg-gray-800/60",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-gray-100 dark:hover:bg-gray-800",
          )}
        >
          {preview && (
            <Image
              src={preview}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 240px"
            />
          )}

          <div className={cn("absolute inset-0", hasAnyPreview ? "bg-black/10" : "bg-transparent")} />

          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl">
              <Camera className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </button>

        {hasAnyPreview && onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
            aria-label={t("remove")}
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      <div className="mt-2 text-center text-xs text-gray-700 dark:text-gray-200">
        {label}
      </div>

      {hasError && (
        <div className="mt-1 text-center text-[11px] text-red-600">
          {t("required")}
        </div>
      )}
    </div>
  );
}

export function PaymentSuccessCard({
  rentData,
  trace,
  onDownloadVoucher,
  onSubmitUpload,
}: any) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("PaymentSuccessCard");
  const { status } = useSession();

  const sessionLoading = status === "loading";
  const isAuthed = status === "authenticated";

  const authRequired = rentData?.auth?.auth_required === true;
  const readonlyPhoneRaw =
    String(
      rentData?.auth?.phone ??
        rentData?.rent_info?.phone ??
        rentData?.summary?.phone ??
        rentData?.phone ??
        "",
    ) || "";

  const readonlyPhone = useMemo(
    () => normalizeMobile(readonlyPhoneRaw),
    [readonlyPhoneRaw],
  );

  const shouldHardLock = authRequired && (sessionLoading || !isAuthed);

  const payment = rentData?.payment || {};
  const car = rentData?.car || {};
  const info = rentData?.rent_info || {};
  const summary = rentData?.summary || {};
  const details = rentData?.details || {};
  const currency = details?.currency || summary?.currency || "";

  const carTitle = useMemo(
    () => [car?.brand, car?.model, car?.year].filter(Boolean).join(" "),
    [car?.brand, car?.model, car?.year],
  );

  const fromText = formatDateTime(info?.from_date, locale);
  const toText = formatDateTime(info?.to_date, locale);
  const days = Number(info?.day_rent ?? summary?.days ?? 0) || 0;

  const remainAtDelivery =
    details?.totals?.remain_to_pay ??
    payment?.remain_to_pay ??
    payment?.remaining ??
    payment?.remain ??
    rentData?.remain_to_pay;

  const prePay =
    details?.totals?.pre_pay ??
    payment?.pre_pay ??
    payment?.prepay ??
    rentData?.pre_pay;

  const sumAll =
    details?.totals?.sum_all ??
    summary?.total ??
    details?.sum_all ??
    rentData?.sum_all;

  const [openInfo, setOpenInfo] = useState(true);
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
    if (shouldHardLock) {
      toast.info(t("toasts.loginRequired"));
      return;
    }

    setFiles((p) => ({ ...p, [k]: f }));
    setFieldErrors((p) => ({ ...p, [k]: false }));
  };

  const removeFile = (k: UploadKey) => {
    if (shouldHardLock) return;
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

  useEffect(() => {
    if (shouldHardLock) return;

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

        if (!Boolean(next.intl_dl_front?.file_url) && !Boolean(next.intl_dl_back?.file_url)) {
          setNoIntl(false);
        }

        if (!Boolean(next.visa?.file_url)) {
          setNoVisa(false);
        }
      } catch (e) {
        console.error("load documents failed", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [shouldHardLock]);

  const hasServer = (k: UploadKey) => Boolean(serverDocs[k]?.file_url);

  const validate = () => {
    if (shouldHardLock) {
      toast.info(t("toasts.loginRequiredForUpload"));
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

    if (!noVisa && !files.visa && !hasServer("visa")) {
      next.visa = true;
    }

    setFieldErrors(next);

    if (Object.values(next).some(Boolean)) {
      toast.warning(t("toasts.completeRequiredDocuments"));
      return false;
    }

    return true;
  };

  const submit = async () => {
    try {
      if (shouldHardLock) {
        toast.info(t("toasts.loginRequiredForUpload"));
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

      if (!noVisa && files.visa) {
        fd.append("visa_file", files.visa);
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

      toast.success(t("toasts.uploadDone"));
      setOpenThanks(true);
    } catch (e: any) {
      setErr(e?.message || t("errors.uploadFailed"));
      toast.warn(e?.message || t("errors.uploadNotDone"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVoucher = async () => {
    const rentId = rentData?.rent_id ?? rentData?.rentId ?? rentData?.id;

    if (!rentId) {
      toast.error(t("errors.rentIdNotFound"));
      return;
    }

    if (typeof onDownloadVoucher === "function") {
      onDownloadVoucher();
      return;
    }

    try {
      setDownloadingVoucher(true);
      toast.info(t("toasts.preparingVoucher"));

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

      toast.success(t("toasts.voucherDownloaded"));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("errors.voucherDownloadFailed"));
    } finally {
      setDownloadingVoucher(false);
    }
  };

  const invoiceRows = useMemo(() => {
    const rows: {
      label: string;
      value: string;
      subLabel?: React.ReactNode;
      valueHint?: React.ReactNode;
    }[] = [];

    const base = details?.base_rent || {};
    const baseAfter = Number(base?.rent_total_after_discount ?? base?.price ?? 0) || 0;
    const baseBefore = Number(base?.rent_total_before_discount ?? 0) || 0;
    const offPercent = Number(base?.off_percent ?? 0) || 0;

    const dailyAfter =
      Number(base?.rent_price_day_after_discount ?? 0) ||
      (days > 0 ? baseAfter / days : 0);

    const dailyBefore =
      Number(base?.rent_price_day_before_discount ?? 0) ||
      (days > 0 ? baseBefore / days : dailyAfter);

    rows.push({
      label: t("invoice.rentPriceForDays", {
        days: formatNumber(days || summary?.days || 0, locale, 0),
      }),
      value: formatMoneyOrFree(baseAfter, locale, t, currency),
      subLabel:
        offPercent > 0 ? (
          <span className="inline-flex flex-wrap items-center justify-end gap-1">
            <span className="line-through text-gray-400">
              {formatNumber(Math.round(dailyBefore), locale, 0)}
            </span>
            <span>
              {formatNumber(Math.round(dailyAfter), locale, 0)} {currency}
            </span>
            <span className="text-gray-500">{t("invoice.daily")}</span>
            <span>
              ({formatNumber(offPercent, locale, 0)}% {t("invoice.discount")})
            </span>
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center justify-end gap-1">
            <span>
              {formatNumber(Math.round(dailyAfter), locale, 0)} {currency}
            </span>
            <span className="text-gray-500">{t("invoice.daily")}</span>
          </span>
        ),
    });

    const services = Array.isArray(details?.services) ? details.services : [];
    for (const s of services) {
      const priceNum = Number(s?.price ?? 0) || 0;
      if (priceNum <= 0) continue;

      rows.push({
        label: s?.title || "—",
        value: formatMoneyOrFree(priceNum, locale, t, currency),
      });
    }

    const optItems = Array.isArray(details?.options?.items) ? details.options.items : [];
    for (const o of optItems) {
      const num = Math.max(1, Number(o?.num ?? 1) || 1);
      const sumPrice = Number(o?.sum_price ?? 0) || 0;
      if (sumPrice <= 0) continue;

      rows.push({
        label: `${String(o?.title ?? t("invoice.option"))} × ${formatNumber(num, locale, 0)}`,
        value: formatMoneyOrFree(sumPrice, locale, t, currency),
      });
    }

    const optSum = Number(details?.options?.sum ?? 0) || 0;
    if (optSum > 0) {
      rows.push({
        label: t("invoice.optionsTotal"),
        value: formatMoneyOrFree(optSum, locale, t, currency),
      });
    }

    const taxPercent = Number(details?.tax?.percent ?? 0) || 0;
    const taxPrice = Number(details?.tax?.price ?? 0) || 0;
    if (taxPrice > 0) {
      rows.push({
        label: t("invoice.tax", {
          percent: formatNumber(taxPercent, locale, 0),
        }),
        value: formatMoneyOrFree(taxPrice, locale, t, currency),
      });
    }

    if (typeof prePay !== "undefined" && prePay !== null) {
      rows.push({
        label: t("invoice.prepay"),
        value: t("invoice.paidValue", {
          value: formatMoney(prePay, locale, currency),
        }),
      });
    }

    if (typeof remainAtDelivery !== "undefined" && remainAtDelivery !== null) {
      rows.push({
        label: t("invoice.remaining"),
        value: formatMoney(remainAtDelivery, locale, currency),
      });
    }

    if (typeof sumAll !== "undefined" && sumAll !== null) {
      rows.push({
        label: t("invoice.finalCostForDays", {
          days: formatNumber(days || summary?.days || 0, locale, 0),
        }),
        value: formatMoney(sumAll, locale, currency),
      });
    }

    return rows;
  }, [
    details,
    currency,
    days,
    summary?.days,
    remainAtDelivery,
    prePay,
    sumAll,
    t,
    locale,
  ]);

  if (shouldHardLock) {
    return (
      <OtpLockScreen
        mobile={readonlyPhone}
        sessionLoading={sessionLoading}
      />
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900">
      <UploadThanksLockedDialog
        open={openThanks}
        secondsLeft={Math.max(0, secondsLeft)}
        onGoHome={() => router.push("/")}
      />

      <div className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="flex flex-col items-center text-center">
          <Lottie animationData={SuccessPayment} style={{ height: "148px" }} loop={false} />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {t("success.title")}
          </h1>
          <p className="max-w-[430px] text-xs leading-7 text-gray-600 dark:text-gray-300">
            {t("success.description")}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="font-black text-gray-900 dark:text-white">
            {t("reservationInfo")}
          </div>

          <button
            type="button"
            onClick={handleDownloadVoucher}
            disabled={downloadingVoucher}
            className={cn(
              "inline-flex items-center gap-2 font-black text-blue-600",
              downloadingVoucher && "cursor-not-allowed opacity-60",
            )}
          >
            <Download className="h-4 w-4" />
            {downloadingVoucher ? t("downloadingVoucher") : t("downloadVoucher")}
          </button>
        </div>

        <Card className="mt-2 rounded-2xl border border-gray-200 shadow-none dark:border-gray-800">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setOpenInfo((p) => !p)}
              className="flex w-full items-center justify-between p-3"
              aria-label={t("toggleInfo")}
            >
              <div className="">
                <div className="font-black text-gray-900 dark:text-white">
                  {carTitle || summary?.car_name || "—"}
                  {days ? (
                    <span className="ml-1 font-bold text-gray-500">
                      ({formatNumber(days, locale, 0)} {t("days")})
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("fromTo", { from: fromText, to: toText })}
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("remainAtDelivery")} :
                  <span className="mr-2 font-black text-gray-900 dark:text-white">
                    {typeof remainAtDelivery !== "undefined"
                      ? formatMoney(remainAtDelivery, locale, currency)
                      : "—"}
                  </span>
                </div>
              </div>

              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-500 transition-transform",
                  openInfo ? "rotate-180" : "rotate-0",
                )}
              />
            </button>

            {openInfo && (
              <div className="px-4 pb-4">
                <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-black text-gray-700 dark:bg-gray-800/40 dark:text-gray-200">
                    {t("invoice.title")}
                  </div>

                  <div className="divide-y divide-gray-100 px-3 dark:divide-gray-800">
                    {invoiceRows.map((row, idx) => (
                      <SummaryRow
                        key={idx}
                        label={row.label}
                        value={row.value}
                        subLabel={row.subLabel}
                        valueHint={row.valueHint}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-xs text-gray-900 dark:text-white md:text-sm">
          {t("uploadPrompt")}
        </div>

        <div className="mt-5">
          <div className="text-lg font-black text-gray-900 dark:text-white">
            {t("sections.idCard")}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <UploadTile
              label={t("labels.photo")}
              file={files.id_card}
              serverUrl={serverDocs.id_card?.file_url ?? null}
              onPick={() => inputs.current.id_card?.click()}
              onRemove={() => removeFile("id_card")}
              hasError={fieldErrors.id_card}
              gridOneSlot
            />
            <div className="hidden" />
          </div>

          <Input
            ref={(el) => {
              inputs.current.id_card = el as unknown as HTMLInputElement;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              onFile("id_card", (e.target as HTMLInputElement).files?.[0] ?? null)
            }
          />
        </div>

        <div className="mt-6">
          <div className="text-lg font-black text-gray-900 dark:text-white">
            {t("sections.driverLicense")}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <UploadTile
                label={t("labels.back")}
                file={files.dl_back}
                serverUrl={serverDocs.dl_back?.file_url ?? null}
                onPick={() => inputs.current.dl_back?.click()}
                onRemove={() => removeFile("dl_back")}
                hasError={fieldErrors.dl_back}
              />
              <Input
                ref={(el) => {
                  inputs.current.dl_back = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onFile("dl_back", (e.target as HTMLInputElement).files?.[0] ?? null)
                }
              />
            </div>

            <div>
              <UploadTile
                label={t("labels.front")}
                file={files.dl_front}
                serverUrl={serverDocs.dl_front?.file_url ?? null}
                onPick={() => inputs.current.dl_front?.click()}
                onRemove={() => removeFile("dl_front")}
                hasError={fieldErrors.dl_front}
              />
              <Input
                ref={(el) => {
                  inputs.current.dl_front = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onFile("dl_front", (e.target as HTMLInputElement).files?.[0] ?? null)
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b text-lg font-black text-gray-900 dark:text-white">
            {t("sections.internationalDriverLicense")}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t("noIntl")}
            </div>

            <Checkbox
              checked={noIntl}
              onCheckedChange={(checked) => {
                const v = checked === true;
                setNoIntl(v);
                if (v) {
                  setFieldErrors((p) => ({
                    ...p,
                    intl_dl_front: false,
                    intl_dl_back: false,
                  }));
                }
              }}
              className="h-5 w-5"
            />
          </div>

          {!noIntl && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <UploadTile
                  label={t("labels.back")}
                  file={files.intl_dl_back}
                  serverUrl={serverDocs.intl_dl_back?.file_url ?? null}
                  onPick={() => inputs.current.intl_dl_back?.click()}
                  onRemove={() => removeFile("intl_dl_back")}
                  hasError={fieldErrors.intl_dl_back}
                />
                <Input
                  ref={(el) => {
                    inputs.current.intl_dl_back = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    onFile(
                      "intl_dl_back",
                      (e.target as HTMLInputElement).files?.[0] ?? null,
                    )
                  }
                />
              </div>

              <div>
                <UploadTile
                  label={t("labels.front")}
                  file={files.intl_dl_front}
                  serverUrl={serverDocs.intl_dl_front?.file_url ?? null}
                  onPick={() => inputs.current.intl_dl_front?.click()}
                  onRemove={() => removeFile("intl_dl_front")}
                  hasError={fieldErrors.intl_dl_front}
                />
                <Input
                  ref={(el) => {
                    inputs.current.intl_dl_front = el as unknown as HTMLInputElement;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    onFile(
                      "intl_dl_front",
                      (e.target as HTMLInputElement).files?.[0] ?? null,
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="border-b text-lg font-black text-gray-900 dark:text-white">
            {t("sections.visa")}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t("noVisa")}
            </div>

            <Checkbox
              checked={noVisa}
              onCheckedChange={(checked) => {
                const v = checked === true;
                setNoVisa(v);
                if (v) {
                  setFieldErrors((p) => ({ ...p, visa: false }));
                }
              }}
              className="h-5 w-5"
            />
          </div>

          {!noVisa && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <UploadTile
                  label={t("labels.photo")}
                  file={files.visa}
                  serverUrl={serverDocs.visa?.file_url ?? null}
                  onPick={() => inputs.current.visa?.click()}
                  onRemove={() => removeFile("visa")}
                  hasError={fieldErrors.visa}
                  gridOneSlot
                />
                <div className="hidden" />
              </div>

              <Input
                ref={(el) => {
                  inputs.current.visa = el as unknown as HTMLInputElement;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  onFile("visa", (e.target as HTMLInputElement).files?.[0] ?? null)
                }
              />
            </>
          )}

          {err && <div className="mt-4 text-xs text-red-600">{err}</div>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-[560px] px-4 py-3">
          <Button
            onClick={submit}
            disabled={loading || openThanks}
            className="h-12 w-full rounded-xl bg-blue-600 font-black text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("sending") : t("submitDocuments")}
          </Button>
        </div>
      </div>
    </div>
  );
}