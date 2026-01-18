/* eslint-disable @typescript-eslint/no-explicit-any */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { HubCarsParams, getHubCarsOnly } from "./hub-cars.api";


export const HubCarsOnlyKey = (
  branchId: number | string,
  locale: string,
  params?: HubCarsParams
) => ["branch-cars-only", branchId, locale, params] as const;

export function useHubCarsOnly(
  branchId: number | string,
  locale: string,
  params?: HubCarsParams
) {
  return useQuery<any>({
    queryKey: HubCarsOnlyKey(branchId, locale, params),
    queryFn: () => getHubCarsOnly(branchId, locale, params),
    enabled: Boolean(branchId && locale),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
