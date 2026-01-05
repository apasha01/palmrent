/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/utils/axios";

export type ZarinpalRequestPaymentPayload = {
  rent_id: number | string;
};

export type ZarinpalRequestPaymentResponse = {
  ok: boolean;
  authority?: string;
  payment_url?: string;
  amount_toman?: number;
  message?: string;
  errors?: any;
};

export const requestZarinpalPayment = async (
  payload: ZarinpalRequestPaymentPayload
): Promise<ZarinpalRequestPaymentResponse> => {
  try {
    const res = await axios.post(`/payments/zarinpal/request`, payload);
    return res.data;
  } catch (error: any) {
    const data = error?.response?.data;
    return {
      ok: false,
      message: data?.message || error?.message || "خطا در شروع پرداخت",
      errors: data?.errors,
    };
  }
};

// معمولاً از فرانت صدا نمی‌زنیم چون زرین‌پال خودش redirect می‌کنه به verify
export const verifyZarinpalPayment = async (params: {
  Authority: string;
  Status: string;
}): Promise<any> => {
  try {
    const res = await axios.get(`/payments/zarinpal/verify`, { params });
    return res.data;
  } catch (error: any) {
    const data = error?.response?.data;
    return {
      ok: false,
      message: data?.message || error?.message || "خطا در تایید پرداخت",
      errors: data?.errors,
    };
  }
};
