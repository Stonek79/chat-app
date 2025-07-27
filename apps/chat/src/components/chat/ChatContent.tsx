'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { Alert, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import type { DisplayMessage } from '@chat-app/core';
import { UI_MESSAGES } from '@chat-app/core';
import { useActiveChatData, useChatActions, useChatLifecycle, useSocketConnection } from '@/hooks';
import { ChatHeader } from './ChatHeader';
import { MessageInput, ChatMessagesList } from './message';
import { ConfirmationModal } from '@/components';
import { ScrollToBottomButton } from './ScrollToBottomButton';

interface ChatContentProps {
    chatId: string;
}

export const ChatContent = ({ chatId }: ChatContentProps) => {
    const theme = useTheme();
    const { isConnected } = useSocketConnection();

    // 1. Получаем данные
    const {
        messages,
        participants,
        details,
        isLoading,
        isLoadingMore,
        hasMoreMessages,
    } = useActiveChatData();

    // 2. Получаем экшены
    const {
        fetchActiveChat,
        clearActiveChat,
        resetUnreadCount,
        loadMoreMessages,
        sendMessage,
        editMessage,
        deleteMessage,
    } = useChatActions();

    // 3. Управляем жизненным циклом (сокеты и загрузка данных)
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
    const [messageToEdit, setMessageToEdit] = useState<DisplayMessage | null>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleDeleteRequest = (id: string, permanent = false) =>
        setMessageToDelete({ id, permanent });
    const handleCancelDelete = () => setMessageToDelete(null);
    const handleEditRequest = (message: DisplayMessage) => setMessageToEdit(message);
    const handleCancelEdit = () => setMessageToEdit(null);

    const handleEditMessage = (messageId: string, content: string) => {
        editMessage(messageId, content);
        setMessageToEdit(null);
    };

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
                position: 'relative',
                backgroundColor: theme.palette.background.default,
            }}
        >
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
            <ChatMessagesList
                chatId={chatId}
                messages={messages}
                participants={participants}
                hasMoreMessages={hasMoreMessages}
                isLoadingMore={isLoadingMore}
                loadMoreMessages={loadMoreMessages}
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
            />
            <ScrollToBottomButton
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
            />
            <MessageInput
                onSendMessage={sendMessage}
                isConnected={isConnected}
                onEditMessage={handleEditMessage}
                onCancelEdit={handleCancelEdit}
                messageToEdit={messageToEdit}
            />
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
