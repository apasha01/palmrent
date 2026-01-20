/* eslint-disable @typescript-eslint/no-explicit-any */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { BlogsParams } from "./blogs.api";
import { getBlogs } from "./blogs.api";
import type { BlogsResponse } from "./blogs.types";

export const blogsKey = (lang: string, params?: BlogsParams) =>
  ["blogs", lang, params] as const;

export function useBlogs(lang: string, params?: BlogsParams) {
  return useQuery<BlogsResponse>({
    queryKey: blogsKey(lang, params),
    queryFn: () => getBlogs(lang, params),
    enabled: Boolean(lang),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
