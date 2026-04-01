/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";
import { AxiosError } from "axios";

export type AppSeoMeta = {
  titleSeo?: string;
  descriptionSeo?: string;
  schemaSeo?: string;
  imgSeo?: string;
  favIcon?: string;
  logo?: string;
  canonical?: string;
  robots?: string;
  siteName?: string;
  urlPage?: string;
  keywordsSeo?: string[] | string;
  alternate?: Array<{
    lang?: string;
    url?: string;
    hreflang?: string;
    href?: string;
  }>;
};

export type AppDetailResponse = {
  status?: number;
  meta?: AppSeoMeta;
  data?: {
    androidHref?: string;
    iosHref?: string;
    webHref?: string;
    helpHref?: string;
    appName?: string;
    subtitle?: string;
    [key: string]: any;
  };
  message?: string;
};

export type AppDetailResult =
  | {
      ok: true;
      notFound: false;
      data: AppDetailResponse;
    }
  | {
      ok: false;
      notFound: true;
      status?: number;
      message?: string;
    }
  | {
      ok: false;
      notFound: false;
      status?: number;
      message?: string;
      error?: unknown;
    };

export async function getAppDetail(
  locale: string
): Promise<AppDetailResult> {
  try {
    const url = `/app/${locale}`;

    const res = await axios.get(url, {
      timeout: 15000,
    });

    const payload: AppDetailResponse = res.data ?? {};

    if (payload?.status === 404 || payload?.status === 201) {
      return {
        ok: false,
        notFound: true,
        status: payload?.status,
        message: payload?.message,
      };
    }

    if (payload?.status === 200 && payload?.meta) {
      return {
        ok: true,
        notFound: false,
        data: payload,
      };
    }

    return {
      ok: false,
      notFound: false,
      status: payload?.status,
      message: payload?.message || "Empty response data",
    };
  } catch (err) {
    const error = err as AxiosError<any>;
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unknown error in getAppDetail";

    if (status === 404) {
      return {
        ok: false,
        notFound: true,
        status,
        message,
      };
    }

    return {
      ok: false,
      notFound: false,
      status,
      message,
      error,
    };
  }
}