/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "@/lib/axios";

export type BranchCarsParams = {
  page?: number;
  sort?: string | null;
  search_title?: string | null;
  cat_id?: number[] | null;
};

const buildQuery = (params?: BranchCarsParams) => {
  const qs = new URLSearchParams();

  if (!params) return qs.toString();

  if (params.page) qs.set("page", String(params.page));
  if (params.sort) qs.set("sort", String(params.sort));
  if (params.search_title) qs.set("search_title", String(params.search_title));

  // ✅ مهم: cat_id[] برای اینکه بک درست بفهمه
  if (Array.isArray(params.cat_id) && params.cat_id.length > 0) {
    params.cat_id.forEach((id) => qs.append("cat_id[]", String(id)));
  }

  return qs.toString();
};

export async function getBranchCars(
  slug: string,
  locale: string,
  params?: BranchCarsParams
) {
  const query = buildQuery(params);
  const url = query
    ? `/car/branch/${slug}/${locale}?${query}`
    : `/car/branch/${slug}/${locale}`;

  const res = await axios.get(url);

  // ✅ خروجی‌ای که تو فرستادی: res.data.data
  return res.data?.data;
}
