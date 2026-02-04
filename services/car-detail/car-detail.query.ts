/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getCarDetail } from "./car-detail.api";

export const CarDetailKey = (id: number | string, locale: string) =>
  ["car-detail", id, locale] as const;

export function useCarDetail(id: number | string, locale: string) {
  return useQuery<any>({
    queryKey: CarDetailKey(id, locale),
    queryFn: () => getCarDetail(id, locale),
    enabled: Boolean(id && locale),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
