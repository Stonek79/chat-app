import type { SendMessagePayload } from '@chat-app/core';
import type { MessageContentType } from '@chat-app/db';
import { useCallback } from 'react';
import type { AppClientSocket } from '@chat-app/socket-shared';
import {
    CLIENT_EVENT_SEND_MESSAGE,
    CLIENT_EVENT_DELETE_MESSAGE,
    CLIENT_EVENT_MARK_AS_READ,
} from '@chat-app/socket-shared';

export interface UseChatActionsProps {
    chatId: string | null;
    socket: AppClientSocket | null;
    currentUserId: string;
}

export const useChatActions = ({ socket, chatId, currentUserId }: UseChatActionsProps) => {
    const sendMessage = useCallback(
        (content: string, contentType?: MessageContentType, mediaUrl?: string) => {
            if (!socket || !chatId || !currentUserId) return;

            const payload: SendMessagePayload = {
                chatId,
                content,
                contentType: contentType || 'TEXT',
                mediaUrl,
            };

            socket.emit(CLIENT_EVENT_SEND_MESSAGE, payload);
        },
        [socket, chatId, currentUserId]
    );

    const deleteMessage = useCallback(
        async (messageId: string) => {
            if (!socket || !chatId || !currentUserId) return;

            socket.emit(CLIENT_EVENT_DELETE_MESSAGE, {
                messageId,
                chatId,
            });
        },
        [socket, chatId, currentUserId]
    );

    const markMessagesAsRead = useCallback(
        (lastReadMessageId: string) => {
            if (!socket || !chatId || !currentUserId) return;

            socket.emit(CLIENT_EVENT_MARK_AS_READ, {
                chatId,
                lastReadMessageId,
            });
        },
        [socket, chatId, currentUserId]
    );

    return {
        sendMessage,
        deleteMessage,
        markMessagesAsRead,
    };
};
