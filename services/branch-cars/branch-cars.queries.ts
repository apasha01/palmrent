/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { BranchCarsParams } from "./branch-cars.api";
import { getBranchCars } from "./branch-cars.api";

function sortNumbers(values?: number[] | null) {
  return Array.isArray(values) ? [...values].sort((a, b) => a - b) : [];
}

function sortStrings(values?: string[] | null) {
  return Array.isArray(values) ? [...values].sort() : [];
}

function stableParamsForKey(params?: BranchCarsParams) {
  if (!params) return null;

  return {
    page: params.page ?? 1,
    sort: params.sort ?? null,
    search_title: params.search_title ?? "",

    cat_id: sortNumbers(params.cat_id),
    brand: sortNumbers(params.brand),

    gearbox: sortStrings(params.gearbox),
    fuel: sortStrings(params.fuel),

    person: sortNumbers(params.person),
    baggage: sortNumbers(params.baggage),

    deposit: params.deposit ?? null,
    free_delivery: params.free_delivery ?? null,
    insurance: params.insurance ?? null,
    km: params.km ?? null,

    min_p: params.min_p ?? null,
    max_p: params.max_p ?? null,
  };
}

export const branchCarsKey = (
  slug: string,
  locale: string,
  params?: BranchCarsParams
) => ["branch-cars", slug, locale, stableParamsForKey(params)] as const;

export function useBranchCars(
  slug: string,
  locale: string,
  params?: BranchCarsParams
) {
  return useQuery<any>({
    queryKey: branchCarsKey(slug, locale, params),
    queryFn: () => getBranchCars(slug, locale, params),
    enabled: Boolean(slug && locale),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}