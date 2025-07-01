import type {
    ClientChat,
    ClientChatParticipant,
    DisplayMessage,
    MessageContentType,
} from '@/types';

import { useAuth } from './useAuth';
import { useChatSocket } from './useChat/useChatSocket';
import { useChatData } from './useChat/useChatData';
import { useChatEventHandlers } from './useChat/useChatEventHandlers';
import { useChatActions } from './useChat/useChatActions';

export interface UseChatReturn {
    messages: DisplayMessage[];
    participants: ClientChatParticipant[];
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    isConnected: boolean;
    chatDetails: ClientChat | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
    markMessagesAsRead: (lastReadMessageId: string) => void;
    deleteMessage: (messageId: string) => Promise<void>;
}

export const useChat = ({ chatId }: { chatId: string | null }): UseChatReturn => {
    const { user } = useAuth();

    // Всегда вызываем хуки в одинаковом порядке
    const { socket, isConnected } = useChatSocket(chatId);

    // Передаем пустую строку как fallback для currentUserId, хуки обработают это корректно
    const {
        messages,
        participants,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
    } = useChatData({ chatId, socket, currentUserId: user?.id || '' });

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

    // Действия пользователя
    const { sendMessage, deleteMessage, markMessagesAsRead } = useChatActions({
        socket,
        chatId,
        userId: user?.id || null,
    });

    // Возвращаем пустое состояние, если пользователь не авторизован
    if (!user?.id) {
        return {
            messages: [],
            participants: [],
            sendMessage: () => {},
            isConnected: false,
            chatDetails: null,
            isLoadingChatDetails: false,
            initialMessagesLoaded: false,
            markMessagesAsRead: () => {},
            deleteMessage: async () => {},
        };
    }

    return {
        messages,
        participants,
        sendMessage,
        isConnected,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        markMessagesAsRead,
        deleteMessage,
    };
};
