// src/store/chatStore.ts
import { create } from 'zustand';
import type { ChatWithDetails, DisplayMessage } from '@chat-app/core';
import { API_CHATS_ROUTE } from '@chat-app/core';

interface ChatState {
    chats: ChatWithDetails[];
    isLoading: boolean;
    error: string | null;
}

interface ChatActions {
    fetchChats: () => Promise<void>;
    addChat: (chat: ChatWithDetails) => void;
    updateLastMessage: (chatId: string, message: DisplayMessage) => void;
    incrementUnreadCount: (chatId: string) => void;
    resetUnreadCount: (chatId: string) => void;
}

const useChatStore = create<ChatState & ChatActions>((set, get) => ({
    chats: [],
    isLoading: true,
    error: null,

    fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(API_CHATS_ROUTE);
            if (!response.ok) {
                throw new Error('Не удалось загрузить чаты');
            }
            const { chats } = (await response.json()) as { chats: ChatWithDetails[] };
            set({ chats: chats || [], isLoading: false });
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Произошла неизвестная ошибка';
            set({ error, isLoading: false });
        }
    },

    addChat: chat => {
        set(state => ({
            chats: [chat, ...state.chats],
        }));
    },

    updateLastMessage: (chatId, message) => {
        set(state => ({
            chats: state.chats
                .map(chat => {
                    if (chat.id === chatId) {
                        return { ...chat, lastMessage: message, updatedAt: message.createdAt };
                    }
                    return chat;
                })
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        }));
    },

    incrementUnreadCount: chatId => {
        set(state => ({
            chats: state.chats.map(chat => {
                if (chat.id === chatId) {
                    return { ...chat, unreadCount: (chat.unreadCount ?? 0) + 1 };
                }
                return chat;
            }),
        }));
    },

    resetUnreadCount: chatId => {
        set(state => ({
            chats: state.chats.map(chat => {
                if (chat.id === chatId) {
                    return { ...chat, unreadCount: 0 };
                }
                return chat;
            }),
        }));
    },
}));

export default useChatStore;
