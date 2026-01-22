import { useQuery } from '@tanstack/react-query';
import { getBranches } from './branches.api';

export const branchesKey = (locale: string) => ['branches', locale] as const;

export function useBranches(locale: string) {
  return useQuery({
    queryKey: branchesKey(locale),
    queryFn: () => getBranches(locale),

    // مهم برای اینکه بعد refresh هم فوری دیتا بیاد و دوباره درخواست نزنه
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
