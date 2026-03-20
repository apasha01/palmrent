/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";

type ApiResponse<T> = {
  success?: boolean | number | string;
  message?: string | null;
  data?: T | null;
  status?: number;
  error?: any;
};

export type OtpRequestRes = {
  expires_in_seconds: number;
  dev_code?: string | null;
};

export type OtpVerifyRes = {
  access_token: string;
  expires_in: number;
  user: any;
};

// ---------- helpers ----------
function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * پیام خطا رو مستقیم از body بک‌اند می‌خونه.
 * بک‌اند همیشه: { success: false, message: "...", data: null }
 */
function extractBackendMessage(error: any, fallback: string): string {
  // ✅ اول از body بک‌اند بخون
  const msg = error?.response?.data?.message;
  if (msg && typeof msg === "string" && msg.trim()) return msg.trim();

  // ✅ اگه بک‌اند اصلاً جواب نداد (network error / timeout)
  if (!error?.response) return "اتصال به سرور برقرار نشد.";

  return fallback;
}

function pickMessage(payload: any): string | null {
  return payload?.message ?? payload?.msg ?? null;
}

function pickData<T>(payload: any): T | null {
  const d = payload?.data;
  if (!d) return null;
  if (d?.data && typeof d?.data === "object") return d.data as T;
  return d as T;
}

function isSuccess(payload: any): boolean {
  const s = payload?.success;
  if (typeof s === "boolean") return s;
  if (typeof s === "number") return s === 1;
  if (typeof s === "string") return s === "true" || s === "1" || s === "success";
  return false;
}

function ensureOk<T>(payload: ApiResponse<T>, fallbackMsg: string): T {
  if (!isSuccess(payload)) {
    throw new Error(pickMessage(payload) ?? fallbackMsg);
  }
  const data = pickData<T>(payload);
  if (data == null) {
    throw new Error(pickMessage(payload) ?? fallbackMsg);
  }
  return data;
}

// ---------- API ----------
export async function otpRequest(mobile: string) {
  try {
    const { data } = await axios.post<ApiResponse<OtpRequestRes>>(
      normalizePath("auth/otp/request"),
      { mobile }
    );
    return ensureOk<OtpRequestRes>(data, "ارسال کد با خطا مواجه شد.");
  } catch (e: any) {
    throw new Error(extractBackendMessage(e, "ارسال کد با خطا مواجه شد."));
  }
}

export async function otpVerify(mobile: string, code: string) {
  try {
    const { data } = await axios.post<ApiResponse<OtpVerifyRes>>(
      normalizePath("auth/otp/verify"),
      { mobile, code }
    );
    const res = ensureOk<OtpVerifyRes>(data, "تأیید کد با خطا مواجه شد.");
    if (!res?.access_token) throw new Error("access_token missing");
    if (!res?.user) throw new Error("user missing");
    return res;
  } catch (e: any) {
    throw new Error(extractBackendMessage(e, "تأیید کد با خطا مواجه شد."));
  }
}

export async function authMe() {
  try {
    const { data } = await axios.get<ApiResponse<{ user: any }>>(
      normalizePath("auth/me")
    );
    const res = ensureOk<{ user: any }>(data, "احراز هویت نامعتبر است.");
    if (!res?.user) throw new Error("user missing");
    return res;
  } catch (e: any) {
    throw new Error(extractBackendMessage(e, "احراز هویت نامعتبر است."));
  }
}

export async function authRefresh() {
  try {
    const { data } = await axios.post<
      ApiResponse<{ access_token: string; expires_in: number }>
    >(normalizePath("auth/refresh"));
    const res = ensureOk<{ access_token: string; expires_in: number }>(
      data,
      "خطا در تمدید توکن."
    );
    if (!res?.access_token) throw new Error("access_token missing");
    return res;
  } catch (e: any) {
    throw new Error(extractBackendMessage(e, "خطا در تمدید توکن."));
  }
}

export async function authLogout() {
  try {
    const { data } = await axios.post<ApiResponse<null>>(
      normalizePath("auth/logout")
    );
    if (!isSuccess(data)) {
      throw new Error(pickMessage(data) ?? "خطا در خروج از حساب.");
    }
    return true;
  } catch (e: any) {
    throw new Error(extractBackendMessage(e, "خطا در خروج از حساب."));
  }
}