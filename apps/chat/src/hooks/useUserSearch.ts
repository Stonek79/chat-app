import useSWR from 'swr';
import { useDebounceValue } from './useDebounceValue';
import type { ClientUser } from '@chat-app/core';
import { API_USERS_SEARCH_ROUTE } from '@chat-app/core';

interface UseUserSearchOptions {
    excludeUserIds?: string[];
    limit?: number;
}

interface SearchResponse {
    users: ClientUser[];
}

const fetcher = async (url: string, payload: any) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return response.json();
};

export function useUserSearch(query: string, options: UseUserSearchOptions = {}) {
    const { excludeUserIds = [], limit = 50 } = options;
    const debouncedQuery = useDebounceValue(query, 500);

    // Key is null if we shouldn't fetch (e.g. query is too short if we wanted that, 
    // but here we just depend on debouncedQuery).
    // We include payload in the key so SWR distinguishes requests.
    const key = [API_USERS_SEARCH_ROUTE, debouncedQuery, excludeUserIds, limit];

    const { data, error, isLoading } = useSWR<SearchResponse>(
        key,
        ([url, q, excl, l]) => fetcher(url, { query: q, excludeUserIds: excl, limit: l }),
        {
            keepPreviousData: true, // Keep showing previous list while fetching new one
            revalidateOnFocus: false, // Don't revalidate on window focus for search
        }
    );

    return {
        users: data?.users || [],
        isLoading,
        isError: error,
    };
}
