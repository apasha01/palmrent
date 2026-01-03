/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * مسیرهای بک‌اند (طبق routes/api.php):
 * POST /api/auth/otp/request
 * POST /api/auth/otp/verify
 * GET  /api/auth/me
 * POST /api/auth/refresh
 * POST /api/auth/logout
 */

import axios from "@/utils/axios";

const TOKEN_KEY: string = "authToken";

/* =========================
   Token helpers
========================= */
export const getAuthToken = (): any => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: any): any => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = (): any => {
  localStorage.removeItem(TOKEN_KEY);
};

/* =========================
   OTP APIs
========================= */

/**
 * ارسال OTP
 */
export const otpRequest = async (mobile: any): Promise<any> => {
  const response: any = await axios.post("auth/otp/request", {
    mobile,
  });

  return response.data;
};

/**
 * تایید OTP و دریافت JWT
 */
export const otpVerify = async (
  mobile: any,
  code: any
): Promise<any> => {
  const response: any = await axios.post("auth/otp/verify", {
    mobile,
    code,
  });

  if (response?.data?.access_token) {
    setAuthToken(response.data.access_token);
  }

  return response.data;
};

/* =========================
   Authenticated APIs
========================= */

/**
 * دریافت اطلاعات کاربر لاگین‌شده
 */
export const me = async (): Promise<any> => {
  const response: any = await axios.get("auth/me");
  return response.data;
};

/**
 * رفرش توکن
 */
export const refreshToken = async (): Promise<any> => {
  const response: any = await axios.post("auth/refresh");

  if (response?.data?.access_token) {
    setAuthToken(response.data.access_token);
  }

  return response.data;
};

/**
 * لاگ اوت
 */
export const logout = async (): Promise<any> => {
  const response: any = await axios.post("auth/logout");
  clearAuthToken();
  return response.data;
};

/**
 * لاگ اوت امن
 * حتی اگر بک‌اند خطا بده، توکن پاک می‌شود
 */
export const safeLogout = async (): Promise<any> => {
  try {
    const response: any = await axios.post("auth/logout");
    clearAuthToken();
    return response.data;
  } catch (error: any) {
    clearAuthToken();
    throw error;
  }
};
