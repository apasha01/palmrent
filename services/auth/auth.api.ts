/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";

type ApiResponse<T> = {
  success?: boolean | number | string;
  message?: string | null;
  data?: T | null;

  // بعضی بک‌اندها:
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
  // "auth/..." -> "/auth/..."
  // "/auth/..." -> "/auth/..."
  return path.startsWith("/") ? path : `/${path}`;
}

function pickMessage(payload: any): string | null {
  return (
    payload?.message ??
    payload?.msg ??
    payload?.error?.message ??
    (typeof payload?.error === "string" ? payload.error : null) ??
    null
  );
}

function pickData<T>(payload: any): T | null {
  // حالات رایج:
  // { success, data: {...} }
  // { success, data: { data: {...} } }
  // axios interceptor ها معمولاً data رو همین payload میدن
  const d = payload?.data;
  if (!d) return null;
  if (d?.data && typeof d?.data === "object") return d.data as T;
  return d as T;
}

function isSuccess(payload: any): boolean {
  // حالت‌های مختلف success/status
  const s = payload?.success;
  if (typeof s === "boolean") return s;
  if (typeof s === "number") return s === 1;
  if (typeof s === "string") return s === "true" || s === "1" || s === "success";

  // بعضی بک‌اندها فقط status میدن:
  const st = payload?.status;
  if (typeof st === "number") return st >= 200 && st < 300;

  return false;
}

function ensureOk<T>(payload: ApiResponse<T>, fallbackMsg: string): T {
  const ok = isSuccess(payload);
  const msg = pickMessage(payload) ?? fallbackMsg;

  if (!ok) {
    throw new Error(msg);
  }

  const data = pickData<T>(payload);
  if (data == null) {
    throw new Error(msg || "Empty response data");
  }

  return data;
}

// ---------- API ----------
export async function otpRequest(mobile: string) {
  const { data } = await axios.post<ApiResponse<OtpRequestRes>>(
    normalizePath("auth/otp/request"),
    { mobile }
  );

  return ensureOk<OtpRequestRes>(data, "OTP request failed");
}

export async function otpVerify(mobile: string, code: string) {
  const { data } = await axios.post<ApiResponse<OtpVerifyRes>>(
    normalizePath("auth/otp/verify"),
    { mobile, code }
  );

  const res = ensureOk<OtpVerifyRes>(data, "OTP verify failed");

  // ✅ حداقل چک‌های حیاتی
  if (!res?.access_token) throw new Error("OTP verify: access_token missing");
  if (!res?.user) throw new Error("OTP verify: user missing");

  return res;
}

// ---------- protected ----------
export async function authMe() {
  const { data } = await axios.get<ApiResponse<{ user: any }>>(
    normalizePath("auth/me")
  );

  const res = ensureOk<{ user: any }>(data, "Unauthenticated");
  if (!res?.user) throw new Error("authMe: user missing");
  return res;
}

export async function authRefresh() {
  const { data } = await axios.post<
    ApiResponse<{ access_token: string; expires_in: number }>
  >(normalizePath("auth/refresh"));

  const res = ensureOk<{ access_token: string; expires_in: number }>(
    data,
    "Unable to refresh token"
  );

  if (!res?.access_token) throw new Error("authRefresh: access_token missing");
  return res;
}

export async function authLogout() {
  const { data } = await axios.post<ApiResponse<null>>(
    normalizePath("auth/logout")
  );

  // بعضی بک‌اندها logout رو data=null میدن ولی success=true
  if (!isSuccess(data)) {
    throw new Error(pickMessage(data) ?? "Unable to logout");
  }
  return true;
}
