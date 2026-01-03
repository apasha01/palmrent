/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/utils/axios";

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
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

export async function otpRequest(mobile: string) {
  const { data } = await axios.post<ApiResponse<OtpRequestRes>>("auth/otp/request", { mobile });

  if (!data.success) throw new Error(data.message ?? "OTP request failed");
  return data.data!;
}

export async function otpVerify(mobile: string, code: string) {
  const { data } = await axios.post<ApiResponse<OtpVerifyRes>>("auth/otp/verify", { mobile, code });

  if (!data.success) throw new Error(data.message ?? "OTP verify failed");
  return data.data!;
}

// protected
export async function authMe() {
  const { data } = await axios.get<ApiResponse<{ user: any }>>("auth/me");
  if (!data.success) throw new Error(data.message ?? "Unauthenticated");
  return data.data!;
}

export async function authRefresh() {
  const { data } = await axios.post<ApiResponse<{ access_token: string; expires_in: number }>>("auth/refresh");
  if (!data.success) throw new Error(data.message ?? "Unable to refresh token");
  return data.data!;
}

export async function authLogout() {
  const { data } = await axios.post<ApiResponse<null>>("auth/logout");
  if (!data.success) throw new Error(data.message ?? "Unable to logout");
  return true;
}
