/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "@/lib/axios";

export type HubCarsParams = {
  page?: number;
  sort?: string | null;
  search_title?: string | null;
  cat_id?: number[] | null;
};

const buildQuery = (params?: HubCarsParams) => {
  const qs = new URLSearchParams();

  if (!params) return qs.toString();

  if (params.page) qs.set("page", String(params.page));
  if (params.sort) qs.set("sort", String(params.sort));
  if (params.search_title) qs.set("search_title", String(params.search_title));

  // ✅ بک شما cat_id[] می‌گیره
  if (Array.isArray(params.cat_id) && params.cat_id.length > 0) {
    params.cat_id.forEach((id) => qs.append("cat_id[]", String(id)));
  }

  return qs.toString();
};

export async function getHubCarsOnly(
  branchId: number | string,
  locale: string,
  params?: HubCarsParams
) {
  const query = buildQuery(params);

  const url = query
    ? `/branch/${branchId}/cars/${locale}?${query}`
    : `/branch/${branchId}/cars/${locale}`;

  const res = await axios.get(url);

  // ✅ خروجی متد جدید: res.data.data
  return res.data?.data;
}
