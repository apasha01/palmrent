/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";

export type HubCarsParams = {
  page?: number;
  sort?: string | null;
  search_title?: string | null;
  cat_id?: number[] | null;
};

export type HubCarItem = {
  id: number;
  title: string;
  branch: string;
  mn_price?: number | null;
  mx_price?: number | null;
  min_price?: number | null;
  min_price_f?: number | null;
  max_price?: number | null;
  max_price_f?: number | null;
  prices?: Array<{
    range: string;
    base_price: number;
    final_price: number;
  }>;
  off?: number;
  fuel?: string;
  baggage?: number;
  gearbox?: string;
  person?: number;
  deposit?: string;
  km?: string;
  free_delivery?: string;
  insurance?: string;
  photo?: string[];
  video?: string;
};

export type HubCarsResponseData = {
  meta?: {
    titleSeo?: string;
    descriptionSeo?: string;
    schemaSeo?: string;
    imgSeo?: string | null;
    favIcon?: string | null;
    logo?: string | null;
    canonical?: string;
    robots?: string;
    siteName?: string;
    urlPage?: string;
    alternate?: Array<{
      lang?: string;
      url?: string;
    }>;
  };
  cars: HubCarItem[];
  page: number;
  per_page: number;
  has_more: boolean;
  currency: string;
  rate_to_rial: number | null;
};

const buildQuery = (params?: HubCarsParams) => {
  const qs = new URLSearchParams();
  if (!params) return qs.toString();

  if (params.page) qs.set("page", String(params.page));
  if (params.sort) qs.set("sort", String(params.sort));
  if (params.search_title) qs.set("search_title", String(params.search_title));

  if (Array.isArray(params.cat_id) && params.cat_id.length > 0) {
    params.cat_id.forEach((id) => qs.append("cat_id[]", String(id)));
  }

  return qs.toString();
};

export async function getHubCarsOnly(
  branchId: number | string,
  locale: string,
  params?: HubCarsParams
): Promise<HubCarsResponseData> {
  const query = buildQuery(params);

  const url = query
    ? `/branch/${branchId}/cars/${locale}?${query}`
    : `/branch/${branchId}/cars/${locale}`;

  const res = await axios.get(url);

  return (
    res.data?.data ?? {
      cars: [],
      page: 1,
      per_page: 9,
      has_more: false,
      currency: "",
      rate_to_rial: null,
    }
  );
}