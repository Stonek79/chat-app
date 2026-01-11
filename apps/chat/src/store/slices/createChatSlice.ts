import { StateCreator } from 'zustand';
import { ChatStore, ChatSlice } from '../types';
import { ChatApi } from '@/lib/api/chatApi';

export const createChatSlice: StateCreator<ChatStore, [], [], ChatSlice> = (set, get) => ({
    chats: [],
    isLoading: false,
    error: null,
    chatsNextCursor: null,
    hasMoreChats: true,
    isChatsLoadingMore: false,

    fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
            const { chats, nextCursor } = await ChatApi.getAllChats();
            set({ 
                chats: chats || [], 
                chatsNextCursor: nextCursor, 
                hasMoreChats: !!nextCursor,
                isLoading: false 
            });
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Неизвестная ошибка';
            console.error('[ChatStore] Ошибка при загрузке чатов:', e);
            set({ error, isLoading: false });
        }
    },

    loadMoreChats: async () => {
        const { chatsNextCursor, isChatsLoadingMore } = get();
        if (!chatsNextCursor || isChatsLoadingMore) return;

        set({ isChatsLoadingMore: true });
        try {
            const { chats: newChats, nextCursor } = await ChatApi.getAllChats(chatsNextCursor);
            
            set((state) => ({
                chats: [...state.chats, ...newChats],
                chatsNextCursor: nextCursor,
                hasMoreChats: !!nextCursor,
                isChatsLoadingMore: false,
            }));
        } catch (e) {
            console.error('[ChatStore] Ошибка при загрузке дополнительных чатов:', e);
            set({ isChatsLoadingMore: false });
        }
    },

    addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
    
    removeChat: (chatId: string) => set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
    })),

    updateLastMessage: (chatId, message) => {
        set((state) => ({
            chats: state.chats
                .map((chat) => {
                    if (chat.id === chatId) {
                        return { ...chat, lastMessage: message, updatedAt: message.createdAt };
                    }
                    return chat;
                })
                .sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                ),
        }));
    },

    incrementUnreadCount: (chatId) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (chat.id === chatId) {
                    return { ...chat, unreadCount: (chat.unreadCount ?? 0) + 1 };
                }
                return chat;
            }),
        }));
    },

    resetUnreadCount: (chatId) => {
        set((state) => ({
            chats: state.chats.map((chat) => {
                if (chat.id === chatId) {
                    return { ...chat, unreadCount: 0 };
                }
                return chat;
            }),
        }));
    },
});
