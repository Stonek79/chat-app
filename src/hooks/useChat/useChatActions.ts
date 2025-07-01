import { useCallback } from 'react';

import {
    API_MESSAGES_ROUTE,
    CLIENT_EVENT_MARK_AS_READ,
    CLIENT_EVENT_SEND_MESSAGE,
} from '@/constants';
import type { AppSocket, ClientSendMessagePayload, MessageContentType } from '@/types';

export interface UseChatActionsProps {
    socket: AppSocket | null;
    chatId: string | null;
    userId: string | null;
}

export interface UseChatActionsReturn {
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    deleteMessage: (messageId: string) => Promise<void>;
    markMessagesAsRead: (lastReadMessageId: string) => void;
}

export const useChatActions = ({
    socket,
    chatId,
    userId,
}: UseChatActionsProps): UseChatActionsReturn => {
    const sendMessage = useCallback(
        (content: string, contentType: MessageContentType = 'TEXT') => {
            if (socket && userId && chatId) {
                const clientTempId = crypto.randomUUID();

                const payload: ClientSendMessagePayload = {
                    chatId,
                    content,
                    contentType,
                    clientTempId,
                };

                socket.emit(CLIENT_EVENT_SEND_MESSAGE, payload, (ack: unknown) => {
                    if (ack && typeof ack === 'object' && 'success' in ack) {
                        const response = ack as {
                            success: boolean;
                            messageId?: string;
                            createdAt?: Date;
                            error?: string;
                        };
                        if (response.success && response.messageId) {
                            console.log(
                                `[useChatActions] Message sent successfully, ID: ${response.messageId}, CreatedAt: ${response.createdAt}`
                            );
                        } else {
                            console.error(
                                `[useChatActions] Failed to send message: ${response.error}`
                            );
                        }
                    } else if (ack) {
                        console.warn(
                            '[useChatActions] Received ack for sent message with unexpected format:',
                            ack
                        );
                    } else {
                        console.log(
                            '[useChatActions] Message sent, no acknowledgement received from server.'
                        );
                    }
                });
            } else {
                console.warn(
                    '[useChatActions] Message not sent: no chatId, user, or socket not connected.',
                    { chatId, userExists: !!userId, socketConnected: socket?.connected }
                );
            }
        },
        [socket, userId, chatId]
    );

    const deleteMessage = useCallback(async (messageId: string) => {
        try {
            const response = await fetch(`${API_MESSAGES_ROUTE}/${messageId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to delete message:', errorData.error);
                throw new Error(errorData.error || 'Failed to delete message');
            }

            console.log(`[useChatActions] Message ${messageId} deletion request sent.`);
        } catch (error) {
            console.error('Error sending deletion request:', error);
        }
    }, []);

    const markMessagesAsRead = useCallback(
        (lastReadMessageId: string) => {
            if (chatId && userId && socket?.connected && lastReadMessageId) {
                socket.emit(CLIENT_EVENT_MARK_AS_READ, {
                    chatId,
                    lastReadMessageId,
                });
            } else {
                console.warn('[useChatActions] Cannot mark messages as read:', {
                    chatId,
                    userExists: !!userId,
                    socketConnected: socket?.connected,
                    lastReadMessageId,
                });
            }
        },
        [chatId, userId, socket]
    );

    return {
        sendMessage,
        deleteMessage,
        markMessagesAsRead,
    };
};
