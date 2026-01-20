/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "@/lib/axios";

export type BlogsParams = {
  page?: number;
  per_page?: number;
  search?: string | null;

  // اگر بعداً بک اضافه کرد
  branch?: string | null;
};

const buildQuery = (params?: BlogsParams) => {
  const qs = new URLSearchParams();
  if (!params) return qs.toString();

  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search) qs.set("search", String(params.search));
  if (params.branch) qs.set("branch", String(params.branch));

  return qs.toString();
};

export async function getBlogs(lang: string, params?: BlogsParams) {
  const query = buildQuery(params);
  const url = query ? `/blogs/index/${lang}?${query}` : `/blogs/index/${lang}`;

  const res = await axios.get(url);

  // ✅ خروجی نمونه شما: res.data.data.items
  return res.data?.data;
}
