/* eslint-disable @typescript-eslint/no-explicit-any */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BranchCarsParams, getBranchCars } from "./branch-cars.api";

export const branchCarsKey = (slug: string, locale: string, params?: BranchCarsParams) =>
  ["branch-cars", slug, locale, params] as const;

export function useBranchCars(slug: string, locale: string, params?: BranchCarsParams) {
  return useQuery<any>({
    queryKey: branchCarsKey(slug, locale, params),
    queryFn: () => getBranchCars(slug, locale, params),
    enabled: Boolean(slug && locale),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
