/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { BranchCarsParams } from "./branch-cars.api"
import { getBranchCars } from "./branch-cars.api"

function stableParamsForKey(params?: BranchCarsParams) {
  if (!params) return null

  return {
    page: params.page ?? 1,
    sort: params.sort ?? null,
    search_title: params.search_title ?? "",
    cat_id: Array.isArray(params.cat_id) ? [...params.cat_id].sort((a, b) => a - b) : [],
  }
}

export const branchCarsKey = (slug: string, locale: string, params?: BranchCarsParams) =>
  ["branch-cars", slug, locale, stableParamsForKey(params)] as const

export function useBranchCars(slug: string, locale: string, params?: BranchCarsParams) {
  return useQuery<any>({
    queryKey: branchCarsKey(slug, locale, params),
    queryFn: () => getBranchCars(slug, locale, params),
    enabled: Boolean(slug && locale),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  })
}
