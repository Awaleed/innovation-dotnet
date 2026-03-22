import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';

/**
 * Route helper shape from TsGen: { url(): string } or { url: string }
 */
type RouteHelper = { url(): string } | { url: string };

function resolveUrl(route: RouteHelper): string {
  return typeof route.url === 'function' ? route.url() : route.url;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteFactory = (...args: any[]) => RouteHelper;

/**
 * React Query hook for GET requests using TsGen route helpers.
 *
 * @example
 * const { data, isLoading } = useRouteQuery<IChallengeListResponse[]>(api.v1.challenges.index);
 */
export function useRouteQuery<TData>(
  routeFn: RouteFactory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
  options?: { enabled?: boolean; staleTime?: number },
) {
  const route = routeFn(...args);
  const url = resolveUrl(route);

  return useQuery<TData>({
    queryKey: [url, ...args],
    queryFn: async () => {
      const response = await api.get<TData>(url);
      return response.data;
    },
    ...options,
  });
}

/**
 * React Query mutation hook using TsGen route helpers.
 * Defaults to POST. Use useRouteMutationWithMethod for other methods.
 *
 * @example
 * const mutation = useRouteMutation(api.v1.challenges.create, {
 *     invalidate: ['/api/v1/challenges'],
 * });
 * mutation.mutate(formData);
 */
export function useRouteMutation<TData = unknown, TVariables = unknown>(
  routeFn: RouteFactory,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidate?: string[];
  },
) {
  return useRouteMutationWithMethod<TData, TVariables>(routeFn, 'POST', options);
}

/**
 * React Query mutation hook with configurable HTTP method.
 */
export function useRouteMutationWithMethod<TData = unknown, TVariables = unknown>(
  routeFn: RouteFactory,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidate?: string[];
  },
) {
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMutation<TData, Error, TVariables & { args?: any[] }>({
    mutationFn: async ({ args = [], ...data }) => {
      const route = routeFn(...args);
      const url = resolveUrl(route);

      const response = await api.request<TData>({
        method: method.toLowerCase(),
        url,
        data,
      });

      return response.data;
    },
    onSuccess: (data) => {
      options?.invalidate?.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [key] });
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
