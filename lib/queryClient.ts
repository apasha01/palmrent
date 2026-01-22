// queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 1000 * 60 * 60 * 24 , // 7 روز
        gcTime: 1000 * 60 * 60 * 24 ,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
