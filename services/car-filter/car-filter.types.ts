// export type CarFilterSort = "new" | "price_min" | "price_max" | (string & {});

// export type CarFilterItem = {
//   id: number;
//   title: string;
//   branch: string;

//   rent_price: number | null;
//   final_price: number | null;

//   off: number;
//   fuel: string;
//   baggage: number;
//   gearbox: string;
//   person: number;

//   deposit: "yes" | "no" | string;
//   km: "yes" | "no" | string;
//   free_delivery: "yes" | "no" | string;
//   insurance: "yes" | "no" | string;

//   photo: string[];
//   video: string;
// };

// export type CarFilterParams = {
//   locale: string;

//   branch_id: number;

//   // ✅ تاریخ‌ها اختیاری (برای حالت فقط branch)
//   from?: string;
//   to?: string;

//   dt?: string; // "10:00"
//   rt?: string; // "11:30"

//   page?: number;
//   car_id?: number;
//   cat_id?: number[];

//   // ✅ typed search فقط (متن داخل input)
//   search_title?: string;

//   // ✅ برند چیپ‌ها
//   brand?: string | string[];

//   sort?: CarFilterSort;
//   min_p?: number;
//   max_p?: number;
// };

// export type CarFilterResponse = {
//   cars: CarFilterItem[];
//   currency: string;
//   rate_to_rial: number | null;
// };


export type CarFilterSort = "new" | "price_min" | "price_max" | (string & {});

export type YesNoFilter = "yes" | "no" | (string & {});

export type GearboxFilter =
  | "automatic"
  | "manual"
  | "geared"
  | "hybrid"
  | (string & {});

export type FuelFilter =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "electric"
  | "mixed"
  | (string & {});

export type CarFilterItem = {
  id: number;
  title: string;
  branch: string;
  sort?: number | null;
  updated_at?: string | null;

  rent_price: number | null;
  final_price: number | null;

  off: number;
  fuel: string;
  baggage: number;
  gearbox: string;
  person: number;

  deposit: "yes" | "no" | string;
  km: "yes" | "no" | string;
  free_delivery: "yes" | "no" | string;
  insurance: "yes" | "no" | string;

  photo: string[];
  video: string;

  prices?: Array<{
    range: string;
    base_price: number | null;
    final_price: number | null;
    type: string;
  }>;
};

export type CarFilterParams = {
  locale: string;
  branch_id: number;

  // dates optional
  from?: string;
  to?: string;
  dt?: string;
  rt?: string;

  page?: number;
  car_id?: number;

  // old filters
  cat_id?: number[];
  search_title?: string;
  brand?: string | string[];
  sort?: CarFilterSort;
  min_p?: number;
  max_p?: number;

  // new filters
  gearbox?: GearboxFilter | GearboxFilter[];
  fuel?: FuelFilter | FuelFilter[];
  person?: number | number[];
  baggage?: number | number[];
  deposit?: YesNoFilter;
  free_delivery?: YesNoFilter;
  insurance?: YesNoFilter;
  km?: YesNoFilter;
};

export type CarFilterResponse = {
  cars: CarFilterItem[];
  currency: string;
  rate_to_rial: number | null;

  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};