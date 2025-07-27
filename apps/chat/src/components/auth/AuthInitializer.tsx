'use client';

import useSWR from 'swr';
import { useEffect } from 'react';
import useChatStore from '@/store/chatStore';
import { API_AUTH_ME_ROUTE, AuthResponse } from '@chat-app/core';
import { fetchChat, fetcher } from '@/lib';
import { shallow } from 'zustand/vanilla/shallow';

/**
 * Этот компонент отвечает только за одно: запуск начального запроса
 * для получения данных пользователя и их синхронизацию с Zustand.
 * Он не рендерит ничего в DOM.
 */
export function AuthInitializer() {
    // const setCurrentUser = useChatStore(state => state.setCurrentUser);
    const { setCurrentUser, setAuthLoading, fetchChats } = useChatStore(
        state => ({
            setCurrentUser: state.setCurrentUser,
            setAuthLoading: state.setAuthLoading,
            fetchChats: state.fetchChats,
        }),
        shallow
    );
    
    const { data, isLoading } = useSWR<AuthResponse | null>(API_AUTH_ME_ROUTE, fetcher, {
        shouldRetryOnError: false,
    });

    useEffect(() => {
        setAuthLoading(true);

        if (!isLoading) {
            setCurrentUser(data?.user ?? null);
            data?.user && fetchChats();
            setAuthLoading(false);
        }
    }, [data, isLoading, setCurrentUser, setAuthLoading]);

    return null; // Этот компонент не должен ничего рендерить
}
