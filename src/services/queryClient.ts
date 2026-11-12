import { QueryClient } from '@tanstack/react-query';
import { isUnauthorized } from '../utils/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 1 && !isUnauthorized(error),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false, gcTime: 0 },
  },
});
