// queryClient.persist.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { makeQueryClient } from './queryClient';

export const queryClient = makeQueryClient();

if (typeof window !== 'undefined') {
  const persister = createAsyncStoragePersister({
    storage: window.localStorage,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 روز
  });
}
