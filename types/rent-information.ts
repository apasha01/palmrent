/* eslint-disable @typescript-eslint/no-explicit-any */
export type LocalePlace = {
  id: number | string
  title: string
  price?: string
  price_pay?: string
  pre_price_pay?: string
}

export type ApiOption = {
  id: number
  title: string
  description?: string
  price: string
  price_pay?: string
  pre_price_pay?: string
}

export type ApiItem = {
  pay_price: string
  pre_pay_price: string
  rent_price_day: string
  rent_days: string
  insurance_complete_price_pay?: string
  pre_price_insurance_complete_price_pay?: string
  tax_percent?: string
  deposit_price: string
  price_2_toman: number
  title: string
  photo?: string[] | string

  gearbox?: string
  fuel?: string
  baggage?: any
  person?: any
}

export type ApiCalcResponse = {
  item: ApiItem
  options?: ApiOption[]
  places?: LocalePlace[]
  currency: string
  collage_tax_in?: "yes" | "no"
}

export type Totals = {
  total: number
  prePay: number
  debt: number
  tax: number
  rentDays: number
  dailyPrice: number
  extraItems: { title: string; price: number }[]
}

export type UserInfo = {
  name: string
  email: string
  phone: string
}

export type LocationState = {
  isDesired: boolean
  location: string | number | null
  address: string
}


/* eslint-disable @typescript-eslint/no-explicit-any */

export type CarFilterParams = {
  locale: string;
  branch_id: number;

  from: string;
  to: string;

  dt?: string;
  rt?: string;

  sort?: string;
  search_title?: string;

  cat_id?: number[];

  min_p?: number;
  max_p?: number;
};

export type ApiCar = {
  id: number;
  title: string;
  branch: string;

  rent_price: number | null;
  final_price: number | null;

  off?: number;

  fuel?: string;
  baggage?: any;
  gearbox?: any;
  person?: any;

  deposit?: "yes" | "no";
  km?: "yes" | "no";
  free_delivery?: "yes" | "no";
  insurance?: "yes" | "no";

  photo?: string[]; // بک به شکل آرایه برمی‌گردونه
  video?: string;
  [key: string]: any;
};

export type CarFilterResponse = {
  cars: ApiCar[];
  currency: string;
  rate_to_rial: number | null;
};
