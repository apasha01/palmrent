export type CarFilterSort = 'new' | 'price_min' | 'price_max' | (string & {});

export type CarFilterItem = {
  id: number;
  title: string;
  branch: string;

  rent_price: number | null;
  final_price: number | null;

  off: number;
  fuel: string;
  baggage: number;
  gearbox: string;
  person: number;

  deposit: 'yes' | 'no' | string;
  km: 'yes' | 'no' | string;
  free_delivery: 'yes' | 'no' | string;
  insurance: 'yes' | 'no' | string;

  photo: string[];
  video: string;
};

export type CarFilterParams = {
  locale: string;

  // required by backend (for price calc)
  branch_id: number;
  from: string; // e.g. '2024-04-08 10:00:00'
  to: string;   // e.g. '2024-04-18 12:00:00'

  // optional filters
  page?: number;
  car_id?: number;
  cat_id?: number[];
  search_title?: string;
  sort?: CarFilterSort;
  min_p?: number;
  max_p?: number;
};

export type CarFilterResponse = {
  cars: CarFilterItem[];
};
