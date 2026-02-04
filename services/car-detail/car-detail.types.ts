/* eslint-disable @typescript-eslint/no-explicit-any */

export type CarDailyPrice = {
  title: string;
  price: string; // "240.00"
  price_off: number; // 187
};

export type SimilarCar = {
  id: number;
  title: string;
  year: number;
  photo: string;
};

export type CarDetail = {
  id: number;
  branch_id: number;
  branch: string;

  title: string;
  text: string;

  off_percent: number;
  daily_price: CarDailyPrice[];

  deposit: string;

  insurance: "yes" | "no" | string;
  free_delivery: "yes" | "no" | string;
  km: "yes" | "no" | string;

  fuel: string;
  baggage: number;
  gearbox: string;
  person: number;

  currency: string;
  video: string | null;

  photos: string[];

  similar_cars: SimilarCar[];

  whatsapp: string | null;
};

export type CarDetailApiResponse = {
  status: number;
  data: CarDetail;
};
