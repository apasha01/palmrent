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

  branch_id: number;
  from: string;
  to: string;

  // ✅ NEW
  dt?: string; // "10:00"
  rt?: string; // "11:30"

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

  currency: string;             // مثلا 'AED'
  rate_to_rial: number | null;  // مثلا 36000 یا null
};
