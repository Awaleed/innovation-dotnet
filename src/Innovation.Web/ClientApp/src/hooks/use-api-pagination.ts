import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

const DEFAULT_ORDER_BY = 'createdAt desc';
const DEFAULT_PAGE_SIZE = 15;

interface UseApiPaginationOptions<TFilters extends Record<string, any>> {
    /** Base URL for API endpoint */
    endpoint: string;
    /** Default order by (e.g., 'createdAt desc') */
    defaultOrderBy?: string;
    /** Default page size */
    defaultPageSize?: number;
    /** Query key base for React Query cache */
    queryKeyBase: readonly string[];
    /** Initial filters to apply */
    initialFilters?: Partial<TFilters>;
    /** React Query options */
    queryOptions?: { enabled?: boolean; staleTime?: number; gcTime?: number };
}

/** Matches .NET PaginatedResponse<T> */
export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface UseApiPaginationReturn<TData, TFilters extends Record<string, any>> {
    data: TData[];
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    refetch: () => void;

    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;

    orderBy: string;
    filter: TFilters;

    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    setOrderBy: (field: string, direction?: 'asc' | 'desc') => void;
    setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K] | null) => void;
    removeFilter: <K extends keyof TFilters>(key: K) => void;
    clearFilter: () => void;
    reset: () => void;
}

/**
 * Builds a Gridify filter string from a filters object.
 * Example: { status: "Open", featured: true } => "status=Open,featured=true"
 */
function buildGridifyFilter(filters: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes('=')) {
                parts.push(`${key}${value}`);
            } else {
                parts.push(`${key}=${value}`);
            }
        }
    }
    return parts.join(',');
}

export function useApiPagination<TData, TFilters extends Record<string, any> = Record<string, any>>({
    endpoint,
    defaultOrderBy = DEFAULT_ORDER_BY,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    queryKeyBase,
    initialFilters = {} as Partial<TFilters>,
    queryOptions = {},
}: UseApiPaginationOptions<TFilters>): UseApiPaginationReturn<TData, TFilters> {
    const [queryState, setQueryState] = useQueryStates(
        {
            orderBy: parseAsString.withDefault(defaultOrderBy),
            page: parseAsInteger.withDefault(1),
            pageSize: parseAsInteger.withDefault(defaultPageSize),
        },
        { clearOnDefault: true, shallow: true },
    );

    const [localFilters, setLocalFilters] = useState<TFilters>(initialFilters as TFilters);

    const queryParams = useMemo(() => {
        const params: Record<string, string | number> = {
            page: queryState.page,
            pageSize: queryState.pageSize,
            orderBy: queryState.orderBy,
        };
        const filterStr = buildGridifyFilter(localFilters);
        if (filterStr) params.filter = filterStr;
        return params;
    }, [queryState, localFilters]);

    const {
        data: response,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery({
        queryKey: [...queryKeyBase, 'list', queryParams],
        queryFn: async () => {
            const res = await axios.get<PaginatedResponse<TData>>(endpoint, { params: queryParams });
            return res.data;
        },
        ...queryOptions,
    });

    const setPage = useCallback((page: number) => setQueryState({ page }), [setQueryState]);
    const setPageSize = useCallback((pageSize: number) => setQueryState({ pageSize, page: 1 }), [setQueryState]);

    const setOrderBy = useCallback(
        (field: string, direction?: 'asc' | 'desc') => {
            const currentField = queryState.orderBy.split(' ')[0];
            const currentDir = queryState.orderBy.includes('desc') ? 'desc' : 'asc';
            const dir = direction || (currentField === field && currentDir === 'asc' ? 'desc' : 'asc');
            setQueryState({ orderBy: `${field} ${dir}`, page: 1 });
        },
        [queryState.orderBy, setQueryState],
    );

    const setFilter = useCallback(
        <K extends keyof TFilters>(key: K, value: TFilters[K] | null) => {
            const newFilters = { ...localFilters };
            if (value === null || value === undefined || value === '') {
                delete newFilters[key];
            } else {
                newFilters[key] = value;
            }
            setLocalFilters(newFilters);
            setQueryState({ page: 1 });
        },
        [localFilters, setQueryState],
    );

    const removeFilter = useCallback(<K extends keyof TFilters>(key: K) => setFilter(key, null), [setFilter]);
    const clearFilter = useCallback(() => { setLocalFilters({} as TFilters); setQueryState({ page: 1 }); }, [setQueryState]);
    const reset = useCallback(() => { setLocalFilters({} as TFilters); setQueryState({ orderBy: null, page: null, pageSize: null }); }, [setQueryState]);

    return {
        data: response?.items ?? [],
        isLoading,
        isFetching,
        error: error as Error | null,
        refetch,
        page: queryState.page,
        pageSize: queryState.pageSize,
        totalPages: response?.totalPages ?? 1,
        totalItems: response?.totalCount ?? 0,
        hasNextPage: response?.hasNextPage ?? false,
        hasPreviousPage: response?.hasPreviousPage ?? false,
        orderBy: queryState.orderBy,
        filter: localFilters,
        setPage, setPageSize, setOrderBy, setFilter, removeFilter, clearFilter, reset,
    };
}
