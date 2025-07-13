import type { ChatParticipantInfo, ChatWithDetails, DisplayMessage } from '@chat-app/core';
import type { MessageContentType } from '@chat-app/db';

import { useChatActions } from './useChat/useChatActions';
import { useChatData } from './useChat/useChatData';
import { useChatEventHandlers } from './useChat/useChatEventHandlers';
import { useChatSocket } from './useChat/useChatSocket';
import { useAuth } from './useAuth';

export interface UseChatReturn {
    messages: DisplayMessage[];
    participants: ChatParticipantInfo[];
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    isConnected: boolean;
    chatDetails: ChatWithDetails | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
    hasMoreMessages: boolean;
    loadMoreMessages: () => Promise<void>;
    isLoadingMore: boolean;
    markMessagesAsRead: (lastReadMessageId: string) => void;
    deleteMessage: (messageId: string) => Promise<void>;
    firstUnreadId: string | null;
}

export const useChat = ({ chatId }: { chatId: string | null }): UseChatReturn => {
    const { user } = useAuth();

    if (!user) {
        throw new Error('User is not authenticated');
    }

    const { socket, isConnected } = useChatSocket(chatId);

    const { sendMessage, deleteMessage, markMessagesAsRead } = useChatActions({
        socket,
        chatId,
        currentUserId: user?.id || '',
    });

    const {
        messages,
        participants,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        hasMoreMessages,
        loadMoreMessages,
        isLoadingMore,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
        firstUnreadId,
    } = useChatData({
        chatId,
        socket,
        currentUserId: user!.id,
    });

    // Обработка сокет-событий
    useChatEventHandlers({
        socket,
        chatId,
        userId: user?.id || null,
        initialMessagesLoaded,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
    });

    return {
        messages,
        participants,
        sendMessage,
        isConnected,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        hasMoreMessages,
        loadMoreMessages,
        isLoadingMore,
        markMessagesAsRead,
        deleteMessage,
        firstUnreadId,
    };
};
