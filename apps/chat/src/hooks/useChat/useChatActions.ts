import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/vanilla/shallow';

/**
 * Хук, предоставляющий ВСЕ экшены для взаимодействия с чатом.
 */
export const useChatActions = () => {
    return useChatStore(
        state => ({
            fetchChats: state.fetchChats,
            addChat: state.addChat,
            updateLastMessage: state.updateLastMessage,
            incrementUnreadCount: state.incrementUnreadCount,
            resetUnreadCount: state.resetUnreadCount,
            fetchActiveChat: state.fetchActiveChat,
            loadMoreMessages: state.loadMoreMessages,
            sendMessage: state.sendMessage,
            editMessage: state.editMessage,
            deleteMessage: state.deleteMessage,
            clearActiveChat: state.clearActiveChat,
            markAsRead: state.markAsRead,
        }),
        shallow
    );
};
