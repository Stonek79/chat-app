import type {
    ChatWithDetails,
    DisplayMessage,
    ChatParticipantInfo,
    ClientUser,
    ChatListItem,
} from '@chat-app/core';
import type { MessageContentType } from '@chat-app/db';

// --- ИНТЕРФЕЙСЫ СОСТОЯНИЯ ---

export interface ActiveChatState {
    activeChatDetails: ChatWithDetails | null;
    activeChatMessages: DisplayMessage[];
    activeChatParticipants: ChatParticipantInfo[];
    activeChatLoading: boolean;
    hasMoreMessages: boolean;
    nextMessageCursor: string | null;
    replyToMessage: DisplayMessage | null;
    messageToEdit: DisplayMessage | null;
}

export interface UserSlice {
    currentUser: ClientUser | null;
    isLoading: boolean; // Global loading (auth/initial)
    error: string | null;
    setCurrentUser: (user: ClientUser | null) => void;
    setAuthLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export interface ChatSlice {
    chats: ChatListItem[];
    isLoading: boolean;
    error: string | null;
    chatsNextCursor: string | null;
    hasMoreChats: boolean;
    isChatsLoadingMore: boolean;

    fetchChats: () => Promise<void>;
    loadMoreChats: () => Promise<void>;
    addChat: (chat: ChatListItem) => void;
    removeChat: (chatId: string) => void;
    updateLastMessage: (chatId: string, message: DisplayMessage) => void;
    incrementUnreadCount: (chatId: string) => void;
    resetUnreadCount: (chatId: string) => void;
}

export interface ActiveChatSlice {
    activeChat: ActiveChatState;
    typingUsers: string[]; // List of usernames who are typing
    isLoadingMore: boolean;
    
    // Actions
    fetchActiveChat: (chatId: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    editMessage: (
        messageId: string,
        newContent: string,
        newMediaUrl?: string,
        newContentType?: MessageContentType
    ) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    clearActiveChat: () => void;
    markAsRead: (messageId: string) => void;
    setReplyToMessage: (message: DisplayMessage | null) => void;
    clearReplyToMessage: () => void;
    setMessageToEdit: (message: DisplayMessage | null) => void;
    
    // Low-level socket actions
    addMessage: (message: DisplayMessage) => void;
    updateMessage: (messageId: string, updatedFields: Partial<DisplayMessage>) => void;
    removeMessage: (messageId: string) => void;
    updateUserStatus: (userId: string, isOnline: boolean, lastSeenAt: string | null) => void;
    setTypingUser: (username: string, isTyping: boolean) => void;
}

export type ChatStore = UserSlice & ChatSlice & ActiveChatSlice;
