/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const axios = Axios.create({
  baseURL: API_BASE_URL,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

// ✅ Request interceptor: توکن را از session بگیر
axios.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const token = (session as any)?.accessToken;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: اگر 401/403 شد => فقط signOut بدون ریدایرکت
let isSigningOut = false;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? "");

    // ✅ جلوگیری از loop روی endpointهای auth
    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/otp") ||
      url.includes("/verify") ||
      url.includes("/auth");

    // ✅ اگر خود NextAuth endpoint خطا داد، دخالت نکن
    const isNextAuthEndpoint = url.includes("/api/auth");

    if ((status === 401 || status === 403) && !isAuthEndpoint && !isNextAuthEndpoint) {
      if (!isSigningOut) {
        isSigningOut = true;
        try {
          // ✅ مهم: بدون redirect
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
