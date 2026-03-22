import { router } from '@inertiajs/react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_ORDER_BY = 'createdAt desc';
const DEFAULT_PAGE_SIZE = 15;

interface UsePaginationOptions<TField extends string = string> {
    defaultOrderBy?: `${TField} asc` | `${TField} desc` | string;
    defaultPageSize?: number;
}

interface PaginationState {
    filter: Record<string, unknown>;
    orderBy: string;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    page: number;
    pageSize: number;
}

/**
 * Builds a Gridify filter string from a filters object.
 * Example: { status: "Open", featured: true } => "status=Open,featured=true"
 */
function buildGridifyFilter(filters: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.includes('=')) {
                // Already contains operator (e.g. ">=5"), append directly
                parts.push(`${key}${value}`);
            } else {
                parts.push(`${key}=${String(value)}`);
            }
        }
    }
    return parts.join(',');
}

/**
 * Parses a Gridify filter string back into a filters object.
 * Example: "status=Open,featured=true" => { status: "Open", featured: "true" }
 */
function parseGridifyFilter(filterStr: string): Record<string, string> {
    if (!filterStr) return {};
    const result: Record<string, string> = {};
    for (const part of filterStr.split(',')) {
        const eqIndex = part.indexOf('=');
        if (eqIndex > 0) {
            result[part.substring(0, eqIndex)] = part.substring(eqIndex + 1);
        }
    }
    return result;
}

/**
 * Reads Gridify filter from current URL search params.
 */
function getFiltersFromUrl(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return parseGridifyFilter(params.get('filter') ?? '');
}

export function usePagination<TField extends string = string>({ defaultOrderBy = DEFAULT_ORDER_BY, defaultPageSize = DEFAULT_PAGE_SIZE }: UsePaginationOptions<TField> = {}) {
    const [queryState, setQueryState] = useQueryStates(
        {
            orderBy: parseAsString.withDefault(defaultOrderBy),
            page: parseAsInteger.withDefault(1),
            pageSize: parseAsInteger.withDefault(defaultPageSize),
        },
        {
            clearOnDefault: true,
            shallow: true,
        },
    );

    const [localFilters, setLocalFilters] = useState<Record<string, unknown>>(() => getFiltersFromUrl());

    const prevQueryStateRef = useRef(queryState);
    const isInitialRender = useRef(true);

    // Parse "createdAt desc" into field + direction
    const orderByParts = queryState.orderBy.split(' ');
    const sortField = orderByParts[0] ?? defaultOrderBy.split(' ')[0] ?? 'createdAt';
    const sortDirection: 'asc' | 'desc' = (orderByParts[1] as 'asc' | 'desc') ?? 'asc';

    const navigateToServer = useCallback((params: Record<string, unknown>) => {
        // Build flat query params for Gridify
        const queryParams: Record<string, string | number> = {
            page: params.page as number,
            pageSize: params.pageSize as number,
            orderBy: params.orderBy as string,
        };

        const filterStr = buildGridifyFilter((params.filter as Record<string, unknown>) ?? {});
        if (filterStr) {
            queryParams.filter = filterStr;
        }

        router.get(window.location.pathname, queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    // Navigate to server when query state changes
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            prevQueryStateRef.current = queryState;
            return;
        }

        const hasChanged = JSON.stringify(prevQueryStateRef.current) !== JSON.stringify(queryState);

        if (hasChanged) {
            prevQueryStateRef.current = queryState;
            navigateToServer({
                orderBy: queryState.orderBy,
                page: queryState.page,
                pageSize: queryState.pageSize,
                filter: localFilters,
            });
        }
    }, [queryState, navigateToServer, localFilters]);

    const setPage = useCallback((page: number) => setQueryState({ page }), [setQueryState]);

    const setPerPage = useCallback(
        (pageSize: number) => {
            setQueryState({
                pageSize,
                page: 1,
            });
        },
        [setQueryState],
    );

    const setSort = useCallback(
        (field: string, direction?: 'asc' | 'desc') => {
            const dir = direction || (sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
            setQueryState({
                orderBy: `${field} ${dir}`,
                page: 1,
            });
        },
        [sortField, sortDirection, setQueryState],
    );

    const setFilter = useCallback(
        (key: string, value: unknown) => {
            const currentFilters = { ...localFilters };

            if (value === null || value === undefined || value === '') {
                delete currentFilters[key];
            } else {
                currentFilters[key] = value;
            }

            setLocalFilters(currentFilters);

            navigateToServer({
                orderBy: queryState.orderBy,
                page: 1,
                pageSize: queryState.pageSize,
                filter: currentFilters,
            });

            setQueryState({ page: 1 });
        },
        [queryState.orderBy, queryState.pageSize, localFilters, navigateToServer, setQueryState],
    );

    const removeFilter = useCallback((key: string) => setFilter(key, null), [setFilter]);

    const clearFilter = useCallback(() => {
        setLocalFilters({});

        navigateToServer({
            orderBy: queryState.orderBy,
            page: 1,
            pageSize: queryState.pageSize,
            filter: {},
        });

        setQueryState({ page: 1 });
    }, [queryState.orderBy, queryState.pageSize, navigateToServer, setQueryState]);

    const reset = useCallback(() => {
        setLocalFilters({});
        setQueryState({ orderBy: null, page: null, pageSize: null });
    }, [setQueryState]);

    const paginationState: PaginationState = {
        filter: localFilters,
        orderBy: queryState.orderBy,
        sortField,
        sortDirection,
        page: queryState.page,
        pageSize: queryState.pageSize,
    };

    return {
        ...paginationState,
        setPage,
        setPerPage,
        setSort,
        reset,
        getFiltersFromUrl,
        setFilter,
        removeFilter,
        clearFilter,
    };
}
