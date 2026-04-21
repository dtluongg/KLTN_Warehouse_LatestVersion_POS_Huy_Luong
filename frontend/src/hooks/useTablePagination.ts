import { useState, useEffect, useCallback } from 'react';
import { axiosClient } from '../api/axiosClient';

export interface PaginationState {
    page: number;
    size: number;
    sortBy: string;
    direction: 'asc' | 'desc';
    keyword: string;
    filters?: Record<string, any>;
}

export interface PageResponse<T> {
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export function useTablePagination<T>(apiUrl: string, defaultSort = 'id') {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Spring boot uses 0-based indexing for pages
    const [pageState, setPageState] = useState<PaginationState>({
        page: 0,
        size: 15,
        sortBy: defaultSort,
        direction: 'desc',
        keyword: '',
        filters: {}
    });

    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const buildQueryString = (state: PaginationState) => {
        const params = new URLSearchParams();
        params.append('page', state.page.toString());
        params.append('size', state.size.toString());
        params.append('sortBy', state.sortBy);
        params.append('direction', state.direction);
        if (state.keyword) {
            params.append('keyword', state.keyword);
        }
        if (state.filters) {
            Object.entries(state.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        return params.toString();
    };

    const fetchData = useCallback(async (isRefresh = false, overrideState?: Partial<PaginationState>) => {
        try {
            if (!isRefresh) setLoading(true);
            const currentState = { ...pageState, ...overrideState };
            
            const queryString = buildQueryString(currentState);
            const separator = apiUrl.includes('?') ? '&' : '?';
            const hitUrl = `${apiUrl}${separator}${queryString}`;

            const res = await axiosClient.get(hitUrl);
            
            if (res.data && Array.isArray(res.data.content)) {
                // Paginated Fallback (Page<T>)
                setData(res.data.content);
                setTotalPages(res.data.totalPages || 1);
                setTotalElements(res.data.totalElements || res.data.content.length);
            } else if (Array.isArray(res.data)) {
                // Unpaginated Fallback
                setData(res.data);
                setTotalPages(1);
                setTotalElements(res.data.length);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(`Error fetching ${apiUrl}:`, error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl, pageState]);

    useEffect(() => {
        fetchData();
    }, [pageState.page, pageState.size, pageState.sortBy, pageState.direction, pageState.filters, fetchData]);

    const setPage = useCallback((page: number) => setPageState(prev => ({ ...prev, page })), []);
    
    const setSize = useCallback((size: number) => setPageState(prev => ({ ...prev, size, page: 0 })), []);
    
    const setSort = useCallback((sortBy: string) => setPageState(prev => ({
        ...prev,
        sortBy,
        direction: prev.sortBy === sortBy && prev.direction === 'desc' ? 'asc' : 'desc',
        page: 0
    })), []);
    
    const search = useCallback((keyword: string) => {
        setPageState(prev => ({ ...prev, keyword, page: 0 }));
        fetchData(false, { keyword, page: 0 });
    }, [fetchData]);

    const setFilters = useCallback((filters: Record<string, any>) => {
        setPageState(prev => ({ ...prev, filters, page: 0 }));
    }, []);

    const refresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    return {
        data,
        loading,
        refreshing,
        pageState,
        totalPages,
        totalElements,
        setPage,
        setSize,
        setSort,
        search,
        setFilters,
        refresh
    };
}
