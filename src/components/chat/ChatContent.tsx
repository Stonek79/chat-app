'use client';

import React, { useCallback, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';

import { useChat } from '@/hooks';
import { useMessageListScrollAndView } from '@/hooks';
import type { DisplayMessage } from '@/types';

import { ConfirmationModal } from '../common';

import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './message';
import { MessageInput } from './MessageInput';

interface ChatContentProps {
    chatId: string;
    currentUserId: string;
    isAdmin: boolean;
}

export const ChatContent = ({ chatId, currentUserId, isAdmin }: ChatContentProps) => {
    const {
        messages,
        participants,
        sendMessage,
        isConnected,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        markMessagesAsRead,
        deleteMessage,
    } = useChat({ chatId });

    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    const handleMessageView = useCallback(
        (messageId: string) => {
            markMessagesAsRead(messageId);
        },
        [markMessagesAsRead]
    );

    const { messagesContainerRef, messagesEndRef, setMessageRef } = useMessageListScrollAndView({
        messages,
        currentUserId,
        loading: isLoadingChatDetails || !initialMessagesLoaded,
        onMessageView: handleMessageView,
        initialMessagesLoaded,
        chatId,
    });

    const handleEditMessage = useCallback((message: DisplayMessage) => {
        console.log('Edit click', message); /* TODO: Реализовать логику редактирования */
    }, []);

    const handleDeleteRequest = useCallback((messageId: string) => {
        setMessageToDelete(messageId);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (messageToDelete) {
            deleteMessage(messageToDelete);
            setMessageToDelete(null);
        }
    }, [deleteMessage, messageToDelete]);

    const handleCancelDelete = () => {
        setMessageToDelete(null);
    };

    if (isLoadingChatDetails && !initialMessagesLoaded) {
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

    const getStatus = () => {
        if (!chatDetails) return '';
        if (chatDetails.isGroupChat) {
            return `${participants.length} участника(ов)`;
        }
        // TODO: Добавить логику статуса "в сети"
        return 'не в сети';
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <ChatHeader
                chatName={chatDetails?.name || 'Загрузка...'}
                chatAvatarUrl={chatDetails?.avatarUrl}
                status={getStatus()}
            />
            {!isConnected && (
                <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
                    Соединение с сервером чата потеряно. Попытка переподключения...
                </Alert>
            )}
            <Box
                ref={messagesContainerRef}
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {messages.length === 0 && isConnected && (
                    <Box sx={{ m: 'auto', textAlign: 'center', color: 'text.secondary' }}>
                        Сообщений пока нет. Начните общение!
                    </Box>
                )}
                {messages.map((message, i) => {
                    const isSameSender = message?.sender?.id === messages[i - 1]?.sender?.id;

                    return (
                        <div
                            key={message.id}
                            ref={el => setMessageRef(String(message.id), el)}
                            data-message-id={String(message.id)}
                        >
                            <ChatMessage
                                isSameSender={isSameSender}
                                message={message}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                onEdit={handleEditMessage}
                                onDelete={handleDeleteRequest}
                                isGroupChat={chatDetails?.isGroupChat ?? false}
                            />
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>
            <MessageInput onSendMessage={sendMessage} isConnected={isConnected} />
            <ConfirmationModal
                open={!!messageToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                description="Вы уверены, что хотите удалить это сообщение? Это действие нельзя будет отменить."
                confirmButtonText="Удалить"
            />
        </Box>
    );
};
