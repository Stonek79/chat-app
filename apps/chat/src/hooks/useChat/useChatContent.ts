import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import useChatStore from '@/store/chatStore';
import { useChatLifecycle } from '@/hooks';
import { useChatScroll } from './useChatScroll';
import { useChatDeletion } from './useChatDeletion';

export const useChatContent = (chatId: string) => {
    const {
        messages,
        participants,
        details,
        currentUser,
        isLoading,
        isLoadingMore,
        hasMoreMessages,
        fetchActiveChat,
        clearActiveChat,
        resetUnreadCount,
        loadMoreMessages,
        deleteMessage,
        replyToMessage,
        messageToEdit,
        removeChat,
        typingUsers,
    } = useChatStore(
        state => ({
            messages: state.activeChat.activeChatMessages,
            participants: state.activeChat.activeChatParticipants,
            details: state.activeChat.activeChatDetails,
            currentUser: state.currentUser,
            isLoading: state.activeChat.activeChatLoading,
            hasMoreMessages: state.activeChat.hasMoreMessages,
            isLoadingMore: state.isLoadingMore,
            fetchActiveChat: state.fetchActiveChat,
            clearActiveChat: state.clearActiveChat,
            resetUnreadCount: state.resetUnreadCount,
            loadMoreMessages: state.loadMoreMessages,
            deleteMessage: state.deleteMessage,
            replyToMessage: state.activeChat.replyToMessage,
            messageToEdit: state.activeChat.messageToEdit,
            removeChat: state.removeChat,
            typingUsers: state.typingUsers,
        }),
        shallow
    );

    // Lifecycle management
    useChatLifecycle(chatId);

    useEffect(() => {
        if (chatId) {
            fetchActiveChat(chatId);
            resetUnreadCount(chatId);
        }
        return () => {
            clearActiveChat();
        };
    }, [chatId, fetchActiveChat, clearActiveChat, resetUnreadCount]);

    // Scroll handling
    const { messagesContainerRef, messagesEndRef } = useChatScroll({
        messagesLength: messages.length,
        replyToMessageIdentifier: replyToMessage?.id,
        messageToEditIdentifier: messageToEdit?.id,
    });

    // Deletion Logic
    const deletionLogic = useChatDeletion({
        chatId,
        removeChat,
        deleteMessage,
    });

    return {
        // Data
        messages,
        participants,
        details,
        currentUser,
        isLoading,
        isLoadingMore,
        hasMoreMessages,
        typingUsers,
        
        // Actions
        loadMoreMessages,
        
        // Composed Logic
        ...deletionLogic,
        
        // Refs
        messagesContainerRef,
        messagesEndRef,
    };
};
