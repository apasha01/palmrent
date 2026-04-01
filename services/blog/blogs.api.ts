/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "@/lib/axios";
import type { BlogsApiResponse, BlogsResult } from "./blogs.types";

export type BlogsParams = {
  page?: number;
  per_page?: number;
  search?: string | null;
  branch?: string | null;
};

const buildQuery = (params?: BlogsParams) => {
  const qs = new URLSearchParams();

  if (!params) return qs.toString();

  if (typeof params.page === "number") {
    qs.set("page", String(params.page));
  }

  if (typeof params.per_page === "number") {
    qs.set("per_page", String(params.per_page));
  }

  if (params.search) {
    qs.set("search", String(params.search));
  }

  if (params.branch) {
    qs.set("branch", String(params.branch));
  }

  return qs.toString();
};

export async function getBlogsIndexData(
  lang: string,
  params?: BlogsParams,
): Promise<BlogsResult> {
  const query = buildQuery(params);
  const url = query ? `/blogs/index/${lang}?${query}` : `/blogs/index/${lang}`;

  const res = await axios.get<BlogsApiResponse>(url);

  return {
    items: res.data?.data?.items ?? [],
    index_description: res.data?.data?.index_description ?? "",
    meta: res.data?.meta,
  };
}