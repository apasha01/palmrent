import { useInfiniteQuery } from "@tanstack/react-query"
import { carFilterPage } from "./car-filter.api"
import { carFilterInfiniteKey } from "./car-filter.keys"
import type { CarFilterParams } from "./car-filter.types"

function expectedPageSize(page: number) {
  return page === 1 ? 6 : 3
}

export function useInfiniteCarFilter(params: CarFilterParams, enabled = true) {
  return useInfiniteQuery({
    queryKey: carFilterInfiniteKey(params),
    enabled,

    initialPageParam: 1,
    queryFn: ({ pageParam }) => carFilterPage(params, pageParam),

    getNextPageParam: (lastPage, allPages) => {
      const lastPageNumber = allPages.length // چون صفحه 1 => length=1
      const got = lastPage?.cars?.length ?? 0
      const need = expectedPageSize(lastPageNumber)

      if (got < need) return undefined // پایان
      return allPages.length + 1
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })
}
