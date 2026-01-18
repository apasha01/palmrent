import { useQuery } from '@tanstack/react-query';
import { getBranches } from './branches.api';

export const branchesKey = (locale: string) => ['branches', locale] as const;

export function useBranches(locale: string) {
  return useQuery({
    queryKey: branchesKey(locale),
    queryFn: () => getBranches(locale),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    refetchOnWindowFocus: false,
  });
}
