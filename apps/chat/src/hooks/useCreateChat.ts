'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_CHATS_CREATE_ROUTE, CHAT_PAGE_ROUTE, type ChatWithDetails } from '@chat-app/core';
import useChatStore from '@/store/chatStore';
import { useSWRConfig } from 'swr';
import { API_CHATS_ROUTE } from '@chat-app/core';

export interface CreateChatPayload {
    name?: string;
    isGroupChat: boolean;
    participantIds: string[];
}

export function useCreateChat() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { addChat } = useChatStore();
    const { mutate } = useSWRConfig();

    const createChat = async (payload: CreateChatPayload): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(API_CHATS_CREATE_ROUTE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: 'Не удалось создать чат',
                }));
                throw new Error(errorData.message || 'Не удалось создать чат');
            }

            const data = await response.json();
            const chat: ChatWithDetails = data.chat;

            // Обновляем список чатов в сторе
            addChat(chat);

            // Инвалидируем кэш SWR
            await mutate(API_CHATS_ROUTE);

            // Перенаправляем на созданный чат
            router.push(`${CHAT_PAGE_ROUTE}/${chat.id}`);

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(errorMessage);
            console.error('Error creating chat:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createChat,
        isLoading,
        error,
    };
}

