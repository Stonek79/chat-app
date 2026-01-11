import {
    API_CHATS_ROUTE,
    API_MESSAGES_ROUTE,
    chatListResponseSchema,
    chatMessagesResponseSchema,
    getChatMessagesRoute,
} from '@chat-app/core';
import { MessageContentType } from '@chat-app/db';
import { fetchChat } from '../fetch/fetchChat';

export const ChatApi = {
    getAllChats: async (cursor?: string | null) => {
        const url = new URL(API_CHATS_ROUTE, window.location.origin);
        if (cursor) {
            url.searchParams.set('cursor', cursor);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Не удалось загрузить чаты');
        const data = await response.json();
        return chatListResponseSchema.parse(data);
    },

    getChatDetails: async (chatId: string) => {
        return fetchChat(chatId);
    },

    getMessages: async (chatId: string, params: { anchorId?: string; cursor?: string } = {}) => {
        const url = new URL(getChatMessagesRoute(chatId), window.location.origin);
        
        if (params.anchorId) {
            url.searchParams.set('anchorId', params.anchorId);
        }
        if (params.cursor) {
            url.searchParams.set('cursor', params.cursor);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch messages: ${response.status} ${errorText}`);
        }
        
        const json = await response.json();
        return chatMessagesResponseSchema.parse(json);
    },

    editMessage: async (
        messageId: string,
        fields: { content: string; mediaUrl?: string | null; contentType?: MessageContentType }
    ) => {
        const response = await fetch(`${API_MESSAGES_ROUTE}/${messageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
        });
        
        if (!response.ok) {
            throw new Error('Failed to edit message');
        }
        return true;
    },

    deleteMessage: async (messageId: string) => {
        const response = await fetch(`${API_MESSAGES_ROUTE}/${messageId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => null);
             throw new Error(errorData?.error || 'Unknown API error during delete');
        }
        return true;
    },

    deleteChat: async (chatId: string) => {
        const response = await fetch(`${API_CHATS_ROUTE}/${chatId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Failed to delete chat');
        }
        return true;
    }
};
