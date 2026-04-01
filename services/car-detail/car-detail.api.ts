/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";
import { AxiosError } from "axios";

export type CarDetailSeoMeta = {
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
  alternate?: Array<{
    hreflang?: string;
    href?: string;
  }>;
  branches_menu?: any[];
  profile?: boolean;
};

export type CarDetailResponse = {
  status?: number;
  meta?: CarDetailSeoMeta;
  data?: any;
  message?: string;
};

export type CarDetailResult =
  | {
      ok: true;
      notFound: false;
      data: CarDetailResponse;
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

export async function getCarDetail(
  id: number | string,
  locale: string
): Promise<CarDetailResult> {
  try {
    const url = `/car/show/${id}/${locale}`;

    const res = await axios.get(url, {
      timeout: 15000,
    });

    const payload: CarDetailResponse = res.data ?? {};

    // اگر بک‌اند status داخل body برگرداند
    if (payload?.status === 404 || payload?.status === 201) {
      return {
        ok: false,
        notFound: true,
        status: payload?.status,
        message: payload?.message,
      };
    }

    // فقط وقتی data معتبر داریم success حساب کن
    if (payload?.data) {
      return {
        ok: true,
        notFound: false,
        data: payload,
      };
    }

    // اگر پاسخ آمد ولی data نداشت، این را 404 واقعی فرض نکن
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
      "Unknown error in getCarDetail";

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