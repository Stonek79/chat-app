'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { UserRole } from '@chat-app/db';
import { useAuth, useChat, useInitialScroll, useLoadMoreOnScroll, useMobile } from '@/hooks';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './message';
import { MessageInput } from './MessageInput';
import { ConfirmationModal } from '@/components';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { UI_MESSAGES } from '@chat-app/core';
import { useTheme } from '@mui/material/styles';

interface ChatContentProps {
    chatId: string;
}

export const ChatContent = ({ chatId }: ChatContentProps) => {
    const {
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
        firstUnreadId,
        deleteMessage,
    } = useChat({ chatId });

    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMobile();

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLElement>>(new Map());

    const setMessageRef = useCallback((id: string, node: HTMLElement | null) => {
        if (node) {
            messageRefs.current.set(id, node);
        } else {
            messageRefs.current.delete(id);
        }
    }, []);

    const getMessageRef = useCallback((id: string) => {
        return messageRefs.current.get(id);
    }, []);

    const loaderRef = useLoadMoreOnScroll({
        hasMoreMessages,
        isLoadingMore,
        loadMoreMessages,
        messagesContainerRef,
    });

    useInitialScroll({
        chatId,
        initialMessagesLoaded,
        firstUnreadId,
        messagesContainerRef,
        getMessageRef,
        messagesEndRef,
    });

    const handleDeleteRequest = (id: string) => setMessageToDelete(id);
    const handleCancelDelete = () => setMessageToDelete(null);
    const handleEditRequest = (message: any) => console.log('Edit:', message);

    const handleConfirmDelete = useCallback(() => {
        if (messageToDelete) {
            deleteMessage(messageToDelete);
            setMessageToDelete(null);
        }
    }, [deleteMessage, messageToDelete]);

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

    if (!chatDetails) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Выберите чат, чтобы начать общение.</Typography>
            </Box>
        );
    }

    const getStatus = () => {
        if (chatDetails.isGroupChat) return `${participants.length} участника(ов)`;
        return 'в сети';
    };

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
                chatName={chatDetails.name || UI_MESSAGES.UNNAMED_CHAT}
                chatAvatarUrl={chatDetails.avatarUrl || ''}
                status={getStatus()}
            />
            {!isConnected && (
                <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
                    Соединение потеряно...
                </Alert>
            )}
            <Box ref={messagesContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {hasMoreMessages && (
                    <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
                {messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const prevMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];
                        const isSameSender =
                            !!prevMessage && prevMessage.sender.id === msg.sender.id;
                        const isNextMessageFromSameSender =
                            !!nextMessage && nextMessage.sender.id === msg.sender.id;
                        return (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                currentUserId={currentUser?.id || ''}
                                ref={node => setMessageRef(msg.id, node)}
                                onDelete={handleDeleteRequest}
                                onEdit={handleEditRequest}
                                isGroupChat={chatDetails.isGroupChat}
                                isSameSender={isSameSender}
                                isAdmin={isAdmin}
                                participantsCount={participants.length}
                                isCurrentUser={msg.senderId === currentUser?.id}
                                isMobile={isMobile}
                                isNextMessageFromSameSender={isNextMessageFromSameSender}
                            />
                        );
                    })
                ) : (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                        Сообщений пока нет.
                    </Typography>
                )}
                <div ref={messagesEndRef} />
            </Box>
            <ScrollToBottomButton
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
            />
            <MessageInput onSendMessage={sendMessage} isConnected={isConnected} />
            <ConfirmationModal
                open={!!messageToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Удалить сообщение?"
                description="Вы уверены, что хотите удалить это сообщение? Это действие нельзя будет отменить."
                confirmButtonText="Удалить"
            />
        </Box>
    );
};
