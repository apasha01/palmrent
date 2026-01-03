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
    const token = (session as any)?.accessToken; // ✅ از session.accessToken

    if (token) {
      config.headers = config.headers ?? {};
      // بعضی وقت‌ها AxiosHeaders است، ولی این شکل امن‌تره
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: اگر 401/403 شد، signOut کن
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = (error?.config?.url ?? "").toString();

    // ✅ جلوگیری از loop روی endpointهای ورود/otp
    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/otp") ||
      url.includes("/verify") ||
      url.includes("/auth");

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      await signOut({ redirect: true, callbackUrl: "/login" });
    }

    return Promise.reject(error);
  }
);

export default axios;
