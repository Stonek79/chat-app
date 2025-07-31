'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { Alert, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import type { DisplayMessage } from '@chat-app/core';
import { UI_MESSAGES } from '@chat-app/core';
import { useChatLifecycle, useSocketConnection } from '@/hooks';
import { ChatHeader } from './content/ChatHeader';
import { ChatContentInput } from './content/ChatContentInput';
import { ChatMessagesList } from './message';
import { ConfirmationModal } from '@/components';
import { ScrollToBottomButton } from './content/ScrollToBottomButton';
import { shallow } from 'zustand/shallow';
import useChatStore from '@/store/chatStore';

interface ChatContentProps {
    chatId: string;
}

export const ChatContent = ({ chatId }: ChatContentProps) => {
    const theme = useTheme();
    const { isConnected } = useSocketConnection();

    const {
        messages,
        participants,
        details,
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
    } = useChatStore(
        state => ({
            messages: state.activeChat.activeChatMessages,
            participants: state.activeChat.activeChatParticipants,
            details: state.activeChat.activeChatDetails,
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
        }),
        shallow
    );

    // Управляем жизненным циклом (сокеты и загрузка данных)
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

    const [messageToDelete, setMessageToDelete] = useState<{
        id: string;
        permanent: boolean;
    } | null>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Если мы находимся внизу чата, плавно доскроллим,
        // чтобы компенсировать изменение высоты поля ввода.
        const container = messagesContainerRef.current;
        if (container) {
            const isScrolledToBottom =
                container.scrollHeight - container.scrollTop <= container.clientHeight + 150; // 150px - буфер

            if (isScrolledToBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [replyToMessage, messageToEdit]);

    const handleCancelDelete = () => setMessageToDelete(null);

    const handleConfirmDelete = useCallback(() => {
        if (messageToDelete) {
            deleteMessage(messageToDelete.id);
            setMessageToDelete(null);
        }
    }, [deleteMessage, messageToDelete]);

    if (isLoading && messages.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!details) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Выберите чат, чтобы начать общение.</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100vh',
                position: 'relative',
                backgroundColor: theme.palette.background.default,
            }}
        >
            <Box sx={{ flexShrink: 0 }}>
                <ChatHeader
                    chatName={details.name || UI_MESSAGES.UNNAMED_CHAT}
                    chatAvatarUrl={details.avatarUrl || ''}
                    status={`${participants.length} участника(ов)`}
                />
                {!isConnected && (
                    <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
                        Соединение потеряно...
                    </Alert>
                )}
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    position: 'relative',
                }}
            >
                <ChatMessagesList
                    chatId={chatId}
                    messages={messages}
                    participants={participants}
                    hasMoreMessages={hasMoreMessages}
                    isLoadingMore={isLoadingMore}
                    loadMoreMessages={loadMoreMessages}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                />
                <ScrollToBottomButton
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                />
            </Box>
            <ChatContentInput />
            <ConfirmationModal
                open={!!messageToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Удалить сообщение?"
                description={
                    messageToDelete?.permanent
                        ? 'Это действие нельзя будет отменить.'
                        : 'Вы уверены, что хотите удалить это сообщение?'
                }
                confirmButtonText="Удалить"
            />
        </Box>
    );
};
