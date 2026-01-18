/* eslint-disable @typescript-eslint/no-explicit-any */

export type Car = {
  id: number;
  title: string;
  branch: string;

  mn_price: number | null;
  mx_price: number | null;

  min_price: number | null;
  min_price_f: number | null;
  max_price: number | null;
  max_price_f: number | null;

  prices: Array<{
    range: string;
    base_price: number;
    final_price: number;
  }>;

  off: number;
  fuel: string;
  baggage: any;
  gearbox: any;
  person: any;

  deposit: string;
  km: string;
  free_delivery: string;
  insurance: string;

  photo: string[];
  video: string;
};

export type HubCarsOnlyResponse = {
  cars: Car[];
  page: number;
  per_page: number;
  has_more: boolean;
  currency: string;
};

// اگر کل API response رو هم خواستی:
export type HubCarsOnlyApiResponse = {
  status: number;
  data: HubCarsOnlyResponse;
};
