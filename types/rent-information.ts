/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReactNode } from "react";

export type LocalePlace = {
  id: number | string;
  title: string;
  address_title?: string | null;
  need_address?: "yes" | "no";
  price?: string | number;
  price_pay?: string | number;
  pre_price_pay?: string | number;
};

export type ApiOption = {
  id: number;
  title: string;
  description?: string;
  price: string | number;
  price_pay?: string | number;
  pre_price_pay?: string | number;
};

export type ApiItem = {
  pay_price: string | number;
  pre_pay_price: string | number;
  rent_price_day: string | number;
  rent_days: string | number;

  rent_price_day_before_discount?: string | number;
  rent_price_day_after_discount?: string | number;
  rent_total_before_discount?: string | number;
  rent_total_after_discount?: string | number;
  rent_price?: string | number;
  final_price?: string | number;
  off?: string | number;

  insurance_complete_price_pay?: string | number;
  pre_price_insurance_complete_price_pay?: string | number;

  tax_percent?: string | number;

  deposit_price: string | number;
  price_2_toman: number;

  title: string;
  photo?: string[] | string;

  gearbox?: string;
  fuel?: string;
  baggage?: any;
  person?: any;

  // اگر اینا تو UI استفاده می‌شن بهتره اینجا هم بیاد (اختیاری)
  insurance_complete_status?: "yes" | "no";
  deposit?: "yes" | "no";
  km?: "yes" | "no";
  free_delivery?: "yes" | "no";
};

export type ApiCalcResponse = {
  item: ApiItem;
  options?: ApiOption[];
  places?: LocalePlace[];
  currency: string;
  collage_tax_in?: "yes" | "no";
};

export type TotalsExtraItem = {
  title: string;
  price: number;
  subLabel?: ReactNode; // ✅ اضافه شد برای "قیمت روزانه" و ...
};

export type Totals = {
  total: number;
  prePay: number;
  debt: number;
  tax: number;
  rentDays: number;
  dailyPrice: number;
  extraItems: TotalsExtraItem[]; // ✅ اینجا اصلاح شد
};

export type UserInfo = {
  name: string;
  email: string;
  phone: string;
};

export type LocationState = {
  // برای سازگاری فعلاً نگهش می‌داریم، ولی دیگه تو UI/ارسال استفاده نمی‌کنیم
  isDesired: boolean;
  location: string | number | null;
  address: string;
};
