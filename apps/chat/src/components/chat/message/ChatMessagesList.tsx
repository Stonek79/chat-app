'use client';

import { memo, useRef, useCallback, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { DisplayMessage, ChatParticipantInfo } from '@chat-app/core';
import { ChatParticipantRole } from '@chat-app/db';
import { useLoadMoreOnScroll, useInitialScroll, useAuth, useMessageVisibility } from '@/hooks';
import { ChatMessage } from './ChatMessage';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/shallow';

interface ChatMessagesListProps {
    chatId: string;
    messages: DisplayMessage[];
    participants: ChatParticipantInfo[];
    hasMoreMessages: boolean;
    isLoadingMore: boolean;
    loadMoreMessages: () => Promise<void>;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessagesList = memo(function ChatMessagesList({
    chatId,
    messages,
    participants,
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    messagesContainerRef,
    messagesEndRef,
}: ChatMessagesListProps) {
    const { user: currentUser } = useAuth();
    const { markAsRead } = useChatStore(
        state => ({
            markAsRead: state.markAsRead,
        }),
        shallow
    );
    const userRole =
        participants.find(p => p.userId === currentUser?.id)?.role || ChatParticipantRole.MEMBER;

    const loaderRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLElement>>(new Map());

    const { observe } = useMessageVisibility({
        onVisible: markAsRead,
        root: messagesContainerRef.current,
        threshold: 1.0,
    });

    const setMessageRef = useCallback(
        (id: string, node: HTMLElement | null) => {
            if (node) {
                messageRefs.current.set(id, node);
                observe(node);
            } else {
                messageRefs.current.delete(id);
            }
        },
        [observe]
    );

    const getMessageRef = useCallback((id: string) => messageRefs.current.get(id), []);

    useLoadMoreOnScroll({
        isLoadingMore,
        hasMoreMessages,
        loadMoreMessages,
        messagesContainerRef,
        loaderRef,
    });

    // Получаем ID последнего прочитанного сообщения
    const lastReadMessageId =
        participants.find(p => p.userId === currentUser?.id)?.lastReadMessageId ?? null;

    useInitialScroll({
        chatId,
        initialMessagesLoaded: messages.length > 0 && !isLoadingMore,
        lastReadMessageId,
        messagesContainerRef,
        getMessageRef,
        messagesEndRef,
    });

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Простое условие: если мы близко к низу, скроллим при любом новом сообщении.
        // `scrollHeight` - полная высота контента
        // `scrollTop` - насколько проскроллили сверху
        // `clientHeight` - видимая высота контейнера
        const isScrolledToBottom =
            container.scrollHeight - container.scrollTop <= container.clientHeight + 200; // +200px - небольшой "буфер"

        // Получаем последнее сообщение
        const lastMessage = messages[messages.length - 1];

        // Если пришло новое сообщение (от нас или от другого) и мы были внизу,
        // или если последнее сообщение - наше, то скроллим вниз.
        if (lastMessage && (isScrolledToBottom || lastMessage.sender.id === currentUser?.id)) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, messages.length, currentUser?.id, messagesContainerRef, messagesEndRef]);

    return (
        <Box ref={messagesContainerRef} sx={{ p: 2 }}>
            {hasMoreMessages && (
                <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}
            {messages.length > 0 ? (
                messages.map((msg, index) => {
                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];
                    const isSameSender = !!prevMessage && prevMessage.sender.id === msg.sender.id;
                    const isNextMessageFromSameSender =
                        !!nextMessage && nextMessage.sender.id === msg.sender.id;

                    return (
                        <div
                            data-message-id={msg.id}
                            key={msg.id}
                            ref={node => setMessageRef(msg.id, node)}
                        >
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                userRole={userRole}
                                isCurrentUser={msg.sender.id === currentUser?.id}
                                isSameSender={isSameSender}
                                isGroupChat={participants.length > 2}
                                isNextMessageFromSameSender={isNextMessageFromSameSender}
                                participantsCount={participants.length}
                                isGlobalAdmin={currentUser?.role === 'ADMIN'}
                            />
                        </div>
                    );
                })
            ) : (
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                    Сообщений пока нет.
                </Typography>
            )}
            <div ref={messagesEndRef} />
        </Box>
    );
});
