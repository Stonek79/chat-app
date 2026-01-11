import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CHAT_PAGE_ROUTE } from '@chat-app/core';
import { ChatApi } from '@/lib/api/chatApi';

interface UseChatDeletionProps {
    chatId: string;
    removeChat: (id: string) => void;
    deleteMessage: (id: string) => void;
}

export const useChatDeletion = ({ chatId, removeChat, deleteMessage }: UseChatDeletionProps) => {
    const router = useRouter();
    const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);
    
    // Message delete state
    const [messageToDelete, setMessageToDelete] = useState<{
        id: string;
        permanent: boolean;
    } | null>(null);

    // Chat Deletion Logic
    const handleRequestDeleteChat = useCallback(() => setIsDeleteChatModalOpen(true), []);
    const handleCloseDeleteChatModal = useCallback(() => setIsDeleteChatModalOpen(false), []);

    const handleConfirmDeleteChat = useCallback(async () => {
        try {
            await ChatApi.deleteChat(chatId);
            removeChat(chatId);
            setIsDeleteChatModalOpen(false);
            router.push(CHAT_PAGE_ROUTE);
        } catch (error) {
            console.error('Failed to delete chat:', error);
            setIsDeleteChatModalOpen(false);
        }
    }, [chatId, removeChat, router]);

    // Message Deletion Logic
    const handleCancelDeleteMessage = useCallback(() => setMessageToDelete(null), []);
    
    const handleConfirmDeleteMessage = useCallback(() => {
        if (messageToDelete) {
            deleteMessage(messageToDelete.id);
            setMessageToDelete(null);
        }
    }, [deleteMessage, messageToDelete]);

    return {
        messageToDelete,
        setMessageToDelete,
        isDeleteChatModalOpen,
        handleRequestDeleteChat,
        handleCloseDeleteChatModal,
        handleConfirmDeleteChat,
        handleCancelDeleteMessage,
        handleConfirmDeleteMessage,
    };
};
