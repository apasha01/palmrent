/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const axios = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

// ✅ مسیرهایی که نباید اصلاً getSession صدا بخورن (public)
const PUBLIC_ENDPOINTS = [
  "/auth/otp/request",
  "/auth/otp/verify",
  "/meta",
  "/blogs",
  "/branches",
  "/cars",
  "/settings",
];

// ✅ Request interceptor: فقط وقتی لازم شد session بگیر
axios.interceptors.request.use(
  async (config) => {
    const url = String(config.url ?? "");

    // اگر خود next-auth endpoint بود (نباید اینجا هم بیاد)
    if (url.includes("/api/auth")) return config;

    // اگر درخواست public بود => session نزن
    const isPublic = PUBLIC_ENDPOINTS.some((p) => url.startsWith(p) || url.includes(p));
    if (isPublic) return config;

    // ✅ فقط برای protected ها session بگیر
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;

      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // اگر session خراب بود، نذار کل axios درخواست‌ها بمیرن
      if (process.env.NODE_ENV !== "production") {
        console.log("[axios] getSession failed (ignored):", (e as any)?.message || e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: اگر 401/403 شد => signOut بدون redirect
let isSigningOut = false;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? "");

    // روی auth endpointها loop نزن
    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/otp") ||
      url.includes("/verify") ||
      url.includes("/auth");

    const isNextAuthEndpoint = url.includes("/api/auth");

    if ((status === 401 || status === 403) && !isAuthEndpoint && !isNextAuthEndpoint) {
      if (!isSigningOut) {
        isSigningOut = true;
        try {
          await signOut({ redirect: false });
        } catch (e) {
          console.error("signOut in interceptor failed:", e);
        } finally {
          setTimeout(() => {
            isSigningOut = false;
          }, 1000);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
