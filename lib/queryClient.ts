import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30_000, // پیش‌فرض ۳۰ ثانیه
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
